# Dropls (Plain HTML + JS edition)

Converted from the Next.js + TypeScript original to:

- **frontend/** – static HTML pages styled with the Tailwind CDN + a small `styles.css`. All interactivity is vanilla JavaScript in `assets/app.js` and per-page modules.
- **backend/** – plain Node.js + Express (ESM). Same MongoDB models, Discord OAuth flow and Cloudflare DNS integration as the original.

## Run locally

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in the values
npm install
npm run dev            # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm start              # serves ./public on http://localhost:3000
```

Open http://localhost:3000.

## Pages

| URL                            | File                                    |
| ------------------------------ | --------------------------------------- |
| `/`                            | `public/index.html`                     |
| `/auth/login`                  | `public/auth/login.html`                |
| `/auth/register`               | `public/auth/register.html`             |
| `/auth/discord/callback`       | `public/auth/discord/callback.html`     |
| `/dashboard`                   | `public/dashboard/index.html`           |
| `/dashboard/dns`               | `public/dashboard/dns.html`             |

## Environment variables

Frontend reads its API URL from `window.APP_CONFIG.API_URL` (set inline in each HTML file – edit `public/assets/config.js`).

Backend `.env` keys are unchanged from the original: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `JWT_SECRET`, `MONGODB_URI`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `PORT`, `FRONTEND_URL`.
