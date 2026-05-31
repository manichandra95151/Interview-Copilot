import express from 'express';
import { getSession, saveAnswer } from '../services/store.js';
import { evaluateAnswerLLM } from '../services/llm.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// POST /api/answers/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { sessionId, questionId, transcript, manualNotes, notAnswered } = req.body;
    if (!sessionId || !questionId) return res.status(400).json({ error: 'sessionId and questionId required' });

    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const question = session.questions.find(q => q.id == questionId);
    if (!question) return res.status(404).json({ error: `Question ${questionId} not found` });

    const evaluation = await evaluateAnswerLLM(
      question.question, question.rubric, question.category,
      transcript, false, notAnswered
    );

    await saveAnswer(sessionId, questionId, {
      question_id:  questionId,
      transcript:   transcript || '',
      manual_notes: manualNotes || '',
      ...evaluation,
    });

    res.json(evaluation);
  } catch (err) {
    console.error('Answer eval error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/answers/skip
router.post('/skip', async (req, res) => {
  try {
    const { sessionId, questionId } = req.body;
    const session = await getSession(sessionId);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    await saveAnswer(sessionId, questionId, {
      question_id: questionId, transcript: '', score: null,
      strength: null, gap: null, followUp: null, sentiment: 'skipped_by_manager', skipped: true,
    });
    res.json({ message: 'Skipped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
