import axios from 'axios'

class CloudflareService {
  constructor() {
    this.apiKey = process.env.CLOUDFLARE_API_KEY || ''
    this.email = process.env.CLOUDFLARE_EMAIL || ''
    this.baseURL = 'https://api.cloudflare.com/client/v4'
  }

  headers() {
    return {
      'X-Auth-Email': this.email,
      'X-Auth-Key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  async createDNSRecord(zoneId, name, type, value, ttl) {
    const { data } = await axios.post(
      `${this.baseURL}/zones/${zoneId}/dns_records`,
      { type, name, content: value, ttl, proxied: false },
      { headers: this.headers() }
    )
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'create failed')
    return data.result
  }

  async updateDNSRecord(zoneId, recordId, name, type, value, ttl) {
    const { data } = await axios.put(
      `${this.baseURL}/zones/${zoneId}/dns_records/${recordId}`,
      { type, name, content: value, ttl, proxied: false },
      { headers: this.headers() }
    )
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'update failed')
    return data.result
  }

  async deleteDNSRecord(zoneId, recordId) {
    const { data } = await axios.delete(
      `${this.baseURL}/zones/${zoneId}/dns_records/${recordId}`,
      { headers: this.headers() }
    )
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'delete failed')
  }

  async getDNSRecords(zoneId) {
    const { data } = await axios.get(
      `${this.baseURL}/zones/${zoneId}/dns_records`,
      { headers: this.headers() }
    )
    if (!data.success) throw new Error('Failed to fetch records')
    return data.result
  }
}

export const cloudflareService = new CloudflareService()
