import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.userId = decoded.userId
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function createJWT(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' })
}
