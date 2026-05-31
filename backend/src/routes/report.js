import express from 'express';
import { getSession, saveReport } from '../services/store.js';
import { generateReportLLM } from '../services/llm.js';

const router = express.Router();

// POST /api/report/generate
router.post('/generate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);

    if (session.questions.length === 0) {
      return res.status(400).json({ error: 'No questions found in session' });
    }

    const report = await generateReportLLM(session);
    saveReport(sessionId, report);

    res.json(report);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/report/:sessionId
router.get('/:sessionId', (req, res) => {
  try {
    const session = getSession(req.params.sessionId);
    if (!session.report) {
      return res.status(404).json({ error: 'Report not yet generated for this session' });
    }
    res.json({
      report: session.report,
      sessionMeta: {
        candidate_name: session.candidate_name,
        role: session.role,
        seniority: session.seniority,
        createdAt: session.createdAt,
        questionsCount: session.questions.length,
        answersCount: session.answers.filter(a => !a.skipped).length,
      },
      questions: session.questions,
      answers: session.answers,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;