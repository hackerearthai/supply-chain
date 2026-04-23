const express = require('express');
const Warehouse = require('../models/Warehouse');
const router = express.Router();

// Middleware to get userId
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  req.userId = userId;
  next();
};

// Get all warehouses
router.get('/', getUserId, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ userId: req.userId }).sort({ created_at: -1 });
    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// Add new warehouse
router.post('/', getUserId, async (req, res) => {
  try {
    const { warehouse_name, location, pincode, city, state, latitude, longitude, capacity } = req.body;

    if (!warehouse_name || !location || !pincode) {
      return res.status(400).json({ error: 'Warehouse name, location, and pincode are required' });
    }

    const warehouse = new Warehouse({
      userId: req.userId,
      warehouse_name,
      location,
      pincode,
      city,
      state,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      capacity: capacity ? parseInt(capacity) : 0
    });

    await warehouse.save();
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Add warehouse error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Warehouse name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add warehouse' });
    }
  }
});

// Update warehouse
router.put('/:id', getUserId, async (req, res) => {
  try {
    const { warehouse_name, location, pincode, city, state, latitude, longitude, capacity } = req.body;

    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        warehouse_name,
        location,
        pincode,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        capacity: capacity ? parseInt(capacity) : 0
      },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(warehouse);
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

// Delete warehouse
router.delete('/:id', getUserId, async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

module.exports = router;
