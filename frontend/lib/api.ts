const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export const api = {
  // Session
  createSession: (form: FormData) =>
    fetch(`${BASE}/api/session/create`, { method: 'POST', body: form }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    }),

  getSessions: () => request<any[]>('/api/session'),

  getSession: (id: string) => request<any>(`/api/session/${id}`),

  deleteSession: (id: string) =>
    request<any>(`/api/session/${id}`, { method: 'DELETE' }),

  // Questions
  generateQuestions: (sessionId: string) =>
    request<any>('/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  getQuestions: (sessionId: string) =>
    request<any>(`/api/questions/${sessionId}`),

  // Answers
  evaluateAnswer: (sessionId: string, questionId: number, transcript: string, manualNotes?: string) =>
    request<any>('/api/answers/evaluate', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId, transcript, manualNotes }),
    }),

  skipQuestion: (sessionId: string, questionId: number) =>
    request<any>('/api/answers/skip', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId }),
    }),

  // Report
  generateReport: (sessionId: string) =>
    request<any>('/api/report/generate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  getReport: (sessionId: string) => request<any>(`/api/report/${sessionId}`),
};