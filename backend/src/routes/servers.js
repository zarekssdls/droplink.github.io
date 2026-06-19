import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { GameServer } from '../models/GameServer.js'
import { DNSRecord } from '../models/DNSRecord.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = { userId: req.userId }
    if (req.query.domain) query.domain = req.query.domain
    const servers = await GameServer.find(query).sort('-createdAt')
    res.json(servers)
  } catch {
    res.status(500).json({ error: 'Failed to fetch servers' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, gameType, maxPlayers, domain } = req.body
    if (!name || !gameType || !maxPlayers || !domain) return res.status(400).json({ error: 'Missing required fields' })
    const subdomain = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const server = await GameServer.create({
      userId: req.userId, name, gameType, maxPlayers, subdomain, domain,
      ip: '0.0.0.0', port: 25565,
    })
    res.status(201).json(server)
  } catch (err) {
    console.error('Error creating server:', err)
    res.status(500).json({ error: 'Failed to create server' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const server = await GameServer.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    )
    if (!server) return res.status(404).json({ error: 'Server not found' })
    res.json(server)
  } catch {
    res.status(500).json({ error: 'Failed to update server' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const server = await GameServer.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    if (!server) return res.status(404).json({ error: 'Server not found' })
    await DNSRecord.deleteOne({ userId: req.userId, subdomain: server.subdomain })
    res.json({ message: 'Server deleted' })
  } catch {
    res.status(500).json({ error: 'Failed to delete server' })
  }
})

export default router
