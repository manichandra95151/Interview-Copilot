const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function req<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers as any || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed ${res.status}`);
  return data as T;
}

export const api = {
  createSession: (form: FormData, token: string) =>
    fetch(`${BASE}/api/session/create`, {
      method: 'POST', body: form,
      headers: { Authorization: `Bearer ${token}` },
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; }),

  getSessions:   (token: string) => req<any[]>('/api/session', {}, token),
  getSession:    (id: string, token: string) => req<any>(`/api/session/${id}`, {}, token),
  deleteSession: (id: string, token: string) => req<any>(`/api/session/${id}`, { method: 'DELETE' }, token),

  generateQuestions: (sessionId: string, selectedCategories: string[], token: string) =>
    req<any>('/api/questions/generate', { method: 'POST', body: JSON.stringify({ sessionId, selectedCategories }) }, token),

  getQuestions: (sessionId: string, token: string) => req<any>(`/api/questions/${sessionId}`, {}, token),

  evaluateAnswer: (sessionId: string, questionId: number, transcript: string, manualNotes: string, notAnswered: boolean, token: string) =>
    req<any>('/api/answers/evaluate', { method: 'POST', body: JSON.stringify({ sessionId, questionId, transcript, manualNotes, notAnswered }) }, token),

  skipQuestion: (sessionId: string, questionId: number, token: string) =>
    req<any>('/api/answers/skip', { method: 'POST', body: JSON.stringify({ sessionId, questionId }) }, token),

  generateReport: (sessionId: string, token: string) =>
    req<any>('/api/report/generate', { method: 'POST', body: JSON.stringify({ sessionId }) }, token),

  getReport:     (sessionId: string, token: string) => req<any>(`/api/report/${sessionId}`, {}, token),
  createShare:   (sessionId: string, token: string) => req<any>(`/api/report/${sessionId}/share`, { method: 'POST' }, token),
  getSharedReport: (shareToken: string) => req<any>(`/api/report/shared/${shareToken}`, {}),
};