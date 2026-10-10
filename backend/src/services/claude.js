/**
 * claude.js — Anthropic Claude API wrapper.
 *
 * Centralizes the client, model selection, and prompt-caching strategy.
 * This is the basis that replaces the legacy Gemini/Groq llm.js over the
 * next phases. Phase 2 uses it for RAG candidate reranking.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

export const MODELS = {
  // Fast, cheap — real-time interview follow-ups (Phase 4).
  realtime: 'claude-haiku-4-5',
  // Balanced reasoning — reranking, evaluation.
  reasoning: 'claude-sonnet-4-6',
  // Deepest reasoning — final reports (Phase 5).
  report: 'claude-opus-4-8',
};

let _client = null;
function client() {
  if (!env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error('AI features are not configured (missing ANTHROPIC_API_KEY)'), {
      status: 503,
    });
  }
  if (!_client) _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}

/** Extract the first text block from a Claude response. */
function textOf(message) {
  const block = message.content.find((b) => b.type === 'text');
  return block ? block.text : '';
}

/**
 * Rank candidate resumes against a job description.
 *
 * @param {object} args
 * @param {string} args.jdText        Job description.
 * @param {string} [args.role]        Role title.
 * @param {string} [args.seniority]   Seniority level.
 * @param {Array<{id: string, name: string, resumeText: string}>} args.candidates
 * @returns {Promise<Array<{candidateId, score, justification, strengths, gaps}>>}
 */
export async function rerankCandidates({ jdText, role, seniority, candidates }) {
  if (!candidates.length) return [];

  const schema = {
    type: 'object',
    properties: {
      rankings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidate_id: { type: 'string' },
            score: { type: 'integer' }, // 0-100 fit score
            justification: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } },
          },
          required: ['candidate_id', 'score', 'justification', 'strengths', 'gaps'],
          additionalProperties: false,
        },
      },
    },
    required: ['rankings'],
    additionalProperties: false,
  };

  const system =
    'You are an expert technical recruiter. Given a job description and a set of candidate ' +
    'resumes, score each candidate 0-100 for fit, with evidence-backed justification. Be ' +
    'specific and honest about gaps. Rank strictly on relevance to the role and requirements.';

  const candidateBlock = candidates
    .map(
      (c, i) =>
        `### Candidate ${i + 1} (id: ${c.id}) — ${c.name}\n${(c.resumeText || '').slice(0, 6000)}`
    )
    .join('\n\n');

  const userText =
    `JOB DESCRIPTION\nRole: ${role || 'N/A'} | Seniority: ${seniority || 'N/A'}\n\n${jdText}\n\n` +
    `CANDIDATES\n${candidateBlock}\n\n` +
    `Return a ranking for every candidate, highest fit first. Use the exact id given for each candidate.`;

  const message = await client().messages.create({
    model: MODELS.reasoning,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema },
    },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText }],
  });

  const parsed = JSON.parse(textOf(message));
  const byId = new Map(candidates.map((c) => [c.id, c]));

  return (parsed.rankings || [])
    .filter((r) => byId.has(r.candidate_id))
    .map((r) => ({
      candidateId: r.candidate_id,
      score: r.score,
      justification: r.justification,
      strengths: r.strengths || [],
      gaps: r.gaps || [],
    }))
    .sort((a, b) => b.score - a.score);
}
