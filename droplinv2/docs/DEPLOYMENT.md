# Deployment Guide

## Frontend Deployment (Vercel)

### Automatic Deployment
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_DISCORD_CLIENT_ID` - Discord Client ID
   - `NEXTAUTH_SECRET` - Random secret

### Manual Deployment
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Backend Deployment

### Option 1: Azure Container Instances
```bash
# Create resource group
az group create --name dropls --location eastus

# Create container registry
az acr create --resource-group dropls --name droplsregistry --sku Basic

# Build and push
az acr build --registry droplsregistry --image dropls-api:latest .

# Deploy container
az container create --resource-group dropls --name dropls-api \
  --image droplsregistry.azurecr.io/dropls-api:latest \
  --environment-variables \
    MONGODB_URI=$MONGODB_URI \
    JWT_SECRET=$JWT_SECRET \
    CLOUDFLARE_API_KEY=$CLOUDFLARE_API_KEY
```

### Option 2: Self-Hosted VPS
```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourname/droplinv2.git
cd droplinv2/backend

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name "dropls-api"

# Setup auto-restart
pm2 startup
pm2 save
```

### Option 3: Heroku (Legacy)
```bash
heroku create dropls-api
git push heroku main
```

## Database Setup

### MongoDB Atlas (Cloud)
1. Create account at mongodb.com/atlas
2. Create cluster
3. Connect and copy connection string
4. Update `MONGODB_URI` in .env

### Local MongoDB
```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or download from mongodb.com

# Start service
mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017/dropls
```

## Environment Variables

### All Variables Needed
```env
# Discord
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=...

# JWT
JWT_SECRET=generate_random_string

# Database
MONGODB_URI=...

# Cloudflare
CLOUDFLARE_API_KEY=...
CLOUDFLARE_EMAIL=...
CLOUDFLARE_ZONE_ID=...

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourfrontend.com
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)
```bash
sudo apt-get install certbot nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### Using Cloudflare SSL
1. In Cloudflare dashboard
2. SSL/TLS > Encryption Mode
3. Select "Full" or "Full (Strict)"

## Monitoring & Maintenance

### Check Health
```bash
curl https://api.yourdomain.com/health
```

### View Logs
```bash
# PM2 logs
pm2 logs dropls-api

# Docker logs
docker logs dropls-api
```

### Database Backup
```bash
# MongoDB backup
mongodump --uri "mongodb+srv://..." --out ./backup

# MongoDB restore
mongorestore ./backup
```

## Custom Domain Setup

1. Update DNS records to point to your server
2. Update FRONTEND_URL in backend .env
3. Update API URLs in frontend
4. Restart services

## Troubleshooting

**API Connection Errors**
- Check CORS settings
- Verify FRONTEND_URL matches
- Check firewall rules

**Database Errors**
- Verify MongoDB connection string
- Check network access in MongoDB Atlas
- Ensure IP whitelist is configured

**Discord OAuth Fails**
- Update Redirect URI in Discord Developer Portal
- Verify Client ID and Secret
- Check CORS settings
