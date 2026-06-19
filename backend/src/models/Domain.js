import mongoose from 'mongoose'

const domainSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, unique: true },
    cloudflareZoneId: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    nameservers: [String],
  },
  { timestamps: true }
)

export const Domain = mongoose.model('Domain', domainSchema)
