import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseResume, truncateResume } from '../services/parser.js';
import { createSession, getSession, getAllSessions, deleteSession } from '../services/store.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

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
      // Clean up uploaded file after parsing
      fs.unlinkSync(req.file.path);
    }

    const sessionId = uuidv4();
    const session = createSession(sessionId, {
      userId: req.headers['x-user-id'] || 'anonymous',
      candidate_name: candidateName,
      role,
      seniority: seniority || 'Mid-level',
      jd_text: jdText,
      resume_text: resumeText,
      extra_context: extraContext || '',
    });

    res.json({
      sessionId,
      message: 'Session created successfully',
      hasResume: !!resumeText,
    });
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/:id
router.get('/:id', (req, res) => {
  try {
    const session = getSession(req.params.id);
    // Don't send full resume/JD text in list view
    const { resume_text, jd_text, ...summary } = session;
    res.json(summary);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/session
router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const sessions = getAllSessions(userId);
  res.json(sessions);
});

// DELETE /api/session/:id
router.delete('/:id', (req, res) => {
  const deleted = deleteSession(req.params.id);
  if (deleted) res.json({ message: 'Session deleted' });
  else res.status(404).json({ error: 'Session not found' });
});

export default router;