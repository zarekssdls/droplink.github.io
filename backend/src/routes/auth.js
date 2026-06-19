import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { discordAuthService } from '../services/DiscordAuthService.js'

const router = Router()

router.post('/discord/callback', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'No code provided' })
    const result = await discordAuthService.authenticate(code)
    res.json(result)
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  res.json({ userId: req.userId, user: req.user })
})

export default router
