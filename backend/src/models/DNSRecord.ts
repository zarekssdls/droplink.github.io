import mongoose from 'mongoose'

export interface IDNSRecord {
  _id: string
  userId: string
  domain: string
  subdomain: string
  type: 'A' | 'CNAME' | 'MX' | 'TXT'
  value: string
  ttl: number
  cloudflareRecordId: string
  status: 'active' | 'pending'
  createdAt: Date
  updatedAt: Date
}

const dnsRecordSchema = new mongoose.Schema<IDNSRecord>(
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

export const DNSRecord = mongoose.model<IDNSRecord>('DNSRecord', dnsRecordSchema)
