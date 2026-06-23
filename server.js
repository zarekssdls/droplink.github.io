// ─── server.js ────────────────────────────────────────────────────────────────
// Droplink Express server — entry point

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Sessions ─────────────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'droplink-dev-insecure-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000   // 7 days
  }
}));

// ─── Static assets ────────────────────────────────────────────────────────────
// Landing page lives in root
app.use(express.static(path.join(__dirname), {
  index: false   // handle / manually so we can add auth checks
}));

// Dashboard static files served under /dashboard
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard'), {
  index: false
}));

// ─── API / Auth routes ────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/api',  require('./routes/api'));

// ─── Page routes ─────────────────────────────────────────────────────────────

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

// Terms of Service
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

// Documentation
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs.html'));
});

// Dashboard — gate behind auth; redirect to /login if not logged in
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// Catch-all for /dashboard/* deep links
app.get('/dashboard/*', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});


// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ██████╗ ██████╗  ██████╗ ██████╗ ██╗     ██╗███╗   ██╗██╗  ██╗
  ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
  ██║  ██║██████╔╝██║   ██║██████╔╝██║     ██║██╔██╗ ██║█████╔╝
  ██║  ██║██╔══██╗██║   ██║██╔═══╝ ██║     ██║██║╚██╗██║██╔═██╗
  ██████╔╝██║  ██║╚██████╔╝██║     ███████╗██║██║ ╚████║██║  ██╗
  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝

  🔷  Server running at  http://localhost:${PORT}
  📋  Landing page       http://localhost:${PORT}/
  🎛️   Dashboard          http://localhost:${PORT}/dashboard
  🔑  Discord login      http://localhost:${PORT}/auth/discord
  `);
});
