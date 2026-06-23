// ─── routes/auth.js ───────────────────────────────────────────────────────────
// Discord OAuth2 login flow (manual implementation — no Passport)

const express = require('express');
const fetch   = require('node-fetch');
const db      = require('../db/database');

const router = express.Router();

const {
  DISCORD_CLIENT_ID:     CLIENT_ID,
  DISCORD_CLIENT_SECRET: CLIENT_SECRET
} = process.env;

function getRedirectUri(req) {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }
  return `${req.protocol}://${req.get('host')}/auth/discord/callback`;
}

// ─── Helper: Discord avatar URL ───────────────────────────────────────────────
function avatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  // Default avatar index: (discriminator === '0') means new username system → use (id >> 22) % 6
  const index = user.discriminator === '0'
    ? Number(BigInt(user.id) >> 22n) % 6
    : parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

// ─── GET /auth/discord ────────────────────────────────────────────────────────
// Start OAuth flow — redirect browser to Discord's consent screen
router.get('/discord', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).send('DISCORD_CLIENT_ID is not configured in .env');
  }
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  getRedirectUri(req),
    response_type: 'code',
    scope:         'identify email',
    prompt:        'none'       // skip re-consent if already authorised
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ─── GET /auth/discord/callback ───────────────────────────────────────────────
// Discord redirects here with ?code=xxx (or ?error=access_denied)
router.get('/discord/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.warn('[auth] OAuth denied or missing code:', error);
    return res.redirect('/?error=discord_denied');
  }

  try {
    // ── Step 1: exchange code for tokens ─────────────────────────────────────
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  getRedirectUri(req)
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[auth] Token exchange failed:', err);
      throw new Error('Token exchange failed');
    }

    const { access_token } = await tokenRes.json();

    // ── Step 2: fetch Discord user profile ───────────────────────────────────
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userRes.ok) throw new Error('Failed to fetch Discord profile');

    const discordUser = await userRes.json();

    // ── Step 3: upsert user into our DB ──────────────────────────────────────
    db.prepare(`
      INSERT INTO users (id, username, discriminator, avatar, global_name, email, last_login)
      VALUES (@id, @username, @discriminator, @avatar, @global_name, @email, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        username      = excluded.username,
        discriminator = excluded.discriminator,
        avatar        = excluded.avatar,
        global_name   = excluded.global_name,
        email         = excluded.email,
        last_login    = CURRENT_TIMESTAMP
    `).run({
      id:            discordUser.id,
      username:      discordUser.username,
      discriminator: discordUser.discriminator || '0',
      avatar:        discordUser.avatar        || null,
      global_name:   discordUser.global_name   || discordUser.username,
      email:         discordUser.email         || null
    });

    // ── Step 4: write session ─────────────────────────────────────────────────
    req.session.user = {
      id:           discordUser.id,
      username:     discordUser.username,
      global_name:  discordUser.global_name || discordUser.username,
      discriminator:discordUser.discriminator || '0',
      avatar:       discordUser.avatar || null,
      avatar_url:   avatarUrl(discordUser)
    };

    // Regenerate session ID to prevent fixation
    req.session.regenerate ? req.session.save(() => res.redirect('/dashboard')) : res.redirect('/dashboard');

  } catch (err) {
    console.error('[auth] Error during Discord callback:', err);
    res.redirect('/?error=auth_failed');
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns session user (used by dashboard JS to populate UI)
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

// ─── GET /auth/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

