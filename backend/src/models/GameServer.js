import mongoose from 'mongoose'

const gameServerSchema = new mongoose.Schema(
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

export const GameServer = mongoose.model('GameServer', gameServerSchema)
