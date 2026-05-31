// In-memory store — works perfectly for development and demos
// For production: replace with Supabase calls (schema in README)

const store = new Map();

export function createSession(id, data) {
  store.set(id, {
    ...data,
    questions: [],
    answers: [],
    createdAt: new Date().toISOString(),
    status: 'setup',
  });
  return store.get(id);
}

export function getSession(id) {
  const session = store.get(id);
  if (!session) throw new Error(`Session ${id} not found`);
  return session;
}

export function updateSession(id, updates) {
  const session = getSession(id);
  store.set(id, { ...session, ...updates });
  return store.get(id);
}

export function saveQuestions(sessionId, questions) {
  const session = getSession(sessionId);
  session.questions = questions.map((q, i) => ({ ...q, id: q.id || i + 1 }));
  store.set(sessionId, { ...session, status: 'ready' });
  return session.questions;
}

export function saveAnswer(sessionId, questionId, answerData) {
  const session = getSession(sessionId);
  // Remove existing answer for this question if re-answering
  session.answers = session.answers.filter(a => a.question_id !== questionId);
  session.answers.push({
    question_id: questionId,
    ...answerData,
    answeredAt: new Date().toISOString(),
  });
  store.set(sessionId, session);
  return session.answers;
}

export function saveReport(sessionId, report) {
  const session = getSession(sessionId);
  store.set(sessionId, { ...session, report, status: 'completed' });
  return report;
}

export function getAllSessions(userId) {
  const sessions = [];
  for (const [id, session] of store.entries()) {
    if (session.userId === userId || !userId) {
      sessions.push({
        id,
        candidate_name: session.candidate_name,
        role: session.role,
        status: session.status,
        createdAt: session.createdAt,
        overallScore: session.report?.overallScore,
        verdict: session.report?.verdict,
        questionsCount: session.questions.length,
        answersCount: session.answers.length,
      });
    }
  }
  return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function deleteSession(id) {
  return store.delete(id);
}