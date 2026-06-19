import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { discordAuthService } from '../services/DiscordAuthService'

const authRouter = Router()

// Discord OAuth callback
authRouter.post('/discord/callback', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'No code provided' })
    }

    const { token, user } = await discordAuthService.authenticate(code)

    res.json({
      token,
      user,
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

// Get current user
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ userId: req.userId, user: req.user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default authRouter
