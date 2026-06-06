import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(id, data) {
  const { error, data: row } = await supabase
    .from('sessions')
    .insert({
      id,
      user_id:        data.userId,
      candidate_name: data.candidate_name,
      role:           data.role,
      seniority:      data.seniority || 'Mid-level',
      jd_text:        data.jd_text,
      resume_text:    data.resume_text,
      extra_context:  data.extra_context || '',
      status:         'setup',
    })
    .select()
    .single();

  if (error) throw new Error('DB createSession: ' + error.message);
  return _mapSession(row, [], []);
}

export async function getSession(id) {
  const { data: row, error } = await supabase
    .from('sessions').select('*').eq('id', id).single();
  if (error || !row) throw new Error(`Session ${id} not found`);
  const questions = await _getQuestions(id);
  const answers   = await _getAnswers(id);
  return _mapSession(row, questions, answers);
}

export async function getSessionByShareToken(token) {
  const { data: row, error } = await supabase
    .from('sessions').select('*').eq('share_token', token).single();
  if (error || !row) throw new Error('Invalid share link');
  const questions = await _getQuestions(row.id);
  const answers   = await _getAnswers(row.id);
  return _mapSession(row, questions, answers);
}

export async function generateShareToken(sessionId) {
  const token = crypto.randomBytes(16).toString('hex');
  const { error } = await supabase
    .from('sessions')
    .update({ share_token: token, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw new Error('DB generateShareToken: ' + error.message);
  return token;
}

export async function saveQuestions(sessionId, questions) {
  await supabase.from('questions').delete().eq('session_id', sessionId);
  const rows = questions.map((q, i) => ({
    session_id:   sessionId,
    question_idx: i + 1,
    question:     q.question,
    category:     q.category,
    rubric:       q.rubric,
    time_guide:   q.timeGuide || null,
  }));
  const { error } = await supabase.from('questions').insert(rows);
  if (error) throw new Error('DB saveQuestions: ' + error.message);
  await supabase.from('sessions').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', sessionId);
  return _getQuestions(sessionId);
}

export async function addQuestion(sessionId, questionData) {
  const { data: countData, error: countErr } = await supabase
    .from('questions')
    .select('question_idx')
    .eq('session_id', sessionId);
  if (countErr) throw new Error('DB addQuestion count: ' + countErr.message);

  const nextIdx = (countData || []).length + 1;

  const { data, error } = await supabase
    .from('questions')
    .insert({
      session_id: sessionId,
      question_idx: nextIdx,
      question: questionData.question,
      category: questionData.category || 'follow-up',
      rubric: questionData.rubric || 'Follow-up question',
      time_guide: questionData.timeGuide || null,
    })
    .select()
    .single();

  if (error) throw new Error('DB addQuestion insert: ' + error.message);
  return {
    id: data.question_idx,
    question: data.question,
    category: data.category,
    rubric: data.rubric,
    timeGuide: data.time_guide,
  };
}

export async function saveAnswer(sessionId, questionId, answerData) {
  const { error } = await supabase.from('answers').upsert(
    {
      session_id:   sessionId,
      question_id:  questionId,
      transcript:   answerData.transcript || '',
      manual_notes: answerData.manual_notes || '',
      score:        answerData.score ?? null,
      strength:     answerData.strength || null,
      gap:          answerData.gap || null,
      follow_up:    answerData.followUp || null,
      sentiment:    answerData.sentiment || null,
      skipped:      answerData.skipped || false,
      answered_at:  new Date().toISOString(),
    },
    { onConflict: 'session_id,question_id' }
  );
  if (error) throw new Error('DB saveAnswer: ' + error.message);
}

export async function saveReport(sessionId, report) {
  const { error } = await supabase.from('reports').upsert(
    {
      session_id:    sessionId,
      overall_score: report.overallScore,
      verdict:       report.verdict,
      summary:       report.summary,
      strengths:     report.strengths,
      gaps:          report.gaps,
      red_flags:     report.redFlags,
      next_steps:    report.nextSteps,
      competencies:  report.competencies,
      // Store extra fields in competencies JSON for now
      extra_data:    JSON.stringify({
        verdictReason:       report.verdictReason,
        answeredCount:       report.answeredCount,
        totalCount:          report.totalCount,
        skippedCount:        report.skippedCount,
        notAnsweredCount:    report.notAnsweredCount,
        skippedAnalysis:     report.skippedAnalysis,
        notAnsweredAnalysis: report.notAnsweredAnalysis,
        categoryScores:      report.categoryScores,
      }),
    },
    { onConflict: 'session_id' }
  );
  if (error) throw new Error('DB saveReport: ' + error.message);
  await supabase.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', sessionId);
  return report;
}

export async function getReport(sessionId) {
  const { data, error } = await supabase
    .from('reports').select('*').eq('session_id', sessionId).single();
  if (error || !data) return null;
  let extra = {};
  try { extra = JSON.parse(data.extra_data || '{}'); } catch {}
  return {
    overallScore:        data.overall_score,
    verdict:             data.verdict,
    summary:             data.summary,
    strengths:           data.strengths,
    gaps:                data.gaps,
    redFlags:            data.red_flags,
    nextSteps:           data.next_steps,
    competencies:        data.competencies,
    ...extra,
  };
}

export async function getAllSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, candidate_name, role, seniority, status, created_at, share_token, questions(count), answers(count), reports(overall_score, verdict)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('DB getAllSessions: ' + error.message);
  return (data || []).map(s => ({
    id:             s.id,
    candidate_name: s.candidate_name,
    role:           s.role,
    status:         s.status,
    createdAt:      s.created_at,
    shareToken:     s.share_token,
    overallScore:   s.reports?.[0]?.overall_score ?? null,
    verdict:        s.reports?.[0]?.verdict ?? null,
    questionsCount: s.questions?.[0]?.count ?? 0,
    answersCount:   s.answers?.[0]?.count ?? 0,
  }));
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  return !error;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function _getQuestions(sessionId) {
  const { data } = await supabase.from('questions').select('*').eq('session_id', sessionId).order('question_idx');
  return (data || []).map(q => ({
    id:        q.question_idx,
    question:  q.question,
    category:  q.category,
    rubric:    q.rubric,
    timeGuide: q.time_guide,
  }));
}

async function _getAnswers(sessionId) {
  const { data } = await supabase.from('answers').select('*').eq('session_id', sessionId);
  return (data || []).map(a => ({
    question_id:  a.question_id,
    transcript:   a.transcript,
    manual_notes: a.manual_notes,
    score:        a.score,
    strength:     a.strength,
    gap:          a.gap,
    followUp:     a.follow_up,
    sentiment:    a.sentiment,
    skipped:      a.skipped,
    analysis:     a.analysis,
    answeredAt:   a.answered_at,
  }));
}

function _mapSession(row, questions, answers) {
  return {
    id:             row.id,
    userId:         row.user_id,
    candidate_name: row.candidate_name,
    role:           row.role,
    seniority:      row.seniority,
    jd_text:        row.jd_text,
    resume_text:    row.resume_text,
    extra_context:  row.extra_context,
    status:         row.status,
    shareToken:     row.share_token,
    createdAt:      row.created_at,
    questions,
    answers,
  };
}