import express from 'express';
import { getSession, saveQuestions } from '../services/store.js';
import { generateQuestionsLLM } from '../services/llm.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// POST /api/questions/generate
router.post('/generate', async (req, res) => {
  try {
    const { sessionId, selectedCategories } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const result = await generateQuestionsLLM(
      session.resume_text || 'No resume provided',
      session.jd_text,
      session.role,
      session.seniority,
      session.extra_context,
      selectedCategories || []
    );

    const questions = await saveQuestions(sessionId, result.questions);
    res.json({ questions, count: questions.length });
  } catch (err) {
    console.error('Question gen error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    res.json({ questions: session.questions });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;