
import express from 'express';
import { getSession, saveReport, getReport, generateShareToken, getSessionByShareToken } from '../services/store.js';
import { generateReportLLM } from '../services/llm.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// PUBLIC: view report by share token (no auth)
router.get('/shared/:token', async (req, res) => {
  try {
    const session = await getSessionByShareToken(req.params.token);
    const report = await getReport(session.id);
    if (!report) return res.status(404).json({ error: 'Report not yet generated' });
    res.json({
      report,
      sessionMeta: {
        candidate_name: session.candidate_name,
        role:           session.role,
        seniority:      session.seniority,
        createdAt:      session.createdAt,
        questionsCount: session.questions.length,
        answersCount:   session.answers.filter(a => !a.skipped && a.transcript).length,
      },
      questions: session.questions,
      answers:   session.answers,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Auth required below
router.use(requireAuth);

// POST /api/report/generate
router.post('/generate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (!session.questions.length) return res.status(400).json({ error: 'No questions in session' });

    const report = await generateReportLLM(session);
    await saveReport(sessionId, report);
    res.json(report);
  } catch (err) {
    console.error('Report gen error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/report/:sessionId (Private: only for owner)
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const report = await getReport(req.params.sessionId);
    if (!report) return res.status(404).json({ error: 'Report not yet generated' });
    res.json({
      report,
      sessionMeta: {
        candidate_name: session.candidate_name,
        role:           session.role,
        seniority:      session.seniority,
        createdAt:      session.createdAt,
        shareToken:     session.shareToken,
        questionsCount: session.questions.length,
        answersCount:   session.answers.filter(a => !a.skipped && a.transcript).length,
      },
      questions: session.questions,
      answers:   session.answers,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/report/:sessionId/share
router.post('/:sessionId/share', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (session.shareToken) return res.json({ shareToken: session.shareToken });
    const token = await generateShareToken(req.params.sessionId);
    res.json({ shareToken: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;