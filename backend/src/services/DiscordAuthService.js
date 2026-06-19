import axios from 'axios'
import { User } from '../models/User.js'
import { createJWT } from '../middleware/auth.js'

class DiscordAuthService {
  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || ''
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || ''
    this.redirectUri = process.env.DISCORD_REDIRECT_URI || ''
  }

  async getAccessToken(code) {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    })
    const { data } = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return data.access_token
  }

  async getUserInfo(accessToken) {
    const { data } = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return data
  }

  async authenticate(code) {
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
      user.token = createJWT(user._id.toString())
      await user.save()
    }

    return {
      token: user.token,
      user: { id: user._id, email: user.email, username: user.username, avatar: user.avatar },
    }
  }
}

export const discordAuthService = new DiscordAuthService()
