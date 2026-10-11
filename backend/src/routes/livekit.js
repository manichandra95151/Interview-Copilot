/**
 * livekit.js — mint LiveKit access tokens for the in-app video interview.
 * Room name == sessionId, so the recruiter and candidate land in the same room.
 * Our own auth gates who can get a token (recruiter Supabase JWT, candidate
 * join token). Media (video/audio) flows through LiveKit; transcription + AI
 * continue over our Deepgram WS.
 */
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { env } from '../config/env.js';
import { getSession, getSessionByJoinToken } from '../services/store.js';
import { requireAuth } from '../middleware/auth.js';
import { userLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

function configured() {
  return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
}

async function mintToken({ room, identity, name }) {
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    name,
    ttl: '2h',
  });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
  return at.toJwt();
}

// PUBLIC: candidate token via join token
router.post('/join-token', async (req, res, next) => {
  try {
    if (!configured()) return res.status(503).json({ error: 'Video is not configured' });
    const { joinToken } = req.body || {};
    if (!joinToken) return res.status(400).json({ error: 'joinToken required' });
    const s = await getSessionByJoinToken(joinToken);
    const token = await mintToken({
      room: s.id,
      identity: `candidate-${s.id}`,
      name: s.candidate_name || 'Candidate',
    });
    res.json({ token, url: env.LIVEKIT_URL });
  } catch (err) {
    next(err);
  }
});

// AUTH: recruiter token
router.use(requireAuth, userLimiter);

router.post('/token', async (req, res, next) => {
  try {
    if (!configured()) return res.status(503).json({ error: 'Video is not configured' });
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const token = await mintToken({
      room: sessionId,
      identity: `interviewer-${req.userId}`,
      name: 'Interviewer',
    });
    res.json({ token, url: env.LIVEKIT_URL });
  } catch (err) {
    next(err);
  }
});

export default router;
