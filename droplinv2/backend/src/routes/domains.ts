import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { Domain } from '../models/Domain'

const domainRouter = Router()

// Get all domains for user
domainRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const domains = await Domain.find({ userId: req.userId }).sort('-createdAt')
    res.json(domains)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch domains' })
  }
})

// Create new domain
domainRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, cloudflareZoneId } = req.body

    if (!name || !cloudflareZoneId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const existing = await Domain.findOne({ name })
    if (existing) {
      return res.status(400).json({ error: 'Domain already exists' })
    }

    const domain = new Domain({
      userId: req.userId,
      name,
      cloudflareZoneId,
      status: 'active',
    })

    await domain.save()
    res.status(201).json(domain)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create domain' })
  }
})

export default domainRouter
