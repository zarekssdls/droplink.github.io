import mongoose from 'mongoose'

const dnsRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    domain: { type: String, required: true },
    subdomain: { type: String, required: true },
    type: { type: String, enum: ['A', 'CNAME', 'MX', 'TXT'], required: true },
    value: { type: String, required: true },
    ttl: { type: Number, default: 3600 },
    cloudflareRecordId: String,
    status: { type: String, enum: ['active', 'pending'], default: 'pending' },
  },
  { timestamps: true }
)

export const DNSRecord = mongoose.model('DNSRecord', dnsRecordSchema)
