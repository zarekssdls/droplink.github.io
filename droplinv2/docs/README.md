# Dropls - Game Server Panel

A comprehensive game server panel with automatic DNS management via Cloudflare. Create and manage game servers with custom subdomains using a modern web interface.

## 🎯 Features

- **Discord OAuth Authentication** - Sign up/Sign in with Discord
- **Game Server Management** - Create, manage, and monitor game servers
- **Automatic DNS Management** - Cloudflare-powered subdomain creation
- **DNS Dashboard** - Full DNS record management (Create, Update, Delete)
- **Multi-Game Support** - Minecraft, CS:GO/CS2, Rust, Valheim, and more
- **Domain Selector** - Choose from your available domains
- **Real-time Status** - Monitor server status and player count
- **Responsive Design** - Works on desktop and mobile

## 🏗️ Project Structure

```
droplinv2/
├── frontend/              # Next.js 14 frontend
│   ├── src/
│   │   ├── app/          # App router and pages
│   │   │   ├── auth/     # Authentication pages
│   │   │   ├── dashboard/ # Dashboard and DNS pages
│   │   │   └── page.tsx  # Landing page
│   │   ├── components/   # Reusable React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── store/        # State management (Zustand)
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── models/       # MongoDB schemas
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Authentication & utilities
│   │   ├── config/       # Configuration files
│   │   └── index.ts      # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or Atlas
- Discord Application (for OAuth)
- Cloudflare Account with API Key

### 1. Set Up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 > General
4. Add Redirect URL: `http://localhost:3000/auth/discord/callback`
5. Copy Client ID and Client Secret

### 2. Set Up Cloudflare

1. Get your API Key from [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Get your Zone ID for your domain
3. Note your Cloudflare email

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
NEXTAUTH_SECRET=your_random_secret
```

Run development server:
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env`:
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback

JWT_SECRET=your_jwt_secret_here

MONGODB_URI=mongodb://localhost:27017/dropls
CLOUDFLARE_API_KEY=your_cloudflare_api_key
CLOUDFLARE_EMAIL=your_cloudflare_email@example.com
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id

PORT=3001
FRONTEND_URL=http://localhost:3000
```

Run development server:
```bash
npm run dev
# Backend runs on http://localhost:3001
```

## 📱 API Endpoints

### Authentication
- `POST /auth/discord/callback` - Discord OAuth callback
- `GET /auth/me` - Get current user (requires auth)

### Game Servers
- `GET /servers` - List servers (optional domain filter)
- `POST /servers` - Create new server
- `PUT /servers/:id` - Update server
- `DELETE /servers/:id` - Delete server

### DNS Records
- `GET /dns/records` - List DNS records (requires domain)
- `POST /dns/records` - Create DNS record
- `PUT /dns/records/:id` - Update DNS record
- `DELETE /dns/records/:id` - Delete DNS record

### Domains
- `GET /domains` - List user's domains
- `POST /domains` - Add new domain

## 🔐 Authentication

The API uses JWT tokens for authentication. Include token in headers:
```
Authorization: Bearer <token>
```

## 🗄️ Database Schema

### Users
```javascript
{
  _id: ObjectId,
  discordId: String,
  email: String,
  username: String,
  avatar: String,
  token: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Game Servers
```javascript
{
  _id: ObjectId,
  userId: String,
  name: String,
  gameType: String,
  subdomain: String,
  domain: String,
  ip: String,
  port: Number,
  maxPlayers: Number,
  status: 'online' | 'offline',
  players: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### DNS Records
```javascript
{
  _id: ObjectId,
  userId: String,
  domain: String,
  subdomain: String,
  type: 'A' | 'CNAME' | 'MX' | 'TXT',
  value: String,
  ttl: Number,
  cloudflareRecordId: String,
  status: 'active' | 'pending',
  createdAt: Date,
  updatedAt: Date
}
```

## 🎮 Supported Games

- Minecraft (Java & Bedrock)
- CS:GO / CS2
- Rust
- Valheim
- Garry's Mod
- Team Fortress 2
- And more...

## 🔄 Game Server Lifecycle

1. **Create Server** - User creates new server from dashboard
2. **Generate Subdomain** - System generates unique subdomain
3. **Create DNS Record** - Cloudflare API creates A record pointing to server IP
4. **Deploy Server** - Server deployed with configuration
5. **Monitor** - Dashboard shows live status and player count
6. **Manage** - User can update settings, restart, or delete

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel via git or CLI
```

### Backend (Self-hosted VPS or Azure)
```bash
cd backend
npm run build
npm start
# Or use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "dropls-api"
```

## 📊 Monitoring & Maintenance

- Check server status via `/health` endpoint
- Monitor logs for errors
- Regularly backup MongoDB
- Keep Cloudflare API credentials secure
- Rotate tokens periodically

## 🐛 Troubleshooting

**CORS Issues**
- Ensure `FRONTEND_URL` matches frontend origin

**Discord OAuth Fails**
- Verify Client ID and Secret in `.env`
- Check Redirect URI is registered in Discord Developer Portal

**Cloudflare API Errors**
- Verify API Key is valid
- Check Zone ID is correct
- Ensure email matches account

**Database Connection**
- Verify MongoDB is running
- Check MongoDB URI is correct

## 📝 Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_DISCORD_CLIENT_ID` - Discord OAuth client ID
- `NEXTAUTH_SECRET` - NextAuth secret

### Backend
- `DISCORD_CLIENT_ID` - Discord app ID
- `DISCORD_CLIENT_SECRET` - Discord app secret
- `DISCORD_REDIRECT_URI` - OAuth redirect URL
- `JWT_SECRET` - Secret for JWT signing
- `MONGODB_URI` - MongoDB connection string
- `CLOUDFLARE_API_KEY` - Cloudflare API key
- `CLOUDFLARE_EMAIL` - Cloudflare email
- `CLOUDFLARE_ZONE_ID` - Cloudflare zone ID
- `PORT` - Server port
- `FRONTEND_URL` - Frontend URL for CORS

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Support

For issues or questions, check the documentation or create an issue in the repository.

---

**Built with** ❤️ using Next.js, Express, MongoDB, and Cloudflare
