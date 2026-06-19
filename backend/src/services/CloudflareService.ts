import axios from 'axios'

interface CloudflareRecord {
  id: string
  name: string
  type: 'A' | 'CNAME' | 'MX' | 'TXT'
  content: string
  ttl: number
}

export class CloudflareService {
  private apiKey: string
  private email: string
  private baseURL = 'https://api.cloudflare.com/client/v4'

  constructor() {
    this.apiKey = process.env.CLOUDFLARE_API_KEY || ''
    this.email = process.env.CLOUDFLARE_EMAIL || ''
  }

  private getHeaders() {
    return {
      'X-Auth-Email': this.email,
      'X-Auth-Key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  async createDNSRecord(
    zoneId: string,
    subdomain: string,
    type: string,
    value: string,
    ttl: number
  ): Promise<CloudflareRecord> {
    try {
      const response = await axios.post(
        `${this.baseURL}/zones/${zoneId}/dns_records`,
        {
          type,
          name: subdomain,
          content: value,
          ttl,
          proxied: false,
        },
        { headers: this.getHeaders() }
      )

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to create record')
      }

      return response.data.result
    } catch (error) {
      console.error('Cloudflare API error:', error)
      throw error
    }
  }

  async updateDNSRecord(
    zoneId: string,
    recordId: string,
    subdomain: string,
    type: string,
    value: string,
    ttl: number
  ): Promise<CloudflareRecord> {
    try {
      const response = await axios.put(
        `${this.baseURL}/zones/${zoneId}/dns_records/${recordId}`,
        {
          type,
          name: subdomain,
          content: value,
          ttl,
          proxied: false,
        },
        { headers: this.getHeaders() }
      )

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to update record')
      }

      return response.data.result
    } catch (error) {
      console.error('Cloudflare API error:', error)
      throw error
    }
  }

  async deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/zones/${zoneId}/dns_records/${recordId}`,
        { headers: this.getHeaders() }
      )

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to delete record')
      }
    } catch (error) {
      console.error('Cloudflare API error:', error)
      throw error
    }
  }

  async getDNSRecords(zoneId: string): Promise<CloudflareRecord[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/zones/${zoneId}/dns_records`,
        { headers: this.getHeaders() }
      )

      if (!response.data.success) {
        throw new Error('Failed to fetch records')
      }

      return response.data.result
    } catch (error) {
      console.error('Cloudflare API error:', error)
      throw error
    }
  }
}

export const cloudflareService = new CloudflareService()
