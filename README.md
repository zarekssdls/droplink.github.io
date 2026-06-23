# Droplink — Setup Guide

## Prerequisites
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- A **Cloudflare** account with at least one active zone (domain)
- A **Discord** application for OAuth

---

## 1 — Clone & Install

```bash
cd DroplinkV3
npm install
```

---

## 2 — Discord Application Setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. Name it `Droplink` (or anything)
3. Go to **OAuth2** → **General**
4. Copy **Client ID** and **Client Secret**
5. Under **Redirects**, add:
   ```
   http://localhost:3000/auth/discord/callback
   ```
   *(Add your production URL too when deploying)*

---

## 3 — Cloudflare API Token

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. Use the **"Edit zone DNS"** template
3. Under **Zone Resources** → select **All zones** (or specific zones you manage)
4. Click **Continue to summary** → **Create Token**
5. Copy the token (it only shows once)

---

## 4 — Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=paste_a_long_random_string_here

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback

CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

MAX_FREE_RECORDS=3
```

> **Generate SESSION_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## 5 — Run

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server starts at **http://localhost:3000**

---

## Architecture

```
Landing Page  →  /                    (public)
Discord Login →  /auth/discord        (redirects to Discord)
OAuth Return  →  /auth/discord/callback
Dashboard     →  /dashboard           (requires session)

API (all require auth):
  GET  /api/stats             — user usage stats
  GET  /api/domains           — live Cloudflare zone list
  GET  /api/records?zone_id=  — user's records for a zone
  POST /api/records           — create (enforces 3-limit)
  PUT  /api/records/:id       — update
  DELETE /api/records/:id     — delete
```

## Database

SQLite database is created automatically at `data/droplink.db` on first run. No setup needed.

---

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set `SESSION_SECRET` to a strong random value
3. Update `DISCORD_REDIRECT_URI` to your real domain
4. Add your production callback URL to the Discord app
5. Use a reverse proxy (nginx/Caddy) with SSL in front of the Node server
6. Run with `npm start` or use PM2: `pm2 start server.js --name droplink`
