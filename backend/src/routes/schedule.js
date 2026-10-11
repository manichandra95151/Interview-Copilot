import express from 'express';
import { env } from '../config/env.js';
import {
  getSession,
  scheduleSession,
  getSessionByJoinToken,
} from '../services/store.js';
import { sendInterviewInvite, isConfigured as gmailConfigured } from '../services/gmail.js';
import { requireAuth } from '../middleware/auth.js';
import { userLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { scheduleSchema, verifyJoinSchema } from '../config/schemas.js';

const router = express.Router();

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ── PUBLIC: candidate join lookup (no auth) ──────────────────
// GET /api/schedule/join/:token
router.get('/join/:token', async (req, res, next) => {
  try {
    const s = await getSessionByJoinToken(req.params.token);
    res.json({
      sessionId: s.id,
      candidateName: s.candidate_name,
      role: s.role,
      seniority: s.seniority,
      scheduledAt: s.scheduled_at,
      status: s.status,
      requiresCode: Boolean(s.join_code),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/schedule/join/:token/verify  { code }
router.post('/join/:token/verify', validate(verifyJoinSchema), async (req, res, next) => {
  try {
    const s = await getSessionByJoinToken(req.params.token);
    if (!s.join_code || s.join_code !== req.body.code) {
      return res.status(401).json({ error: 'Incorrect code' });
    }
    res.json({ ok: true, sessionId: s.id });
  } catch (err) {
    next(err);
  }
});

// ── AUTH: schedule + send invite ─────────────────────────────
router.use(requireAuth, userLimiter);

// POST /api/schedule
router.post('/', validate(scheduleSchema), async (req, res, next) => {
  try {
    const { sessionId, scheduledAt, candidateEmail, requireCode, sendEmail } = req.body;

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const { joinToken, joinCode } = await scheduleSession(sessionId, {
      scheduledAt,
      candidateEmail,
      requireCode,
    });

    const joinUrl = `${env.FRONTEND_URL}/join/${joinToken}`;

    let email = { sent: false, reason: 'skipped' };
    if (sendEmail && candidateEmail) {
      try {
        email = await sendInterviewInvite({
          to: candidateEmail,
          candidateName: session.candidate_name,
          role: session.role,
          whenText: formatWhen(scheduledAt),
          joinUrl,
          joinCode,
        });
      } catch (err) {
        console.warn('Invite email failed:', err.message);
        email = { sent: false, reason: err.message };
      }
    }

    res.json({ joinToken, joinUrl, joinCode, email, gmailConfigured: gmailConfigured() });
  } catch (err) {
    next(err);
  }
});

export default router;
