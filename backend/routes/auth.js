const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Login/Register user
router.post('/login', async (req, res) => {
  try {
    const { uid, email, name, avatar } = req.body;

    if (!uid || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await User.findOne({ uid });

    if (!user) {
      user = new User({ uid, email, name, avatar });
      await user.save();
    } else {
      user.email = email;
      user.name = name;
      user.avatar = avatar;
      user.updatedAt = new Date();
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;