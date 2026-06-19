import mongoose from 'mongoose';

const subdomainSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, unique: true }, // e.g., "mypanel"
  fullDomain: { type: String, required: true }, // e.g., "mypanel.dropls.gg"
  targetIp: { type: String, required: true },
  recordType: { type: String, enum: ['A', 'CNAME', 'AAAA'], default: 'A' },
  cloudflareRecordId: { type: String, default: null },
  status: { type: String, enum: ['active', 'pending', 'suspended', 'error'], default: 'pending' },
  panelType: { type: String, enum: ['pterodactyl', 'pelican', 'minecraft', 'other'], default: 'other' },
  location: { type: String, default: 'US' },
  cpuUsage: { type: Number, default: 0 },
  pricePerHour: { type: Number, default: 0 },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Subdomain', subdomainSchema);
