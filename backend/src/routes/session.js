import express from 'express';
import multer  from 'multer';
import path    from 'path';
import fs      from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseResume, truncateResume } from '../services/parser.js';
import { createSession, getSession, getAllSessions, deleteSession } from '../services/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

// All session routes require auth
router.use(requireAuth);

// POST /api/session/create
router.post('/create', upload.single('resume'), async (req, res) => {
  try {
    const { candidateName, role, seniority, jdText, extraContext } = req.body;

    if (!candidateName || !role || !jdText) {
      return res.status(400).json({ error: 'candidateName, role, and jdText are required' });
    }

    let resumeText = '';
    if (req.file) {
      resumeText = await parseResume(req.file.path, req.file.mimetype);
      resumeText = truncateResume(resumeText);
      fs.unlinkSync(req.file.path);
    }

    const sessionId = uuidv4();
    await createSession(sessionId, {
      userId:         req.userId,
      candidate_name: candidateName,
      role,
      seniority:      seniority || 'Mid-level',
      jd_text:        jdText,
      resume_text:    resumeText,
      extra_context:  extraContext || '',
    });

    res.json({ sessionId, message: 'Session created', hasResume: !!resumeText });
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session  — list all sessions for logged-in user
router.get('/', async (req, res) => {
  try {
    const sessions = await getAllSessions(req.userId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { resume_text, jd_text, ...summary } = session;
    res.json(summary);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/session/:id
router.delete('/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (session.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const deleted = await deleteSession(req.params.id);
    if (deleted) res.json({ message: 'Session deleted' });
    else res.status(404).json({ error: 'Session not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
