import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import authRouter from './routes/auth.js'
import serverRouter from './routes/servers.js'
import dnsRouter from './routes/dns.js'
import domainRouter from './routes/domains.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dropls')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use('/auth', authRouter)
app.use('/servers', serverRouter)
app.use('/dns', dnsRouter)
app.use('/domains', domainRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
