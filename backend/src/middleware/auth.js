/**
 * auth.js — JWT middleware
 * Verifies the Bearer token sent by NextAuth from the frontend.
 * Attaches req.userId to every authenticated request.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // NextAuth JWTs use `sub` for the user ID and `email` for the email
    req.userId = payload.sub || payload.id || payload.email || 'unknown';
    req.userEmail = payload.email || '';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}
