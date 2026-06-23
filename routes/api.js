// ─── routes/api.js ────────────────────────────────────────────────────────────
// All authenticated API routes: domains, records (CRUD), stats

const express     = require('express');
const fetch       = require('node-fetch');
const db          = require('../db/database');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth); // every route below requires a session

const CF_BASE    = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN   = () => process.env.CLOUDFLARE_API_TOKEN;
const MAX_RECORDS = () => parseInt(process.env.MAX_FREE_RECORDS || '3', 10);

// ─── Cloudflare API helper ────────────────────────────────────────────────────
async function cfFetch(path, options = {}) {
  const token = CF_TOKEN();
  if (!token || token === 'your_cloudflare_api_token') {
    throw new Error('CLOUDFLARE_API_TOKEN is not configured in .env');
  }

  const res = await fetch(`${CF_BASE}${path}`, {
    ...options,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const json = await res.json();

  if (!json.success) {
    const msg = json.errors?.[0]?.message || `Cloudflare API error (${res.status})`;
    const err = new Error(msg);
    err.cf_errors = json.errors;
    throw err;
  }

  return json;
}

// ─── GET /api/stats ───────────────────────────────────────────────────────────
// Returns the current user's usage statistics
router.get('/stats', (req, res) => {
  const userId = req.session.user.id;
  const max    = MAX_RECORDS();

  const total   = db.prepare('SELECT COUNT(*) AS cnt FROM records WHERE user_id = ?').get(userId);
  const byZone  = db.prepare(`
    SELECT zone_name, COUNT(*) AS cnt FROM records
    WHERE user_id = ? GROUP BY zone_name ORDER BY cnt DESC
  `).all(userId);
  const lastRec = db.prepare(`
    SELECT created_at FROM records WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(userId);
  const user    = db.prepare('SELECT created_at, last_login FROM users WHERE id = ?').get(userId);

  res.json({
    subdomains_used:      total.cnt,
    subdomains_max:       max,
    subdomains_remaining: Math.max(0, max - total.cnt),
    by_zone:              byZone,
    last_created:         lastRec?.created_at  || null,
    member_since:         user?.created_at     || null,
    last_login:           user?.last_login      || null
  });
});

// ─── GET /api/domains ─────────────────────────────────────────────────────────
// Fetches ALL active zones from Cloudflare — live, no cache.
// Auto-detects new domains as soon as they're added to CF account.
router.get('/domains', async (req, res) => {
  try {
    // Fetch up to 200 zones (paginated if needed)
    const page1  = await cfFetch('/zones?status=active&per_page=50&page=1');
    const total  = page1.result_info.total_count;
    let zones    = [...page1.result];

    // If there are more pages, fetch them in parallel
    if (total > 50) {
      const pages  = Math.ceil(total / 50);
      const extra  = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          cfFetch(`/zones?status=active&per_page=50&page=${i + 2}`)
        )
      );
      extra.forEach(p => zones.push(...p.result));
    }

    res.json({
      zones: zones.map(z => ({
        id:           z.id,
        name:         z.name,
        status:       z.status,
        plan:         z.plan?.name || 'Free',
        name_servers: z.name_servers
      }))
    });
  } catch (err) {
    console.error('[api/domains]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ─── GET /api/records?zone_id=xxx ─────────────────────────────────────────────
// Returns the current user's records for a given zone, refreshed from CF API.
router.get('/records', async (req, res) => {
  const { zone_id } = req.query;
  const userId      = req.session.user.id;

  if (!zone_id) return res.status(400).json({ error: 'zone_id is required' });

  try {
    // Get CF record IDs we own for this zone
    const owned = db.prepare(`
      SELECT cf_record_id, created_at FROM records
      WHERE user_id = ? AND zone_id = ?
    `).all(userId, zone_id);

    if (owned.length === 0) return res.json({ records: [] });

    // Fetch all zone records from CF (so we always have fresh data)
    const data = await cfFetch(`/zones/${zone_id}/dns_records?per_page=100`);

    const ownedMap = Object.fromEntries(owned.map(r => [r.cf_record_id, r]));

    const records = data.result
      .filter(r => ownedMap[r.id])
      .map(r => ({
        id:              r.id,
        type:            r.type,
        name:            r.name,
        content:         r.content,
        proxied:         r.proxied,
        proxiable:       r.proxiable,
        ttl:             r.ttl,
        zone_id:         r.zone_id,
        zone_name:       r.zone_name,
        created_on:      r.created_on,
        modified_on:     r.modified_on,
        local_created:   ownedMap[r.id].created_at
      }));

    res.json({ records });
  } catch (err) {
    console.error('[api/records GET]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ─── GET /api/records/all ─────────────────────────────────────────────────────
// All of the user's records across every zone (for overview / stats page)
router.get('/records/all', (req, res) => {
  const userId = req.session.user.id;
  const rows   = db.prepare(`
    SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  res.json({ records: rows });
});

// ─── POST /api/records ────────────────────────────────────────────────────────
// Create a new DNS record (enforces 3-record free limit)
router.post('/records', async (req, res) => {
  const userId = req.session.user.id;
  const max    = MAX_RECORDS();
  const { zone_id, zone_name, type, name, content, proxied, ttl, priority } = req.body;

  // Validation
  if (!zone_id || !type || !name || !content) {
    return res.status(400).json({ error: 'zone_id, type, name, and content are required' });
  }

  // Enforce limit
  const used = db.prepare('SELECT COUNT(*) AS cnt FROM records WHERE user_id = ?').get(userId).cnt;
  if (used >= max) {
    return res.status(403).json({
      error:         `Free plan limit reached — maximum ${max} subdomains per account.`,
      limit_reached: true,
      used, max
    });
  }

  try {
    const payload = {
      type:    type.toUpperCase(),
      name,
      content,
      ttl:     ttl !== undefined ? Number(ttl) : 1,
      proxied: proxied === true || proxied === 'true'
    };

    // MX records need priority
    if (type.toUpperCase() === 'MX' && priority !== undefined) {
      payload.priority = Number(priority);
    }

    const data    = await cfFetch(`/zones/${zone_id}/dns_records`, {
      method: 'POST',
      body:   JSON.stringify(payload)
    });
    const created = data.result;

    // Persist in our DB
    db.prepare(`
      INSERT INTO records
        (user_id, cf_record_id, zone_id, zone_name, record_name, record_type, content, proxied, ttl)
      VALUES
        (@userId, @cfId, @zoneId, @zoneName, @recordName, @type, @content, @proxied, @ttl)
    `).run({
      userId,
      cfId:       created.id,
      zoneId:     zone_id,
      zoneName:   zone_name || created.zone_name,
      recordName: created.name,
      type:       created.type,
      content:    created.content,
      proxied:    created.proxied ? 1 : 0,
      ttl:        created.ttl
    });

    res.json({
      success: true,
      record: {
        id:        created.id,
        type:      created.type,
        name:      created.name,
        content:   created.content,
        proxied:   created.proxied,
        ttl:       created.ttl,
        zone_id:   created.zone_id,
        zone_name: created.zone_name
      }
    });
  } catch (err) {
    console.error('[api/records POST]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ─── PUT /api/records/:cfRecordId ─────────────────────────────────────────────
// Update an existing DNS record (ownership verified)
router.put('/records/:cfRecordId', async (req, res) => {
  const userId      = req.session.user.id;
  const { cfRecordId } = req.params;

  // Verify ownership
  const owned = db.prepare(`
    SELECT * FROM records WHERE cf_record_id = ? AND user_id = ?
  `).get(cfRecordId, userId);

  if (!owned) {
    return res.status(404).json({ error: 'Record not found or access denied' });
  }

  const { type, name, content, proxied, ttl, priority } = req.body;

  try {
    const payload = {
      type:    (type    || owned.record_type).toUpperCase(),
      name:    name    || owned.record_name,
      content: content || owned.content,
      ttl:     ttl     !== undefined ? Number(ttl)     : owned.ttl,
      proxied: proxied !== undefined
                ? (proxied === true || proxied === 'true')
                : Boolean(owned.proxied)
    };

    if (payload.type === 'MX' && priority !== undefined) {
      payload.priority = Number(priority);
    }

    const data    = await cfFetch(`/zones/${owned.zone_id}/dns_records/${cfRecordId}`, {
      method: 'PUT',
      body:   JSON.stringify(payload)
    });
    const updated = data.result;

    // Update local DB
    db.prepare(`
      UPDATE records SET
        record_name = @name,
        record_type = @type,
        content     = @content,
        proxied     = @proxied,
        ttl         = @ttl,
        updated_at  = CURRENT_TIMESTAMP
      WHERE cf_record_id = @cfId AND user_id = @userId
    `).run({
      name:    updated.name,
      type:    updated.type,
      content: updated.content,
      proxied: updated.proxied ? 1 : 0,
      ttl:     updated.ttl,
      cfId:    cfRecordId,
      userId
    });

    res.json({
      success: true,
      record: {
        id:      updated.id,
        type:    updated.type,
        name:    updated.name,
        content: updated.content,
        proxied: updated.proxied,
        ttl:     updated.ttl
      }
    });
  } catch (err) {
    console.error('[api/records PUT]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ─── DELETE /api/records/:cfRecordId ─────────────────────────────────────────
// Delete a DNS record (CF + DB, ownership verified)
router.delete('/records/:cfRecordId', async (req, res) => {
  const userId         = req.session.user.id;
  const { cfRecordId } = req.params;

  const owned = db.prepare(`
    SELECT * FROM records WHERE cf_record_id = ? AND user_id = ?
  `).get(cfRecordId, userId);

  if (!owned) {
    return res.status(404).json({ error: 'Record not found or access denied' });
  }

  try {
    // Delete from Cloudflare first
    await cfFetch(`/zones/${owned.zone_id}/dns_records/${cfRecordId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    // If CF says 404, the record was already deleted externally — still clean up DB
    if (!err.message.includes('10005') && !err.message.includes('not found')) {
      console.error('[api/records DELETE] CF error:', err.message);
      return res.status(502).json({ error: err.message });
    }
    console.warn('[api/records DELETE] Record not found in CF, cleaning up DB anyway.');
  }

  // Remove from our DB regardless
  db.prepare('DELETE FROM records WHERE cf_record_id = ? AND user_id = ?').run(cfRecordId, userId);

  res.json({ success: true });
});

module.exports = router;
