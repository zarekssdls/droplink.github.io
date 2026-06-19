import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { DNSRecord } from '../models/DNSRecord'
import { Domain } from '../models/Domain'
import { cloudflareService } from '../services/CloudflareService'

const dnsRouter = Router()

// Get all DNS records for a domain
dnsRouter.get('/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { domain } = req.query

    if (!domain) {
      return res.status(400).json({ error: 'Domain required' })
    }

    const records = await DNSRecord.find({
      userId: req.userId,
      domain,
    }).sort('-createdAt')

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch DNS records' })
  }
})

// Create new DNS record
dnsRouter.post('/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { domain, subdomain, type, value, ttl } = req.body

    if (!domain || !subdomain || !type || !value) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const domainRecord = await Domain.findOne({
      userId: req.userId,
      name: domain,
    })

    if (!domainRecord) {
      return res.status(404).json({ error: 'Domain not found' })
    }

    // Create Cloudflare record
    let cloudflareRecordId = ''
    try {
      const cfRecord = await cloudflareService.createDNSRecord(
        domainRecord.cloudflareZoneId,
        `${subdomain}.${domain}`,
        type,
        value,
        ttl || 3600
      )
      cloudflareRecordId = cfRecord.id
    } catch (error) {
      console.error('Cloudflare error:', error)
      // Continue anyway, mark as pending
    }

    const dnsRecord = new DNSRecord({
      userId: req.userId,
      domain,
      subdomain,
      type,
      value,
      ttl: ttl || 3600,
      cloudflareRecordId,
      status: cloudflareRecordId ? 'active' : 'pending',
    })

    await dnsRecord.save()
    res.status(201).json(dnsRecord)
  } catch (error) {
    console.error('Error creating DNS record:', error)
    res.status(500).json({ error: 'Failed to create DNS record' })
  }
})

// Update DNS record
dnsRouter.put('/records/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const record = await DNSRecord.findOne({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    const domain = await Domain.findOne({
      userId: req.userId,
      name: record.domain,
    })

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' })
    }

    // Update Cloudflare record
    if (record.cloudflareRecordId) {
      try {
        await cloudflareService.updateDNSRecord(
          domain.cloudflareZoneId,
          record.cloudflareRecordId,
          `${record.subdomain}.${record.domain}`,
          req.body.type || record.type,
          req.body.value || record.value,
          req.body.ttl || record.ttl
        )
      } catch (error) {
        console.error('Cloudflare update error:', error)
      }
    }

    const updated = await DNSRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update DNS record' })
  }
})

// Delete DNS record
dnsRouter.delete('/records/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const record = await DNSRecord.findOne({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    // Delete from Cloudflare
    if (record.cloudflareRecordId) {
      const domain = await Domain.findOne({
        userId: req.userId,
        name: record.domain,
      })

      if (domain) {
        try {
          await cloudflareService.deleteDNSRecord(
            domain.cloudflareZoneId,
            record.cloudflareRecordId
          )
        } catch (error) {
          console.error('Cloudflare delete error:', error)
        }
      }
    }

    await DNSRecord.findByIdAndDelete(req.params.id)
    res.json({ message: 'Record deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete DNS record' })
  }
})

export default dnsRouter
