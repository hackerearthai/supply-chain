const express = require('express');
const Order = require('../models/Order');
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

// Get orders with optional filters
router.get('/', getUserId, async (req, res) => {
  try {
    const { status, warehouse, limit = 50 } = req.query;
    let query = { userId: req.userId };

    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;

    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(parseInt(limit));

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order summary
router.get('/summary', getUserId, async (req, res) => {
  try {
    const summary = await Order.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalOrders: 0,
      totalQuantity: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get order summary error:', error);
    res.status(500).json({
      totalOrders: 0,
      totalQuantity: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0
    });
  }
});

// Get orders by warehouse
router.get('/by-warehouse', getUserId, async (req, res) => {
  try {
    const orders = await Order.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$warehouse',
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);

    res.json(orders);
  } catch (error) {
    console.error('Get orders by warehouse error:', error);
    res.status(500).json([]);
  }
});

// Get order trends (last 30 days)
router.get('/trends', getUserId, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Order.aggregate([
      {
        $match: {
          userId: req.userId,
          orderDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
          },
          orders: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    console.error('Get order trends error:', error);
    res.status(500).json([]);
  }
});

// Create order
router.post('/', getUserId, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      userId: req.userId
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', getUserId, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', getUserId, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;