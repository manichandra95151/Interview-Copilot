import express from 'express';
import { getSession, saveQuestions } from '../services/store.js';
import { generateQuestionsLLM } from '../services/llm.js';

const router = express.Router();

// POST /api/questions/generate
router.post('/generate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);

    if (!session.jd_text) {
      return res.status(400).json({ error: 'Session has no job description' });
    }

    const result = await generateQuestionsLLM(
      session.resume_text || 'No resume provided',
      session.jd_text,
      session.role,
      session.seniority,
      session.extra_context
    );

    const questions = saveQuestions(sessionId, result.questions);

    res.json({ questions, count: questions.length });
  } catch (err) {
    console.error('Question generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/:sessionId
router.get('/:sessionId', (req, res) => {
  try {
    const session = getSession(req.params.sessionId);
    res.json({ questions: session.questions });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;