import express from 'express';
import { getSession, saveQuestions, addQuestion, updateSessionCompetencies } from '../services/store.js';
import { generateQuestionsLLM } from '../services/llm.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// POST /api/questions/add
router.post('/add', async (req, res) => {
  try {
    const { sessionId, question, category, rubric, timeGuide } = req.body;
    if (!sessionId || !question) return res.status(400).json({ error: 'sessionId and question text required' });

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const newQuestion = await addQuestion(sessionId, { question, category, rubric, timeGuide });
    res.json(newQuestion);
  } catch (err) {
    console.error('Add question error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/questions/generate
router.post('/generate', async (req, res) => {
  try {
    const { sessionId, selectedCategories, customCompetencies } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    // Persist custom competencies on the session so the report can reference them later
    if (customCompetencies && customCompetencies.length > 0) {
      await updateSessionCompetencies(sessionId, customCompetencies);
    }

    const result = await generateQuestionsLLM(
      session.resume_text || 'No resume provided',
      session.jd_text,
      session.role,
      session.seniority,
      session.extra_context,
      selectedCategories || [],
      customCompetencies || []   // <-- new param
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