const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const MODELS = {
  // Gemini 2.5 Flash — long context, strong reasoning
  // Used for: question generation, report generation
  gemini: 'google/gemini-2.5-flash',
  // Groq Llama 3.3 70B — ultra fast, low latency
  // Used for: live answer evaluation, follow-up generation
  groq: 'google/gemini-2.5-flash',
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
      'X-Title': 'Interview Copilot',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response from LLM: ' + JSON.stringify(data));
  }
  return data.choices[0].message.content;
}

function cleanJSON(raw) {
  // Strip markdown code fences if model wraps JSON in them
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

// ─── Task-specific callers ────────────────────────────────────────────────────

export async function generateQuestionsLLM(resumeText, jd, role, seniority, extraContext) {
  const content = await callLLM(
    MODELS.gemini,
    [
      {
        role: 'system',
        content: `You are an expert interviewer generating tailored interview questions.
Given a resume, job description, and role context, generate exactly 10 interview questions.
Mix: 4 behavioral (past experience), 3 situational (hypothetical), 3 role-specific.
Each question must have a clear rubric of what a strong answer includes.
Return ONLY valid JSON with no markdown, no preamble:
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "category": "behavioral",
      "rubric": "A strong answer will include: ...",
      "timeGuide": "2-3 minutes"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Role: ${role}
Seniority: ${seniority || 'Mid-level'}
Additional context: ${extraContext || 'None'}

Job Description:
${jd}

Candidate Resume:
${resumeText}`,
      },
    ],
    2000
  );
  return JSON.parse(cleanJSON(content));
}

export async function evaluateAnswerLLM(question, rubric, category, transcript) {
  const content = await callLLM(
    MODELS.groq,
    [
      {
        role: 'system',
        content: `You are a real-time interview evaluator helping a non-technical hiring manager.
Evaluate the candidate's answer fairly and concisely.
Return ONLY valid JSON with no markdown:
{
  "score": 7,
  "strength": "One specific sentence about what was good",
  "gap": "One specific sentence about what was missing or null if none",
  "followUp": "One sharp follow-up question if the answer was vague or incomplete, otherwise null",
  "sentiment": "confident|hesitant|unclear"
}`,
      },
      {
        role: 'user',
        content: `Category: ${category}
Question: ${question}
What a strong answer covers: ${rubric}
Candidate's answer: ${transcript}`,
      },
    ],
    400
  );
  return JSON.parse(cleanJSON(content));
}

export async function generateReportLLM(session) {
  const qaBlock = session.questions
    .map((q, i) => {
      const a = session.answers.find(ans => ans.question_id === q.id) || {};
      return `Q${i + 1} [${q.category}]: ${q.question}
Score: ${a.score ?? 'N/A'}/10
Strength: ${a.strength ?? 'Not answered'}
Gap: ${a.gap ?? 'N/A'}
Transcript: ${a.transcript ?? 'Skipped'}`;
    })
    .join('\n\n');

  const content = await callLLM(
    MODELS.gemini,
    [
      {
        role: 'system',
        content: `You are writing a structured post-interview report for a non-technical hiring manager.
Be honest, specific, and actionable. Base everything strictly on the Q&A provided.
Return ONLY valid JSON with no markdown:
{
  "overallScore": 7.5,
  "verdict": "recommend_hire",
  "summary": "3-4 sentence plain English summary of the candidate's overall performance",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "redFlags": ["red flag 1 or empty array if none"],
  "nextSteps": ["actionable next step 1", "actionable next step 2"],
  "competencies": {
    "communication": 8,
    "problemSolving": 7,
    "roleKnowledge": 6,
    "leadership": 7,
    "culturalFit": 8
  }
}`,
      },
      {
        role: 'user',
        content: `Candidate: ${session.candidate_name}
Role: ${session.role}
Seniority: ${session.seniority || 'Not specified'}

Interview Q&A:
${qaBlock}`,
      },
    ],
    1500
  );
  return JSON.parse(cleanJSON(content));
}