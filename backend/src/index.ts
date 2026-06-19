import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

// Routes
import authRouter from './routes/auth'
import serverRouter from './routes/servers'
import dnsRouter from './routes/dns'
import domainRouter from './routes/domains'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dropls')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/auth', authRouter)
app.use('/servers', serverRouter)
app.use('/dns', dnsRouter)
app.use('/domains', domainRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
