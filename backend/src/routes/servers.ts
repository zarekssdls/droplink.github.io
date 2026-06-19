import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { GameServer } from '../models/GameServer'
import { DNSRecord } from '../models/DNSRecord'
import { cloudflareService } from '../services/CloudflareService'

const serverRouter = Router()

// Get all servers for user
serverRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { domain } = req.query
    const query: any = { userId: req.userId }

    if (domain) {
      query.domain = domain
    }

    const servers = await GameServer.find(query).sort('-createdAt')
    res.json(servers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' })
  }
})

// Create new server
serverRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, gameType, maxPlayers, domain } = req.body

    if (!name || !gameType || !maxPlayers || !domain) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Generate subdomain (simple version)
    const subdomain = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    const server = new GameServer({
      userId: req.userId,
      name,
      gameType,
      maxPlayers,
      subdomain,
      domain,
      ip: '0.0.0.0', // Will be set in production
      port: 25565,
    })

    await server.save()

    // Create DNS record in Cloudflare
    try {
      // This would connect to actual Cloudflare API
      // const record = await cloudflareService.createDNSRecord(...)
      // For now, just mark as pending
    } catch (error) {
      console.error('DNS creation error:', error)
    }

    res.status(201).json(server)
  } catch (error) {
    console.error('Error creating server:', error)
    res.status(500).json({ error: 'Failed to create server' })
  }
})

// Update server
serverRouter.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const server = await GameServer.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    )

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    res.json(server)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update server' })
  }
})

// Delete server
serverRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const server = await GameServer.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!server) {
      return res.status(404).json({ error: 'Server not found' })
    }

    // Delete associated DNS record
    await DNSRecord.deleteOne({
      userId: req.userId,
      subdomain: server.subdomain,
    })

    res.json({ message: 'Server deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete server' })
  }
})

export default serverRouter
