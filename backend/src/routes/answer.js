import express from 'express';
import { getSession, saveAnswer } from '../services/store.js';
import { evaluateAnswerLLM } from '../services/llm.js';

const router = express.Router();

// POST /api/answers/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { sessionId, questionId, transcript, manualNotes } = req.body;

    if (!sessionId || !questionId || !transcript) {
      return res.status(400).json({
        error: 'sessionId, questionId, and transcript are required',
      });
    }

    const session = getSession(sessionId);
    const question = session.questions.find(q => q.id == questionId);

    if (!question) {
      return res.status(404).json({ error: `Question ${questionId} not found in session` });
    }

    const evaluation = await evaluateAnswerLLM(
      question.question,
      question.rubric,
      question.category,
      transcript
    );

    const answerData = {
      question_id: questionId,
      transcript,
      manual_notes: manualNotes || '',
      ...evaluation,
    };

    saveAnswer(sessionId, questionId, answerData);

    res.json(evaluation);
  } catch (err) {
    console.error('Answer evaluation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/answers/skip
router.post('/skip', (req, res) => {
  try {
    const { sessionId, questionId } = req.body;
    const session = getSession(sessionId);
    const question = session.questions.find(q => q.id == questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    saveAnswer(sessionId, questionId, {
      question_id: questionId,
      transcript: '',
      score: null,
      strength: null,
      gap: null,
      followUp: null,
      sentiment: null,
      skipped: true,
    });

    res.json({ message: 'Question skipped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/answers/:sessionId
router.get('/:sessionId', (req, res) => {
  try {
    const session = getSession(req.params.sessionId);
    res.json({ answers: session.answers });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;