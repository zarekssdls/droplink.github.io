import mongoose from 'mongoose'

export interface IGameServer {
  _id: string
  userId: string
  name: string
  gameType: string
  subdomain: string
  domain: string
  ip: string
  port: number
  maxPlayers: number
  status: 'online' | 'offline'
  players?: number
  createdAt: Date
  updatedAt: Date
}

const gameServerSchema = new mongoose.Schema<IGameServer>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    gameType: { type: String, required: true },
    subdomain: { type: String, required: true, index: true },
    domain: { type: String, required: true },
    ip: { type: String, required: true },
    port: { type: Number, default: 25565 },
    maxPlayers: { type: Number, required: true },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    players: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const GameServer = mongoose.model<IGameServer>('GameServer', gameServerSchema)
