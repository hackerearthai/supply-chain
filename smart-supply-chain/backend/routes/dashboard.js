const express = require('express');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Warehouse = require('../models/Warehouse');
const router = express.Router();

// Middleware to get userId
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  req.userId = userId;
  next();
};

// Get dashboard summary
router.get('/summary', getUserId, async (req, res) => {
  try {
    const userId = req.userId;

    // Get inventory summary
    const inventoryStats = await Inventory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          skuSet: { $addToSet: '$sku' },
          totalStock: { $sum: '$quantity' },
          lowStockItems: {
            $sum: {
              $cond: [{ $lt: ['$quantity', '$minStock'] }, 1, 0]
            }
          },
          avgStock: { $avg: '$quantity' }
        }
      },
      {
        $project: {
          totalProducts: { $size: { $ifNull: ['$skuSet', []] } },
          totalStock: 1,
          lowStockItems: 1,
          avgStock: 1
        }
      }
    ]);

    // Get order summary
    const orderStats = await Order.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalOrderQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Get shipment summary
    const shipmentStats = await Shipment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get warehouse summary
    const warehouseStats = await Warehouse.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalCurrentStock: { $sum: '$currentStock' }
        }
      }
    ]);

    const ordersPerWarehouse = await Order.aggregate([
      {
        $match: {
          userId,
          warehouse: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$warehouse',
          count: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Safe defaults
    const inventory = inventoryStats[0] || {
      totalProducts: 0,
      totalStock: 0,
      lowStockItems: 0,
      avgStock: 0
    };

    const orders = orderStats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      totalOrderQuantity: 0
    };

    const shipments = shipmentStats[0] || {
      totalShipments: 0,
      inTransit: 0,
      delivered: 0
    };

    const warehouses = warehouseStats[0] || {
      totalWarehouses: 0,
      totalCapacity: 0,
      totalCurrentStock: 0
    };

    res.json({
      inventory,
      orders,
      shipments,
      warehouses,
      ordersPerWarehouse: ordersPerWarehouse.map((item) => ({
        warehouse: item._id,
        count: item.count
      })),
      alerts: [
        {
          id: 'low-stock',
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${inventory.lowStockItems} products are below minimum stock levels`,
          count: inventory.lowStockItems
        },
        {
          id: 'pending-orders',
          type: 'info',
          title: 'Pending Orders',
          message: `${orders.pendingOrders} orders are waiting to be processed`,
          count: orders.pendingOrders
        }
      ].filter(alert => alert.count > 0)
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      inventory: { totalProducts: 0, totalStock: 0, lowStockItems: 0, avgStock: 0 },
      orders: { totalOrders: 0, pendingOrders: 0, totalOrderQuantity: 0 },
      shipments: { totalShipments: 0, inTransit: 0, delivered: 0 },
      warehouses: { totalWarehouses: 0, totalCapacity: 0, totalCurrentStock: 0 },
      alerts: []
    });
  }
});

module.exports = router;
