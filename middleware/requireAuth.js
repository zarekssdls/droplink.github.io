// ─── middleware/requireAuth.js ────────────────────────────────────────────────
// Protects API routes — returns 401 JSON if session is missing

module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    error:    'Authentication required',
    redirect: '/auth/discord'
  });
};
