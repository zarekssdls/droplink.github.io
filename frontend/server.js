import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))

app.get(/^\/dashboard\/?$/, (_req, res) => res.sendFile(path.join(__dirname, 'public/dashboard/index.html')))
app.get(/^\/dashboard\/dns\/?$/, (_req, res) => res.sendFile(path.join(__dirname, 'public/dashboard/dns.html')))
app.get(/^\/auth\/login\/?$/, (_req, res) => res.sendFile(path.join(__dirname, 'public/auth/login.html')))
app.get(/^\/auth\/register\/?$/, (_req, res) => res.sendFile(path.join(__dirname, 'public/auth/register.html')))
app.get(/^\/auth\/discord\/callback\/?$/, (_req, res) => res.sendFile(path.join(__dirname, 'public/auth/discord/callback.html')))

app.listen(PORT, () => console.log(`Frontend on http://localhost:${PORT}`))
