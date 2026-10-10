import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseResume, truncateResume } from '../services/parser.js';
import {
  createCandidate,
  listCandidates,
  deleteCandidate,
} from '../services/candidates.js';
import { embedAndStoreResume, matchCandidatesToJD } from '../services/rag.js';
import { requireAuth } from '../middleware/auth.js';
import { userLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { matchCandidatesSchema } from '../config/schemas.js';

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
  limits: { fileSize: 10 * 1024 * 1024, files: 25 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

router.use(requireAuth, userLimiter);

// POST /api/candidates/upload — bulk resume upload (field name: "resumes")
router.post('/upload', upload.array('resumes', 25), async (req, res, next) => {
  const files = req.files || [];
  try {
    if (!files.length) return res.status(400).json({ error: 'No resume files uploaded' });

    const created = [];
    const failed = [];

    for (const file of files) {
      try {
        let resumeText = await parseResume(file.path, file.mimetype);
        resumeText = truncateResume(resumeText, 12000);
        // Derive a display name from the filename (recruiter can rename later).
        const name = path.basename(file.originalname, path.extname(file.originalname));

        const candidate = await createCandidate(req.userId, { name, resumeText });
        // Embeddings are best-effort — a RAG outage shouldn't lose the candidate.
        try {
          await embedAndStoreResume(candidate.id, req.userId, resumeText);
        } catch (embedErr) {
          console.warn('Embedding failed for candidate', candidate.id, embedErr.message);
        }
        created.push(candidate);
      } catch (err) {
        failed.push({ file: file.originalname, error: err.message });
      } finally {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      }
    }

    res.json({ created, failed });
  } catch (err) {
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    next(err);
  }
});

// GET /api/candidates — list the pool
router.get('/', async (req, res, next) => {
  try {
    res.json(await listCandidates(req.userId));
  } catch (err) {
    next(err);
  }
});

// POST /api/candidates/match — rank the pool against a JD
router.post('/match', validate(matchCandidatesSchema), async (req, res, next) => {
  try {
    const { jdText, role, seniority, topN } = req.body;
    const results = await matchCandidatesToJD({
      userId: req.userId,
      jdText,
      role,
      seniority,
      topN: topN || 10,
    });
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/candidates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteCandidate(req.userId, req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
