/**
 * rag.js — resume → embeddings → pgvector search → Claude rerank.
 */
import { supabase } from '../db/supabase.js';
import { embed } from './voyage.js';
import { rerankCandidates } from './claude.js';

const CHUNK_SIZE = 1200; // chars
const CHUNK_OVERLAP = 150;

/** Split text into overlapping chunks suitable for embedding. */
export function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    chunks.push(clean.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

/**
 * Embed a candidate's resume and store the vectors.
 * Replaces any existing embeddings for that candidate.
 */
export async function embedAndStoreResume(candidateId, userId, resumeText) {
  const chunks = chunkText(resumeText);
  if (!chunks.length) return 0;

  const vectors = await embed(chunks, 'document');

  await supabase.from('resume_embeddings').delete().eq('candidate_id', candidateId);

  const rows = chunks.map((chunk, i) => ({
    candidate_id: candidateId,
    user_id: userId,
    chunk,
    embedding: vectors[i],
  }));

  const { error } = await supabase.from('resume_embeddings').insert(rows);
  if (error) throw new Error('DB store embeddings: ' + error.message);
  return rows.length;
}

/**
 * Match candidates against a job description.
 * 1. Embed the JD. 2. pgvector similarity search. 3. Claude rerank top-K.
 *
 * @returns {Promise<Array>} ranked candidates with similarity + Claude scores
 */
export async function matchCandidatesToJD({ userId, jdText, role, seniority, topN = 10 }) {
  const [jdVector] = await embed([jdText], 'query');

  const { data: matches, error } = await supabase.rpc('match_resumes', {
    query_embedding: jdVector,
    match_user_id: userId,
    match_count: topN,
  });
  if (error) throw new Error('DB match_resumes: ' + error.message);
  if (!matches?.length) return [];

  // Load candidate details for the matched ids.
  const ids = matches.map((m) => m.candidate_id);
  const { data: candidates, error: candErr } = await supabase
    .from('candidates')
    .select('id, name, email, resume_text')
    .in('id', ids)
    .is('deleted_at', null);
  if (candErr) throw new Error('DB load candidates: ' + candErr.message);

  const simById = new Map(matches.map((m) => [m.candidate_id, m.similarity]));

  // Claude rerank with written justification.
  const rankings = await rerankCandidates({
    jdText,
    role,
    seniority,
    candidates: candidates.map((c) => ({ id: c.id, name: c.name, resumeText: c.resume_text })),
  });

  const rankById = new Map(rankings.map((r) => [r.candidateId, r]));

  return candidates
    .map((c) => {
      const rank = rankById.get(c.id);
      return {
        candidateId: c.id,
        name: c.name,
        email: c.email,
        similarity: Number((simById.get(c.id) ?? 0).toFixed(4)),
        score: rank?.score ?? null,
        justification: rank?.justification ?? '',
        strengths: rank?.strengths ?? [],
        gaps: rank?.gaps ?? [],
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
