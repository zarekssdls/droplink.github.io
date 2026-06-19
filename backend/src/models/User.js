import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    avatar: String,
    token: { type: String, required: true },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
