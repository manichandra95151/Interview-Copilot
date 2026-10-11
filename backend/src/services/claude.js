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

// ─────────────────────────────────────────────────────────────────────────────
// RESUME MATCHING v2 — hybrid: structured JD requirements + per-requirement
// evaluation with evidence + mandatory gating. Prompt-caches the JD block so
// evaluating a whole batch against one role is cheap.
// ─────────────────────────────────────────────────────────────────────────────

function cleanJSON(raw) {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

/** Call Claude with a JSON schema and return parsed JSON (tolerant of fences). */
async function completeJSON({ model, system, user, schema, maxTokens = 2000 }) {
  const message = await client().messages.create({
    model,
    max_tokens: maxTokens,
    output_config: { format: { type: 'json_schema', schema } },
    system, // array of content blocks (may carry cache_control)
    messages: [{ role: 'user', content: user }],
  });
  const text = textOf(message);
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(cleanJSON(text));
  }
}

/** Parse a job description into structured, checkable requirements. */
export async function parseJobRequirements({ jdText, role, seniority }) {
  const schema = {
    type: 'object',
    properties: {
      mandatorySkills: { type: 'array', items: { type: 'string' } },
      niceToHave: { type: 'array', items: { type: 'string' } },
      minYears: { type: 'integer' }, // 0 if unspecified
      education: { type: 'string' }, // "" if none required
      certifications: { type: 'array', items: { type: 'string' } },
      responsibilities: { type: 'array', items: { type: 'string' } },
    },
    required: ['mandatorySkills', 'niceToHave', 'minYears', 'education', 'certifications', 'responsibilities'],
    additionalProperties: false,
  };

  const system = [
    {
      type: 'text',
      text:
        'You are an expert technical recruiter. Extract the concrete, checkable requirements ' +
        'from a job description. Separate true MUST-HAVES (mandatorySkills, minimum years, ' +
        'required education/certs) from nice-to-haves. Keep skill names normalized and short ' +
        '(e.g. "React", "PostgreSQL"). Use minYears=0 and education="" when not specified.',
    },
  ];
  const user = `Role: ${role || 'N/A'} | Seniority: ${seniority || 'N/A'}\n\nJOB DESCRIPTION:\n${jdText}`;

  return completeJSON({ model: MODELS.reasoning, system, user, schema, maxTokens: 1500 });
}

/**
 * Evaluate one candidate against parsed JD requirements.
 * The requirements are placed in a cache_control'd system block so a batch of
 * candidates evaluated against the same role reuses the cached prefix.
 */
export async function evaluateCandidateFit({ requirements, candidateName, resumeText }) {
  const schema = {
    type: 'object',
    properties: {
      criteria: {
        type: 'object',
        properties: {
          skills: { type: 'object', properties: { score: { type: 'integer' }, evidence: { type: 'string' } }, required: ['score', 'evidence'], additionalProperties: false },
          experience: { type: 'object', properties: { score: { type: 'integer' }, evidence: { type: 'string' } }, required: ['score', 'evidence'], additionalProperties: false },
          responsibilities: { type: 'object', properties: { score: { type: 'integer' }, evidence: { type: 'string' } }, required: ['score', 'evidence'], additionalProperties: false },
          education: { type: 'object', properties: { score: { type: 'integer' }, evidence: { type: 'string' } }, required: ['score', 'evidence'], additionalProperties: false },
        },
        required: ['skills', 'experience', 'responsibilities', 'education'],
        additionalProperties: false,
      },
      matchedSkills: { type: 'array', items: { type: 'string' } },
      missingSkills: { type: 'array', items: { type: 'string' } },
      mandatory: {
        type: 'array',
        items: {
          type: 'object',
          properties: { requirement: { type: 'string' }, met: { type: 'boolean' }, evidence: { type: 'string' } },
          required: ['requirement', 'met', 'evidence'],
          additionalProperties: false,
        },
      },
      strengths: { type: 'array', items: { type: 'string' } },
      gaps: { type: 'array', items: { type: 'string' } },
      summary: { type: 'string' },
    },
    required: ['criteria', 'matchedSkills', 'missingSkills', 'mandatory', 'strengths', 'gaps', 'summary'],
    additionalProperties: false,
  };

  const system = [
    {
      type: 'text',
      text:
        'You are an expert technical recruiter scoring ONE candidate against a role. For each ' +
        'criterion (skills, experience, responsibilities, education) give a 0-100 score and a ' +
        'short evidence quote taken from the resume (or "No evidence found"). For every ' +
        'mandatory requirement, decide met=true/false with evidence. Be strict and honest: do ' +
        'not credit skills the resume does not actually demonstrate. matchedSkills/missingSkills ' +
        'should reference the required skills specifically.',
    },
    {
      type: 'text',
      text: `ROLE REQUIREMENTS (JSON):\n${JSON.stringify(requirements)}`,
      cache_control: { type: 'ephemeral' },
    },
  ];
  const user = `CANDIDATE: ${candidateName}\n\nRESUME:\n${(resumeText || '').slice(0, 9000)}`;

  return completeJSON({ model: MODELS.realtime, system, user, schema, maxTokens: 1800 });
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE INTERVIEW INSIGHT — fast, cheap read on an in-progress answer so the
// recruiter sees a running score + the follow-up worth asking. Haiku, small.
// ─────────────────────────────────────────────────────────────────────────────

export async function liveInsight({ question, rubric, category, transcript }) {
  const schema = {
    type: 'object',
    properties: {
      score: { type: 'integer' }, // 0-10 running quality of the answer so far
      strength: { type: 'string' }, // one concise strength (or "")
      gap: { type: 'string' }, // one concise gap/missing point (or "")
      followUp: { type: 'string' }, // the single best follow-up to ask next
      sentiment: { type: 'string' }, // confident | hesitant | evasive | neutral
    },
    required: ['score', 'strength', 'gap', 'followUp', 'sentiment'],
    additionalProperties: false,
  };

  const system = [
    {
      type: 'text',
      text:
        'You are an interview copilot assisting a recruiter in real time. You see the question ' +
        'and the candidate\'s answer so far (possibly mid-sentence). Give a quick read: a running ' +
        'score 0-10, one strength, one gap, the single most useful follow-up question to ask ' +
        'next, and the candidate\'s delivery sentiment. Be concise and practical. If the answer ' +
        'is too short to judge, score conservatively and set strength/gap to "".',
    },
  ];
  const user =
    `QUESTION (${category || 'general'}): ${question}\n` +
    `RUBRIC: ${rubric || 'N/A'}\n\n` +
    `ANSWER SO FAR:\n${(transcript || '').slice(0, 4000)}`;

  return completeJSON({ model: MODELS.realtime, system, user, schema, maxTokens: 500 });
}

/**
 * Conversation-aware live insight for a two-way interview.
 * Reads the recent labeled turns (Interviewer / Candidate), figures out which
 * question is currently being answered — whether it's a scripted question or
 * one the interviewer just asked out loud — and reads the candidate's answer.
 *
 * @param {object} args
 * @param {Array<{role:'interviewer'|'candidate', text:string}>} args.turns
 * @param {string} [args.plannedQuestion]  The scripted question in focus, if any.
 */
export async function conversationInsight({ turns, plannedQuestion }) {
  const schema = {
    type: 'object',
    properties: {
      activeQuestion: { type: 'string' }, // the question the candidate is answering now
      questionSource: { type: 'string' }, // "scripted" | "interviewer_adhoc" | "none"
      score: { type: 'integer' }, // 0-10 on the candidate's current answer
      strength: { type: 'string' },
      gap: { type: 'string' },
      followUp: { type: 'string' },
      sentiment: { type: 'string' },
    },
    required: ['activeQuestion', 'questionSource', 'score', 'strength', 'gap', 'followUp', 'sentiment'],
    additionalProperties: false,
  };

  const system = [
    {
      type: 'text',
      text:
        'You are an interview copilot for a live two-way interview. You see a labeled transcript ' +
        'of the recent conversation between the Interviewer and the Candidate. Determine which ' +
        'question the candidate is currently answering: it may be the planned/scripted question, ' +
        'or one the interviewer just asked spontaneously. Set questionSource accordingly ' +
        '("scripted", "interviewer_adhoc", or "none" if the candidate is mid-chat with no clear ' +
        'question). Then read the candidate\'s latest answer: running score 0-10, one strength, ' +
        'one gap, the single best follow-up to ask next, and delivery sentiment (confident | ' +
        'hesitant | evasive | neutral). Be concise. Judge only the CANDIDATE, never the interviewer.',
    },
  ];

  const convo = (turns || [])
    .slice(-14)
    .map((t) => `${t.role === 'candidate' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
    .join('\n');
  const user =
    (plannedQuestion ? `PLANNED QUESTION IN FOCUS: ${plannedQuestion}\n\n` : '') +
    `CONVERSATION (most recent):\n${convo}`;

  return completeJSON({ model: MODELS.realtime, system, user, schema, maxTokens: 600 });
}
