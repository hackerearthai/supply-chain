const express = require('express');
const Inventory = require('../models/Inventory');
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

// Get inventory with optional filters
router.get('/', getUserId, async (req, res) => {
  try {
    const { warehouse, product, lowStock } = req.query;
    let query = { userId: req.userId };

    if (warehouse) query.warehouse = warehouse;
    if (product) query.product = new RegExp(product, 'i');
    if (lowStock === 'true') {
      query.$expr = { $lt: ['$quantity', '$minStock'] };
    }

    const inventory = await Inventory.find(query).sort({ product: 1 });
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get inventory summary
router.get('/summary', getUserId, async (req, res) => {
  try {
    const summary = await Inventory.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
          lowStockCount: {
            $sum: { $cond: [{ $lt: ['$quantity', '$minStock'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0
    });
  }
});

// Get inventory by warehouse
router.get('/by-warehouse', getUserId, async (req, res) => {
  try {
    const inventory = await Inventory.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$warehouse',
          products: { $sum: 1 },
          totalStock: { $sum: '$quantity' },
          lowStockItems: {
            $sum: { $cond: [{ $lt: ['$quantity', '$minStock'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalStock: -1 } }
    ]);

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory by warehouse error:', error);
    res.status(500).json([]);
  }
});

// Add inventory item
router.post('/', getUserId, async (req, res) => {
  try {
    const inventory = new Inventory({
      ...req.body,
      userId: req.userId
    });

    await inventory.save();
    res.status(201).json(inventory);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Update inventory
router.put('/:id', getUserId, async (req, res) => {
  try {
    const inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, lastUpdated: new Date() },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(inventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Delete inventory
router.delete('/:id', getUserId, async (req, res) => {
  try {
    const inventory = await Inventory.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Failed to delete inventory' });
  }
});

module.exports = router;