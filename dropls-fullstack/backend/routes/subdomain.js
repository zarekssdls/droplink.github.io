import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Subdomain from '../models/Subdomain.js';

const router = express.Router();

// Get all user's subdomains (dashboard data)
router.get('/', authenticate, async (req, res) => {
  try {
    const subdomains = await Subdomain.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(subdomains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subdomain stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Subdomain.countDocuments({ user: req.user._id });
    const active = await Subdomain.countDocuments({ user: req.user._id, status: 'active' });
    const suspended = await Subdomain.countDocuments({ user: req.user._id, status: 'suspended' });

    res.json({ total, active, suspended });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single subdomain
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subdomain = await Subdomain.findOne({ _id: req.params.id, user: req.user._id });
    if (!subdomain) return res.status(404).json({ error: 'Not found' });
    res.json(subdomain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
