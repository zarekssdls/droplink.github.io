import mongoose from 'mongoose'

export interface IUser {
  _id: string
  discordId: string
  email: string
  username: string
  avatar?: string
  token: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    discordId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    avatar: String,
    token: { type: String, required: true },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', userSchema)
