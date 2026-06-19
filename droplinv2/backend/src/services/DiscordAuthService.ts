import axios from 'axios'
import { User } from '../models/User'
import { createJWT } from '../middleware/auth'

interface DiscordUser {
  id: string
  email: string
  username: string
  avatar?: string
}

export class DiscordAuthService {
  private clientId = process.env.DISCORD_CLIENT_ID || ''
  private clientSecret = process.env.DISCORD_CLIENT_SECRET || ''
  private redirectUri = process.env.DISCORD_REDIRECT_URI || ''

  async getAccessToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://discord.com/api/v10/oauth2/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      return response.data.access_token
    } catch (error) {
      console.error('Discord token error:', error)
      throw new Error('Failed to get Discord access token')
    }
  }

  async getUserInfo(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      return response.data
    } catch (error) {
      console.error('Discord user info error:', error)
      throw new Error('Failed to get Discord user info')
    }
  }

  async authenticate(code: string): Promise<{ token: string; user: any }> {
    try {
      const accessToken = await this.getAccessToken(code)
      const discordUser = await this.getUserInfo(accessToken)

      let user = await User.findOne({ discordId: discordUser.id })

      if (!user) {
        const jwtToken = createJWT(discordUser.id)
        user = await User.create({
          discordId: discordUser.id,
          email: discordUser.email,
          username: discordUser.username,
          avatar: discordUser.avatar,
          token: jwtToken,
        })
      } else {
        const jwtToken = createJWT(user._id.toString())
        user.token = jwtToken
        await user.save()
      }

      return {
        token: user.token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
      }
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }
}

export const discordAuthService = new DiscordAuthService()
