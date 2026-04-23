const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Warehouse = require('../models/Warehouse');

const router = express.Router();

let pincodeMap = {};

function loadPincodeData() {
  const pincodeFile = path.join(__dirname, '../../pincode.csv');
  if (!fs.existsSync(pincodeFile)) {
    console.warn('pincode.csv not found at supply-chain/pincode.csv');
    return;
  }

  fs.createReadStream(pincodeFile)
    .pipe(csv())
    .on('data', (row) => {
      const pincode = (row.pincode || row.Pincode)?.toString().trim();
      const latitude = row.latitude || row.Latitude;
      const longitude = row.longitude || row.Longitude;
      const state = row.state || row.State;

      if (pincode) {
        pincodeMap[pincode] = {
          lat: parseFloat(latitude),
          lon: parseFloat(longitude),
          state
        };
      }
    })
    .on('end', () => {
      console.log(`Loaded ${Object.keys(pincodeMap).length} pincodes`);
    })
    .on('error', (error) => {
      console.error('Error loading pincode data:', error);
    });
}

loadPincodeData();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeSku(value = '') {
  return value.toString().trim().toLowerCase();
}

function normalizeText(value = '') {
  return value.toString().trim().toLowerCase();
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSkuRegex(search = '') {
  const normalized = normalizeSku(search);
  return normalized ? new RegExp(escapeRegex(normalized), 'i') : null;
}

const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  req.userId = userId;
  next();
};

router.get('/', getUserId, async (req, res) => {
  try {
    const [totalSkus, totalOrderLines, topSkus] = await Promise.all([
      Order.distinct('sku', { userId: req.userId, sku: { $exists: true, $ne: '' } }),
      Order.countDocuments({ userId: req.userId }),
      Order.aggregate([
        { $match: { userId: req.userId, sku: { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$sku',
            totalQuantity: { $sum: '$quantity' },
            locations: { $addToSet: '$location' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 8 }
      ])
    ]);

    res.json({
      totalSkus: totalSkus.length,
      totalOrderLines,
      topSkus: topSkus.map((item) => ({
        sku: item._id,
        totalQuantity: item.totalQuantity,
        locationCount: item.locations.filter(Boolean).length
      }))
    });
  } catch (error) {
    console.error('Demand forecast summary error:', error);
    res.status(500).json({ error: 'Failed to fetch demand summary' });
  }
});

router.get('/skus', getUserId, async (req, res) => {
  try {
    const search = (req.query.search || '').toString();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
    const searchRegex = buildSkuRegex(search);
    const skuMatch = searchRegex ? { $regex: searchRegex } : { $exists: true, $ne: '' };

    const [orderSkuData, inventorySkuData] = await Promise.all([
      Order.aggregate([
        { $match: { userId: req.userId, sku: skuMatch } },
        {
          $group: {
            _id: '$sku',
            totalQuantity: { $sum: '$quantity' },
            latestOrderDate: { $max: '$orderDate' }
          }
        }
      ]),
      Inventory.aggregate([
        { $match: { userId: req.userId, sku: skuMatch } },
        {
          $group: {
            _id: '$sku',
            inventoryQuantity: { $sum: '$quantity' },
            latestInventoryUpdate: { $max: '$lastUpdated' }
          }
        }
      ])
    ]);

    const merged = new Map();

    orderSkuData.forEach((item) => {
      merged.set(item._id, {
        sku: item._id,
        totalQuantity: item.totalQuantity || 0,
        inventoryQuantity: 0,
        latestOrderDate: item.latestOrderDate || null,
        latestInventoryUpdate: null
      });
    });

    inventorySkuData.forEach((item) => {
      const existing = merged.get(item._id) || {
        sku: item._id,
        totalQuantity: 0,
        inventoryQuantity: 0,
        latestOrderDate: null,
        latestInventoryUpdate: null
      };
      existing.inventoryQuantity = item.inventoryQuantity || 0;
      existing.latestInventoryUpdate = item.latestInventoryUpdate || null;
      merged.set(item._id, existing);
    });

    const searchValue = normalizeSku(search);
    const suggestions = Array.from(merged.values())
      .sort((a, b) => {
        const aExact = a.sku === searchValue ? 1 : 0;
        const bExact = b.sku === searchValue ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        const aStarts = searchValue && a.sku.startsWith(searchValue) ? 1 : 0;
        const bStarts = searchValue && b.sku.startsWith(searchValue) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        if ((b.totalQuantity || 0) !== (a.totalQuantity || 0)) {
          return (b.totalQuantity || 0) - (a.totalQuantity || 0);
        }

        if ((b.inventoryQuantity || 0) !== (a.inventoryQuantity || 0)) {
          return (b.inventoryQuantity || 0) - (a.inventoryQuantity || 0);
        }

        return a.sku.localeCompare(b.sku);
      })
      .slice(0, limit);

    res.json(suggestions);
  } catch (error) {
    console.error('SKU suggestion error:', error);
    res.status(500).json({ error: 'Failed to fetch SKU suggestions' });
  }
});

function preprocessData(data) {
  return data.map((row) => {
    const normalized = {};
    for (const key in row) {
      normalized[key.toLowerCase().trim()] = row[key]?.toString().trim();
    }
    if (normalized.sku) {
      normalized.sku = normalizeSku(normalized.sku);
    }
    return normalized;
  });
}

function validateColumns(data) {
  if (data.length === 0) return false;
  const required = ['quantity', 'sku', 'location', 'pincode'];
  const keys = Object.keys(data[0]);
  return required.every((col) => keys.includes(col));
}

function calculateDemand(data) {
  const skuDemand = {};

  data.forEach((row) => {
    const sku = normalizeSku(row.sku);
    const location = row.location;
    const pincode = row.pincode;
    const quantity = Math.max(parseFloat(row.quantity) || 0, 0);
    const warehouse = row.warehouse || null;
    const orderDate = row.date || null;

    if (!sku) return;

    if (!skuDemand[sku]) {
      skuDemand[sku] = { total_quantity: 0, locations: {} };
    }

    skuDemand[sku].total_quantity += quantity;

    if (!skuDemand[sku].locations[location]) {
      skuDemand[sku].locations[location] = { quantity: 0, pincode, warehouse, dates: [] };
    }

    skuDemand[sku].locations[location].quantity += quantity;
    if (warehouse) {
      skuDemand[sku].locations[location].warehouse = warehouse;
    }
    if (orderDate) {
      skuDemand[sku].locations[location].dates.push(orderDate);
    }
  });

  return skuDemand;
}

function ensureWarehouseList(demand, warehouses) {
  const warehouseMap = new Map();

  (warehouses || []).forEach((wh) => {
    if (!wh) return;
    const key = normalizeText(wh.warehouse_name || `${wh.location}-${wh.pincode}`);
    if (!warehouseMap.has(key)) {
      warehouseMap.set(key, wh);
    }
  });

  for (const sku in demand) {
    for (const demandLoc in demand[sku].locations) {
      const loc = demand[sku].locations[demandLoc];
      const explicitWarehouse = loc.warehouse ? loc.warehouse.toString().trim() : '';
      if (!explicitWarehouse) continue;

      const key = normalizeText(explicitWarehouse);
      if (!warehouseMap.has(key)) {
        warehouseMap.set(key, {
          warehouse_name: explicitWarehouse,
          location: demandLoc,
          pincode: loc.pincode || '',
          capacity: null
        });
      }
    }
  }

  return Array.from(warehouseMap.values());
}

function findBestWarehouseForLocation(demandLocation, warehouses) {
  const explicitWarehouse = demandLocation.warehouse ? normalizeText(demandLocation.warehouse) : '';
  if (explicitWarehouse) {
    const matchedWarehouse = warehouses.find((wh) => normalizeText(wh.warehouse_name) === explicitWarehouse);
    if (matchedWarehouse) {
      return { warehouse: matchedWarehouse, distanceKm: 0, source: 'explicit' };
    }
  }

  const demandLocationText = normalizeText(demandLocation.location);
  const demandCoord = demandLocation.pincode && pincodeMap[demandLocation.pincode]
    ? pincodeMap[demandLocation.pincode]
    : null;

  let best = null;

  warehouses.forEach((wh) => {
    if (!wh) return;

    let score = 0;
    let distanceKm = null;

    if (normalizeText(wh.location) === demandLocationText && demandLocationText) {
      score += 80;
    }

    if (demandCoord && wh.pincode && pincodeMap[wh.pincode]) {
      const whCoord = pincodeMap[wh.pincode];
      distanceKm = calculateDistance(demandCoord.lat, demandCoord.lon, whCoord.lat, whCoord.lon);
      score += Math.max(0, 60 - Math.min(distanceKm, 60));
    } else if (normalizeText(wh.pincode) === normalizeText(demandLocation.pincode) && demandLocation.pincode) {
      distanceKm = 0;
      score += 60;
    }

    if (normalizeText(wh.warehouse_name).includes(demandLocationText) && demandLocationText) {
      score += 20;
    }

    if (!best || score > best.score || (score === best.score && (distanceKm ?? Infinity) < (best.distanceKm ?? Infinity))) {
      best = {
        warehouse: wh,
        score,
        distanceKm,
        source: distanceKm !== null ? 'distance' : 'location'
      };
    }
  });

  return best;
}

function mapDemandToWarehouses(demand, warehouses) {
  const mapping = {};

  for (const sku in demand) {
    mapping[sku] = {};
    for (const demandLoc in demand[sku].locations) {
      const demandLocation = {
        ...demand[sku].locations[demandLoc],
        location: demandLoc
      };
      mapping[sku][demandLoc] = findBestWarehouseForLocation(demandLocation, warehouses);
    }
  }

  return mapping;
}

function buildInventoryMaps(inventoryRows) {
  const skuInventoryByWarehouse = {};
  const totalInventoryByWarehouse = {};

  (inventoryRows || []).forEach((row) => {
    const warehouseKey = normalizeText(row.warehouse || `${row.location}-${row.pincode || ''}`);
    if (!warehouseKey) return;

    totalInventoryByWarehouse[warehouseKey] = (totalInventoryByWarehouse[warehouseKey] || 0) + (parseFloat(row.quantity) || 0);

    const sku = normalizeSku(row.sku);
    if (!sku) return;

    if (!skuInventoryByWarehouse[sku]) {
      skuInventoryByWarehouse[sku] = {};
    }

    skuInventoryByWarehouse[sku][warehouseKey] = (skuInventoryByWarehouse[sku][warehouseKey] || 0) + (parseFloat(row.quantity) || 0);
  });

  return { skuInventoryByWarehouse, totalInventoryByWarehouse };
}

function allocateStockToWarehouses(demand, warehouseMapping, totalProduction, minStock = 0, inventoryRows = []) {
  const results = [];
  const { skuInventoryByWarehouse, totalInventoryByWarehouse } = buildInventoryMaps(inventoryRows);

  for (const sku in demand) {
    const { total_quantity, locations } = demand[sku];
    const warehouseDemand = {};

    for (const loc in locations) {
      const mapped = warehouseMapping[sku][loc];
      if (!mapped?.warehouse) continue;

      const wh = mapped.warehouse;
      const whKey = normalizeText(wh.warehouse_name || `${wh.location}-${wh.pincode}`);

      if (!warehouseDemand[whKey]) {
        warehouseDemand[whKey] = {
          warehouse: wh,
          demand_quantity: 0,
          dates: [],
          served_locations: [],
          distance_sum: 0,
          distance_count: 0
        };
      }

      warehouseDemand[whKey].demand_quantity += locations[loc].quantity;
      warehouseDemand[whKey].dates.push(...locations[loc].dates);

      if (typeof mapped.distanceKm === 'number') {
        warehouseDemand[whKey].distance_sum += mapped.distanceKm;
        warehouseDemand[whKey].distance_count += 1;
      }

      warehouseDemand[whKey].served_locations.push({
        location: loc,
        pincode: locations[loc].pincode,
        demand_quantity: locations[loc].quantity
      });
    }

    const warehouseKeys = Object.keys(warehouseDemand);
    if (warehouseKeys.length === 0) {
      results.push({ sku, total_quantity, allocation: [] });
      continue;
    }

    const totalDemandQuantity = warehouseKeys.reduce((sum, whKey) => sum + warehouseDemand[whKey].demand_quantity, 0);

    const metrics = warehouseKeys.map((whKey) => {
      const entry = warehouseDemand[whKey];
      const demandQuantity = entry.demand_quantity;
      const currentStock = skuInventoryByWarehouse[sku]?.[whKey] || 0;
      const totalWarehouseStock = totalInventoryByWarehouse[whKey] || 0;
      const avgDistance = entry.distance_count ? entry.distance_sum / entry.distance_count : null;
      const distanceBoost = avgDistance === null ? 1 : Math.max(0.55, 1.25 - Math.min(avgDistance, 1200) / 2000);
      const safetyStock = Math.max(minStock, Math.ceil(demandQuantity * 0.15));
      const replenishmentNeed = Math.max(demandQuantity + safetyStock - currentStock, 0);
      const demandGap = Math.max(demandQuantity - currentStock, 0);
      const ratio = totalDemandQuantity > 0 ? demandQuantity / totalDemandQuantity : 1 / warehouseKeys.length;
      const rawPriority = ((replenishmentNeed * 0.75) + (demandGap * 0.25) + safetyStock) * distanceBoost;
      const warehouseCapacity = typeof entry.warehouse.capacity === 'number' ? entry.warehouse.capacity : null;
      const remainingCapacity = warehouseCapacity !== null ? Math.max(warehouseCapacity - totalWarehouseStock, 0) : null;

      return {
        whKey,
        ratio,
        currentStock,
        avgDistance,
        replenishmentNeed,
        remainingCapacity,
        priority: rawPriority > 0 ? rawPriority : Math.max(demandQuantity * distanceBoost, 1)
      };
    });

    const totalPriority = metrics.reduce((sum, item) => sum + item.priority, 0) || metrics.length;
    const tempAllocation = {};
    let totalAllocated = 0;

    metrics.forEach((metric) => {
      const proportional = Math.floor((metric.priority / totalPriority) * totalProduction);
      const targetAllocation = metric.replenishmentNeed > 0
        ? Math.max(proportional, Math.min(metric.replenishmentNeed, totalProduction))
        : proportional;
      const cappedAllocation = metric.remainingCapacity !== null
        ? Math.min(targetAllocation, metric.remainingCapacity)
        : targetAllocation;
      tempAllocation[metric.whKey] = Math.max(cappedAllocation, 0);
      totalAllocated += tempAllocation[metric.whKey];
    });

    if (totalAllocated > totalProduction) {
      let excess = totalAllocated - totalProduction;
      [...metrics]
        .sort((a, b) => a.priority - b.priority)
        .forEach((metric) => {
          if (excess <= 0) return;
          const reducible = tempAllocation[metric.whKey];
          const reduceBy = Math.min(reducible, excess);
          tempAllocation[metric.whKey] -= reduceBy;
          excess -= reduceBy;
        });
      totalAllocated = totalProduction - excess;
    }

    let remainder = totalProduction - totalAllocated;
    [...metrics]
      .sort((a, b) => b.priority - a.priority)
      .forEach((metric) => {
        if (remainder <= 0) return;
        if (metric.remainingCapacity !== null && tempAllocation[metric.whKey] >= metric.remainingCapacity) return;
        tempAllocation[metric.whKey] += 1;
        remainder -= 1;
      });

    const allocation = metrics
      .map((metric) => {
        const entry = warehouseDemand[metric.whKey];
        const wh = entry.warehouse;
        return {
          warehouse: wh.warehouse_name,
          warehouse_location: wh.location,
          pincode: wh.pincode,
          demand_ratio: metric.ratio,
          allocated_stock: tempAllocation[metric.whKey] || 0,
          demand_quantity: entry.demand_quantity,
          current_stock: metric.currentStock,
          replenishment_need: metric.replenishmentNeed,
          average_distance_km: metric.avgDistance,
          dates: entry.dates,
          served_locations: entry.served_locations
        };
      })
      .sort((a, b) => b.allocated_stock - a.allocated_stock || b.demand_quantity - a.demand_quantity);

    results.push({
      sku,
      total_quantity,
      allocation
    });
  }

  return results;
}

router.post('/allocate-stock', getUserId, (req, res) => {
  try {
    const { csvData, totalProduction, minStock, sku } = req.body;

    if (typeof totalProduction !== 'number' || totalProduction <= 0) {
      return res.status(400).json({ error: 'Invalid input: totalProduction number required' });
    }

    const normalizedSku = normalizeSku(sku);
    const minStockValue = typeof minStock === 'number' ? minStock : 0;

    const buildAllocation = (sourceRows, warehouses, inventoryRows) => {
      const processedData = preprocessData(sourceRows);

      if (!validateColumns(processedData)) {
        return res.status(400).json({ error: 'Invalid order data. Required: quantity, sku, location, pincode' });
      }

      const demand = calculateDemand(processedData);
      const warehouseList = ensureWarehouseList(demand, warehouses);
      const warehouseMapping = mapDemandToWarehouses(demand, warehouseList);
      const allocationResults = allocateStockToWarehouses(
        demand,
        warehouseMapping,
        totalProduction,
        minStockValue,
        inventoryRows
      );

      return res.json({
        success: true,
        results: allocationResults
      });
    };

    Promise.all([
      csvData && Array.isArray(csvData)
        ? Promise.resolve(csvData)
        : Order.find({
          userId: req.userId,
          ...(normalizedSku ? { sku: normalizedSku } : {})
        }).select('sku quantity location pincode warehouse orderDate').lean(),
      Warehouse.find({ userId: req.userId }).lean(),
      Inventory.find({
        userId: req.userId,
        ...(normalizedSku ? { sku: normalizedSku } : {})
      }).select('sku quantity warehouse location pincode lastUpdated').lean()
    ])
      .then(([rows, warehouses, inventoryRows]) => {
        const sourceRows = (rows || []).map((row) => ({
          sku: row.sku,
          quantity: row.quantity,
          location: row.location,
          pincode: row.pincode,
          warehouse: row.warehouse,
          date: row.orderDate
        }));

        if (sourceRows.length === 0) {
          const inventoryOnly = (inventoryRows || []).length > 0;
          return res.status(404).json({
            error: normalizedSku
              ? (inventoryOnly
                ? `SKU ${normalizedSku} exists in inventory, but no order demand was found for allocation`
                : `SKU ${normalizedSku} not found in uploaded order demand data`)
              : 'No order demand found'
          });
        }

        buildAllocation(sourceRows, warehouses, inventoryRows || []);
      })
      .catch((error) => {
        console.error('Stock allocation data fetch error:', error);
        res.status(500).json({ error: 'Failed to load demand allocation data' });
      });
  } catch (error) {
    console.error('Stock allocation error:', error);
    res.status(500).json({ error: 'Failed to allocate stock' });
  }
});

module.exports = router;
