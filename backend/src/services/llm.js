const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const MODELS = {
  gemini: 'google/gemini-2.5-flash',
  groq:   'google/gemini-2.5-flash', // fallback to same model, swap for groq when available
};

export async function callLLM(model, messages, maxTokens = 1000) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in environment');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'CopilotHire',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid LLM response: ' + JSON.stringify(data));
  }
  return data.choices[0].message.content;
}

function cleanJSON(raw) {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION GENERATION — high quality, category-aware
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_META = {
  behavioral: {
    label: 'Behavioral',
    instruction: 'Ask about real past experiences using STAR format. Start with "Tell me about a time..." or "Describe a situation where...". Focus on what the candidate actually did, not what they would do.',
  },
  situational: {
    label: 'Situational',
    instruction: 'Present a realistic hypothetical scenario the candidate would face in this role. Start with "Imagine you are..." or "How would you approach...". Test judgment and decision-making.',
  },
  experience: {
    label: 'Experience',
    instruction: 'Probe depth of relevant domain knowledge and past role accomplishments. Ask about specific projects, metrics achieved, tools mastered, or industries worked in.',
  },
  technical: {
    label: 'Technical',
    instruction: 'Assess role-specific technical or functional knowledge. For non-engineering roles this means processes, methodologies, tools, and frameworks relevant to the JD — not coding.',
  },
  culture: {
    label: 'Culture & Motivation',
    instruction: 'Understand what drives the candidate, their working style, values, and alignment with a growing team. Avoid yes/no questions.',
  },
  leadership: {
    label: 'Leadership',
    instruction: 'Assess how they influence, mentor, or lead others — even without a formal title. Probe cross-functional collaboration and conflict resolution.',
  },
};

export async function generateQuestionsLLM(resumeText, jd, role, seniority, extraContext, selectedCategories) {
  // Build per-category instructions
  const cats = (selectedCategories && selectedCategories.length > 0)
    ? selectedCategories
    : ['behavioral', 'situational', 'experience', 'technical'];

  const catInstructions = cats.map((c, i) => {
    const meta = CATEGORY_META[c] || { label: c, instruction: `Generate a question related to ${c}.` };
    const count = Math.ceil(10 / cats.length);
    return `Category "${meta.label}": generate ${i === 0 ? Math.max(count, 10 - (cats.length - 1) * Math.floor(10 / cats.length)) : Math.floor(10 / cats.length)} question(s). Rule: ${meta.instruction}`;
  }).join('\n');

  const content = await callLLM(
    MODELS.gemini,
    [
      {
        role: 'system',
        content: `You are a senior talent acquisition expert and interview coach with 15+ years experience.
You generate high-quality, incisive interview questions that reveal a candidate's true capabilities.

QUALITY RULES — every question must:
1. Be specific enough to require a concrete, detailed answer (not a simple yes/no)
2. Be directly relevant to the role and JD provided
3. Surface skills or behaviours that predict success in this specific role
4. Be phrased professionally but conversationally
5. Have a rubric that describes what EXCELLENT, AVERAGE, and POOR answers look like
6. NOT be generic or clichéd (avoid "Where do you see yourself in 5 years?", "What's your greatest weakness?")
7. Be calibrated to the seniority level — senior roles demand strategic thinking, junior roles probe fundamentals

CATEGORY INSTRUCTIONS:
${catInstructions}

Total: exactly 10 questions spread across the selected categories.

Return ONLY valid JSON. Schema:
{
  "questions": [
    {
      "id": 1,
      "question": "The actual question text",
      "category": "behavioral",
      "rubric": "EXCELLENT: candidate gives specific example with clear impact metrics, demonstrates ownership, shows reflection. AVERAGE: gives example but vague on outcome or their specific role. POOR: speaks generally, no concrete example, deflects responsibility.",
      "timeGuide": "2-3 minutes",
      "probeHints": ["Follow up: what was the specific outcome?", "Ask: what would you do differently?"]
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Role: ${role}
Seniority: ${seniority || 'Mid-level'}
Additional context from interviewer: ${extraContext || 'None provided'}
Categories requested: ${cats.join(', ')}

Job Description:
${jd}

Candidate Resume:
${resumeText || 'No resume provided — generate questions based on the role and JD only.'}`,
      },
    ],
    3000
  );

  return JSON.parse(cleanJSON(content));
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER EVALUATION — detailed, nuanced, context-aware
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateAnswerLLM(question, rubric, category, transcript, skippedByManager, notAnswered) {
  // Handle special cases before calling LLM
  if (skippedByManager) {
    return {
      score: null,
      strength: null,
      gap: null,
      followUp: null,
      sentiment: 'skipped_by_manager',
      analysis: 'This question was skipped by the interviewer and was not presented to the candidate.',
      skipReason: 'manager_skipped',
    };
  }

  if (notAnswered || !transcript || transcript.trim().length < 10) {
    return {
      score: 0,
      strength: null,
      gap: 'Candidate did not provide an answer to this question.',
      followUp: null,
      sentiment: 'not_answered',
      analysis: 'The candidate did not respond meaningfully to this question. This may indicate a knowledge gap or discomfort with the topic.',
      skipReason: 'candidate_no_answer',
    };
  }

  const content = await callLLM(
    MODELS.groq,
    [
      {
        role: 'system',
        content: `You are an expert interview evaluator helping a hiring manager assess a candidate's answer.
Your job is to provide an honest, specific, and actionable evaluation.

EVALUATION RULES:
1. Score 1-10 strictly: 9-10 = exceptional with concrete proof, 7-8 = solid and complete, 5-6 = adequate but vague, 3-4 = weak or off-topic, 1-2 = no relevant content
2. Be specific — reference actual things the candidate said, not generic observations
3. Identify the single most important strength and gap
4. Generate a follow-up only if the answer was incomplete, vague, or needs probing — set null if the answer was thorough
5. Sentiment: "confident" if clear and direct, "hesitant" if uncertain or qualified, "unclear" if rambling or off-topic
6. Analysis: 2-3 sentences giving context for the score — what was present and what was missing relative to the rubric

Return ONLY valid JSON:
{
  "score": 7,
  "strength": "Specific thing candidate did well, referencing their actual words",
  "gap": "Specific thing missing or weak, or null if none",
  "followUp": "One sharp follow-up question, or null",
  "sentiment": "confident",
  "analysis": "2-3 sentence evaluator commentary referencing the rubric criteria"
}`,
      },
      {
        role: 'user',
        content: `Question category: ${category}
Question: ${question}

Rubric (what a strong answer looks like):
${rubric}

Candidate's answer:
${transcript}`,
      },
    ],
    500
  );

  return JSON.parse(cleanJSON(content));
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT GENERATION — comprehensive, accurate, chart-ready
// ─────────────────────────────────────────────────────────────────────────────

export async function generateReportLLM(session) {
  const answeredQs = session.questions.filter(q => {
    const a = session.answers.find(ans => ans.question_id === q.id);
    return a && !a.skipped && a.transcript && a.transcript.trim().length > 10;
  });

  const skippedByManager = session.questions.filter(q => {
    const a = session.answers.find(ans => ans.question_id === q.id);
    return a && a.skipped;
  });

  const notAnswered = session.questions.filter(q => {
    const a = session.answers.find(ans => ans.question_id === q.id);
    return !a || (!a.skipped && (!a.transcript || a.transcript.trim().length < 10));
  });

  const qaBlock = session.questions.map((q, i) => {
    const a = session.answers.find(ans => ans.question_id === q.id) || {};
    const status = a.skipped ? 'SKIPPED_BY_MANAGER' :
                   (!a.transcript || a.transcript.trim().length < 10) ? 'NOT_ANSWERED_BY_CANDIDATE' : 'ANSWERED';
    return `Q${i + 1} [${q.category?.toUpperCase()}] — ${status}
Question: ${q.question}
${status === 'ANSWERED' ? `Score: ${a.score}/10\nStrength: ${a.strength || 'N/A'}\nGap: ${a.gap || 'None'}\nAnswer: ${a.transcript}` : ''}`;
  }).join('\n\n---\n\n');

  const content = await callLLM(
    MODELS.gemini,
    [
      {
        role: 'system',
        content: `You are writing a detailed, accurate post-interview assessment report for a non-technical hiring manager.
The report must be strictly based on the evidence from the Q&A — do not make up or assume anything not present in the answers.

IMPORTANT RULES:
1. Only score questions that were ANSWERED. Skipped and not-answered questions must NOT inflate or deflate the overall score
2. Overall score = average of answered questions only (clearly note how many were answered)
3. Verdict must be based on quality of actual answers, accounting for what was skipped or not answered
4. Strengths/gaps must reference specific answers, not generic traits
5. Red flags: only raise genuine concerns supported by answer evidence. Empty array if none.
6. Competency scores must reflect the actual answers provided — do not guess for unanswered areas
7. Analysis of skipped/unanswered questions must appear in the report

Competencies to score (1-10, only if enough evidence exists, otherwise null):
- communication: clarity, structure, articulation
- problemSolving: analytical thinking, frameworks used
- roleKnowledge: domain expertise, technical/functional depth
- leadership: influence, ownership, collaboration
- culturalFit: values, motivation, growth mindset
- adaptability: how they handle ambiguity or change

Return ONLY valid JSON:
{
  "overallScore": 7.2,
  "answeredCount": 8,
  "totalCount": 10,
  "skippedCount": 1,
  "notAnsweredCount": 1,
  "verdict": "recommend_hire",
  "verdictReason": "2-3 sentence explanation of why this verdict was reached",
  "summary": "4-5 sentence comprehensive assessment of the candidate based strictly on their answers",
  "strengths": ["Evidence-backed strength 1", "Evidence-backed strength 2", "Evidence-backed strength 3"],
  "gaps": ["Evidence-backed gap 1", "Evidence-backed gap 2"],
  "redFlags": ["Genuine concern with evidence, or empty array"],
  "nextSteps": ["Specific actionable next step 1", "Specific actionable next step 2", "Specific actionable next step 3"],
  "skippedAnalysis": "What the skipped questions covered and what that means for the assessment",
  "notAnsweredAnalysis": "What the unanswered questions reveal (if any)",
  "competencies": {
    "communication": 8,
    "problemSolving": 7,
    "roleKnowledge": 6,
    "leadership": null,
    "culturalFit": 7,
    "adaptability": 6
  },
  "categoryScores": {
    "behavioral": 7.5,
    "situational": 6.5,
    "experience": 8.0,
    "technical": null
  }
}`,
      },
      {
        role: 'user',
        content: `Candidate: ${session.candidate_name}
Role: ${session.role}
Seniority: ${session.seniority || 'Not specified'}
Total questions: ${session.questions.length}
Answered: ${answeredQs.length}
Skipped by manager: ${skippedByManager.length}
Not answered by candidate: ${notAnswered.length}

Interview Q&A:
${qaBlock}`,
      },
    ],
    2000
  );

  return JSON.parse(cleanJSON(content));
}