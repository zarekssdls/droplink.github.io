# Droplink — Full Backend Implementation Plan

## Stack
- **Server**: Node.js + Express
- **Database**: SQLite (better-sqlite3) — zero-config, file-based
- **Auth**: Discord OAuth2 (manual, no passport)
- **Sessions**: express-session
- **DNS**: Cloudflare REST API v4 (Bearer token)
- **Frontend Dashboard**: Vanilla JS SPA (no framework)

## File Structure
```
DroplinkV3/
├── server.js                  # Entry point
├── package.json
├── .env.example
├── db/
│   └── database.js            # SQLite setup + schema
├── middleware/
│   └── requireAuth.js
├── routes/
│   ├── auth.js                # Discord OAuth
│   └── api.js                 # DNS + domains + stats
├── dashboard/
│   ├── index.html             # Cloudflare-like DNS UI
│   ├── style.css
│   └── app.js                 # SPA logic
├── index.html                 # Landing (existing, update buttons)
├── style.css                  # (existing)
└── app.js                     # (existing)
```

## API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | /auth/discord | Redirect to Discord OAuth |
| GET | /auth/discord/callback | Handle OAuth, set session |
| GET | /auth/me | Return session user |
| GET | /auth/logout | Destroy session |
| GET | /api/stats | User stats (usage, limits) |
| GET | /api/domains | Fetch CF zones live |
| GET | /api/records?zone_id= | User's records for a zone |
| POST | /api/records | Create (enforces 3-record limit) |
| PUT | /api/records/:id | Update via CF API |
| DELETE | /api/records/:id | Delete via CF API + DB |

## Database Schema
```sql
users(id PK, username, discriminator, avatar, global_name, email, created_at, last_login)
records(id PK, user_id FK, cf_record_id UNIQUE, zone_id, zone_name, record_name, record_type, content, proxied, ttl, created_at, updated_at)
```

## Dashboard UI (Cloudflare-like)
- Left sidebar: Logo, nav (Overview / DNS Records / Settings), user card
- Topbar: Domain selector dropdown (live-fetched from CF) + Refresh + user pill
- Overview: Stats cards (subdomains used/3, DNS records, zones)
- DNS Records: Type filter chips + search + Add Record form (inline, like CF) + records table with inline editing
- Settings: Account info
