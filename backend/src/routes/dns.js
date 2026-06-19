import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { DNSRecord } from '../models/DNSRecord.js'
import { Domain } from '../models/Domain.js'
import { cloudflareService } from '../services/CloudflareService.js'

const router = Router()

router.get('/records', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.query
    if (!domain) return res.status(400).json({ error: 'Domain required' })
    const records = await DNSRecord.find({ userId: req.userId, domain }).sort('-createdAt')
    res.json(records)
  } catch {
    res.status(500).json({ error: 'Failed to fetch DNS records' })
  }
})

router.post('/records', authMiddleware, async (req, res) => {
  try {
    const { domain, subdomain, type, value, ttl } = req.body
    if (!domain || !subdomain || !type || !value) return res.status(400).json({ error: 'Missing required fields' })
    const domainRecord = await Domain.findOne({ userId: req.userId, name: domain })
    if (!domainRecord) return res.status(404).json({ error: 'Domain not found' })

    let cloudflareRecordId = ''
    try {
      const cf = await cloudflareService.createDNSRecord(
        domainRecord.cloudflareZoneId,
        `${subdomain}.${domain}`,
        type,
        value,
        ttl || 3600
      )
      cloudflareRecordId = cf.id
    } catch (err) {
      console.error('Cloudflare error:', err.message)
    }

    const rec = await DNSRecord.create({
      userId: req.userId, domain, subdomain, type, value,
      ttl: ttl || 3600, cloudflareRecordId,
      status: cloudflareRecordId ? 'active' : 'pending',
    })
    res.status(201).json(rec)
  } catch (err) {
    console.error('Error creating DNS record:', err)
    res.status(500).json({ error: 'Failed to create DNS record' })
  }
})

router.put('/records/:id', authMiddleware, async (req, res) => {
  try {
    const record = await DNSRecord.findOne({ _id: req.params.id, userId: req.userId })
    if (!record) return res.status(404).json({ error: 'Record not found' })
    const domain = await Domain.findOne({ userId: req.userId, name: record.domain })
    if (!domain) return res.status(404).json({ error: 'Domain not found' })

    if (record.cloudflareRecordId) {
      try {
        await cloudflareService.updateDNSRecord(
          domain.cloudflareZoneId, record.cloudflareRecordId,
          `${record.subdomain}.${record.domain}`,
          req.body.type || record.type,
          req.body.value || record.value,
          req.body.ttl || record.ttl
        )
      } catch (err) { console.error('Cloudflare update error:', err.message) }
    }

    const updated = await DNSRecord.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Failed to update DNS record' })
  }
})

router.delete('/records/:id', authMiddleware, async (req, res) => {
  try {
    const record = await DNSRecord.findOne({ _id: req.params.id, userId: req.userId })
    if (!record) return res.status(404).json({ error: 'Record not found' })

    if (record.cloudflareRecordId) {
      const domain = await Domain.findOne({ userId: req.userId, name: record.domain })
      if (domain) {
        try {
          await cloudflareService.deleteDNSRecord(domain.cloudflareZoneId, record.cloudflareRecordId)
        } catch (err) { console.error('Cloudflare delete error:', err.message) }
      }
    }

    await DNSRecord.findByIdAndDelete(req.params.id)
    res.json({ message: 'Record deleted' })
  } catch {
    res.status(500).json({ error: 'Failed to delete DNS record' })
  }
})

export default router
