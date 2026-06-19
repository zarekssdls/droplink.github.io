import mongoose from 'mongoose'

export interface IDomain {
  _id: string
  userId: string
  name: string
  cloudflareZoneId: string
  status: 'active' | 'inactive'
  nameservers: string[]
  createdAt: Date
  updatedAt: Date
}

const domainSchema = new mongoose.Schema<IDomain>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, unique: true },
    cloudflareZoneId: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    nameservers: [String],
  },
  { timestamps: true }
)

export const Domain = mongoose.model<IDomain>('Domain', domainSchema)
