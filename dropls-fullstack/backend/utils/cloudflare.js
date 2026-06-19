import axios from 'axios';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export const cloudflare = {
  async createRecord(name, target, type = 'A') {
    const res = await axios.post(
      `${CF_API_BASE}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        type,
        name: `${name}.dropls.gg`,
        content: target,
        ttl: 1,
        proxied: false
      },
      {
        headers: {
          'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
          'X-Auth-Key': process.env.CLOUDFLARE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data;
  },

  async updateRecord(recordId, name, target, type = 'A') {
    const res = await axios.put(
      `${CF_API_BASE}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
      {
        type,
        name: `${name}.dropls.gg`,
        content: target,
        ttl: 1,
        proxied: false
      },
      {
        headers: {
          'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
          'X-Auth-Key': process.env.CLOUDFLARE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data;
  },

  async deleteRecord(recordId) {
    const res = await axios.delete(
      `${CF_API_BASE}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
      {
        headers: {
          'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
          'X-Auth-Key': process.env.CLOUDFLARE_API_KEY
        }
      }
    );
    return res.data;
  },

  async listRecords() {
    const res = await axios.get(
      `${CF_API_BASE}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        headers: {
          'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
          'X-Auth-Key': process.env.CLOUDFLARE_API_KEY
        }
      }
    );
    return res.data;
  }
};
