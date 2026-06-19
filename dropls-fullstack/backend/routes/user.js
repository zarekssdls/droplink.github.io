import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    res.json({ balance: req.user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get referral info
router.get('/referral', authenticate, async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user.referralCode });
    res.json({
      code: req.user.referralCode,
      count: referrals.length,
      earnings: referrals.length * 5 // $5 per referral
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
