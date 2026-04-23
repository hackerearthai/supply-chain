const express = require('express');
const Shipment = require('../models/Shipment');
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

// Get shipments with optional filters
router.get('/', getUserId, async (req, res) => {
  try {
    const { status, warehouse, limit = 50 } = req.query;
    let query = { userId: req.userId };

    if (status) query.status = status;
    if (warehouse) query.from_warehouse = warehouse;

    const shipments = await Shipment.find(query)
      .sort({ shipmentDate: -1 })
      .limit(parseInt(limit));

    res.json(shipments);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Get shipment summary
router.get('/summary', getUserId, async (req, res) => {
  try {
    const summary = await Shipment.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          pendingShipments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inTransitShipments: {
            $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] }
          },
          deliveredShipments: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          delayedShipments: {
            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalShipments: 0,
      totalQuantity: 0,
      pendingShipments: 0,
      inTransitShipments: 0,
      deliveredShipments: 0,
      delayedShipments: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get shipment summary error:', error);
    res.status(500).json({
      totalShipments: 0,
      totalQuantity: 0,
      pendingShipments: 0,
      inTransitShipments: 0,
      deliveredShipments: 0,
      delayedShipments: 0
    });
  }
});

// Get shipment status distribution
router.get('/status-distribution', getUserId, async (req, res) => {
  try {
    const distribution = await Shipment.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Get shipment status distribution error:', error);
    res.status(500).json([]);
  }
});

// Create shipment
router.post('/', getUserId, async (req, res) => {
  try {
    const shipment = new Shipment({
      ...req.body,
      userId: req.userId
    });

    await shipment.save();
    res.status(201).json(shipment);
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Update shipment
router.put('/:id', getUserId, async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// Delete shipment
router.delete('/:id', getUserId, async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;