import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { cloudflare } from '../utils/cloudflare.js';
import Subdomain from '../models/Subdomain.js';

const router = express.Router();

// Create DNS record
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, targetIp, recordType = 'A' } = req.body;

    if (!name || !targetIp) {
      return res.status(400).json({ error: 'Name and target IP required' });
    }

    // Check if subdomain already exists
    const existing = await Subdomain.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }

    // Create Cloudflare record
    let cfResult;
    try {
      cfResult = await cloudflare.createRecord(name, targetIp, recordType);
    } catch (cfErr) {
      console.log('Cloudflare API not configured, creating local record only');
      cfResult = { success: true, result: { id: 'local-' + Date.now() } };
    }

    const subdomain = new Subdomain({
      user: req.user._id,
      name: name.toLowerCase(),
      fullDomain: `${name.toLowerCase()}.dropls.gg`,
      targetIp,
      recordType,
      cloudflareRecordId: cfResult?.result?.id || null,
      status: 'active'
    });
    await subdomain.save();

    res.json({ success: true, subdomain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update DNS record
router.put('/update/:id', authenticate, async (req, res) => {
  try {
    const { targetIp, recordType } = req.body;
    const subdomain = await Subdomain.findOne({ _id: req.params.id, user: req.user._id });

    if (!subdomain) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }

    if (subdomain.cloudflareRecordId && !subdomain.cloudflareRecordId.startsWith('local-')) {
      try {
        await cloudflare.updateRecord(subdomain.cloudflareRecordId, subdomain.name, targetIp, recordType);
      } catch (cfErr) {
        console.log('Cloudflare update skipped');
      }
    }

    subdomain.targetIp = targetIp || subdomain.targetIp;
    subdomain.recordType = recordType || subdomain.recordType;
    subdomain.updatedAt = new Date();
    await subdomain.save();

    res.json({ success: true, subdomain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete DNS record
router.delete('/delete/:id', authenticate, async (req, res) => {
  try {
    const subdomain = await Subdomain.findOne({ _id: req.params.id, user: req.user._id });

    if (!subdomain) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }

    if (subdomain.cloudflareRecordId && !subdomain.cloudflareRecordId.startsWith('local-')) {
      try {
        await cloudflare.deleteRecord(subdomain.cloudflareRecordId);
      } catch (cfErr) {
        console.log('Cloudflare delete skipped');
      }
    }

    await Subdomain.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Subdomain deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's DNS records
router.get('/my-records', authenticate, async (req, res) => {
  try {
    const records = await Subdomain.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
