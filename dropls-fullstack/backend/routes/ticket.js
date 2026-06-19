import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Create ticket
router.post('/', authenticate, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = new Ticket({
      user: req.user._id,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium'
    });
    await ticket.save();

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add response
router.post('/:id/respond', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });

    if (!ticket) return res.status(404).json({ error: 'Not found' });

    ticket.responses.push({ from: 'user', message });
    ticket.updatedAt = new Date();
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
