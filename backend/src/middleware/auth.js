/**
 * auth.js — Supabase token verification.
 *
 * The frontend sends the Supabase access token as `Authorization: Bearer <jwt>`.
 * We validate it by asking Supabase's auth server via supabase.auth.getUser(),
 * which works regardless of the project's JWT signing method (legacy HS256
 * shared secret OR the newer asymmetric signing keys). No JWT secret required.
 *
 * Validated tokens are cached briefly to avoid a network round-trip on every
 * request from the same user.
 */
import { supabase } from '../db/supabase.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map(); // token -> { userId, email, role, expires }

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cached = cache.get(token);
  if (cached && cached.expires > Date.now()) {
    req.userId = cached.userId;
    req.userEmail = cached.email;
    req.userRole = cached.role;
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { user } = data;
    cache.set(token, {
      userId: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
      expires: Date.now() + CACHE_TTL_MS,
    });
    req.userId = user.id;
    req.userEmail = user.email || '';
    req.userRole = user.role || 'authenticated';
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
