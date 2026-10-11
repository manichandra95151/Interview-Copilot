/**
 * matching.js — hybrid resume ranking (Resume Matching v2).
 *
 * For a recruiter's pool (tens to low-hundreds per JD) we evaluate EVERY
 * candidate against the role rather than retrieving a subset — ranking, not
 * retrieval. Pipeline: parse JD → structured requirements, then per-candidate
 * requirement-by-requirement evaluation with evidence, a weighted score, and
 * separate mandatory gating.
 *
 * (pgvector retrieval remains available for the thousands-of-resumes case.)
 */
import { supabase } from '../db/supabase.js';
import { parseJobRequirements, evaluateCandidateFit } from './claude.js';

const DEFAULT_WEIGHTS = { skills: 35, experience: 25, responsibilities: 25, education: 15 };
const EVAL_CONCURRENCY = 5;
const MAX_EVALUATE = 60; // cap to bound cost/latency per match

/** Run async fn over items with a fixed concurrency limit, preserving order. */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function normalizeWeights(input) {
  const w = { ...DEFAULT_WEIGHTS, ...(input || {}) };
  const total = w.skills + w.experience + w.responsibilities + w.education || 1;
  return {
    skills: w.skills / total,
    experience: w.experience / total,
    responsibilities: w.responsibilities / total,
    education: w.education / total,
  };
}

export async function matchCandidatesHybrid({ userId, jdText, role, seniority, weights }) {
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, name, email, resume_text')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error('DB load candidates: ' + error.message);
  if (!candidates?.length) return { results: [], requirements: null, evaluated: 0, total: 0, weights: DEFAULT_WEIGHTS };

  const pool = candidates.slice(0, MAX_EVALUATE);
  const requirements = await parseJobRequirements({ jdText, role, seniority });
  const w = normalizeWeights(weights);

  const evaluated = await mapLimit(pool, EVAL_CONCURRENCY, async (c) => {
    try {
      const ev = await evaluateCandidateFit({
        requirements,
        candidateName: c.name,
        resumeText: c.resume_text,
      });
      const cr = ev.criteria;
      const score = Math.round(
        cr.skills.score * w.skills +
        cr.experience.score * w.experience +
        cr.responsibilities.score * w.responsibilities +
        cr.education.score * w.education
      );
      const mandatoryMet = (ev.mandatory || []).every((m) => m.met);
      return {
        candidateId: c.id,
        name: c.name,
        email: c.email,
        score,
        mandatoryMet,
        criteria: cr,
        matchedSkills: ev.matchedSkills || [],
        missingSkills: ev.missingSkills || [],
        mandatory: ev.mandatory || [],
        strengths: ev.strengths || [],
        gaps: ev.gaps || [],
        summary: ev.summary || '',
      };
    } catch (err) {
      console.warn('Eval failed for candidate', c.id, err.message);
      return {
        candidateId: c.id, name: c.name, email: c.email,
        score: null, mandatoryMet: null, error: true,
        matchedSkills: [], missingSkills: [], mandatory: [], strengths: [], gaps: [], summary: '',
      };
    }
  });

  // Rank: mandatory-met first, then by weighted score. Errors sink to the bottom.
  evaluated.sort((a, b) => {
    const am = a.mandatoryMet ? 1 : 0;
    const bm = b.mandatoryMet ? 1 : 0;
    if (am !== bm) return bm - am;
    return (b.score ?? -1) - (a.score ?? -1);
  });

  return {
    results: evaluated,
    requirements,
    weights: { skills: Math.round(w.skills * 100), experience: Math.round(w.experience * 100), responsibilities: Math.round(w.responsibilities * 100), education: Math.round(w.education * 100) },
    evaluated: pool.length,
    total: candidates.length,
  };
}
