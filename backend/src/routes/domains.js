import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { Domain } from '../models/Domain.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const domains = await Domain.find({ userId: req.userId }).sort('-createdAt')
    res.json(domains)
  } catch {
    res.status(500).json({ error: 'Failed to fetch domains' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, cloudflareZoneId } = req.body
    if (!name || !cloudflareZoneId) return res.status(400).json({ error: 'Missing required fields' })
    if (await Domain.findOne({ name })) return res.status(400).json({ error: 'Domain already exists' })
    const domain = await Domain.create({ userId: req.userId, name, cloudflareZoneId, status: 'active' })
    res.status(201).json(domain)
  } catch {
    res.status(500).json({ error: 'Failed to create domain' })
  }
})

export default router
