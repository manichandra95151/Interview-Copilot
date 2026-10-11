/**
 * interview.js — live two-way interview WebSocket (rooms).
 *
 * Both the recruiter (interviewer) and the candidate connect to the SAME
 * session room, each streaming their own mic to their own Deepgram stream.
 * Because we know which device is which, speakers are perfectly separated —
 * no diarization needed. The recruiter receives a labeled conversation feed
 * plus conversation-aware AI insight; the candidate just streams.
 *
 * Connect query params:
 *   sessionId   (required)
 *   role        'interviewer' | 'candidate'
 *   token       Supabase access token      (interviewer)
 *   joinToken   candidate join token       (candidate)
 *
 * server→interviewer: {type:'ready'} | {type:'transcript', role, text, isFinal}
 *   | {type:'insight', ...} | {type:'peer', role, connected} | {type:'error'}
 * server→candidate:   {type:'ready'} | {type:'error'}
 */
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../config/env.js';
import { supabase } from '../db/supabase.js';
import { getSession, getSessionByJoinToken } from '../services/store.js';
import { conversationInsight } from '../services/claude.js';

const DG_URL =
  `wss://api.deepgram.com/v1/listen?model=${env.DEEPGRAM_MODEL}` +
  '&smart_format=true&interim_results=true&punctuate=true&utterance_end_ms=1000&vad_events=true';

const INSIGHT_MIN_GAP_MS = 6000;
const INSIGHT_MIN_CHARS = 30;

/** sessionId -> { participants:Set, turns:[], plannedQuestion, lastInsightAt, insightInFlight } */
const rooms = new Map();

function getRoom(sessionId) {
  let room = rooms.get(sessionId);
  if (!room) {
    room = { participants: new Set(), turns: [], plannedQuestion: null, lastInsightAt: 0, insightInFlight: false };
    rooms.set(sessionId, room);
  }
  return room;
}

function broadcast(room, roleFilter, obj) {
  const data = JSON.stringify(obj);
  for (const p of room.participants) {
    if (roleFilter && p.role !== roleFilter) continue;
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
  }
}

function appendTurn(room, role, text) {
  const last = room.turns[room.turns.length - 1];
  if (last && last.role === role) last.text += ' ' + text;
  else room.turns.push({ role, text });
  if (room.turns.length > 60) room.turns.shift();
}

export function attachInterviewWS(server) {
  const wss = new WebSocketServer({ server, path: '/ws/interview' });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const sessionId = url.searchParams.get('sessionId');
    const role = url.searchParams.get('role') === 'candidate' ? 'candidate' : 'interviewer';
    const token = url.searchParams.get('token');
    const joinToken = url.searchParams.get('joinToken');

    if (!sessionId) return ws.close(1008, 'Missing session');

    // ── Auth by role ──
    if (role === 'interviewer') {
      if (!token) return ws.close(1008, 'Unauthorized');
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return ws.close(1008, 'Unauthorized');
      try {
        const session = await getSession(sessionId);
        if (session.userId !== data.user.id) return ws.close(1008, 'Forbidden');
      } catch { return ws.close(1008, 'Session not found'); }
    } else {
      if (!joinToken) return ws.close(1008, 'Unauthorized');
      try {
        const s = await getSessionByJoinToken(joinToken);
        if (s.id !== sessionId) return ws.close(1008, 'Forbidden');
      } catch { return ws.close(1008, 'Invalid link'); }
    }

    const room = getRoom(sessionId);
    const send = (obj) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(obj));

    const participant = { ws, role, dg: null };
    room.participants.add(participant);
    // Tell interviewers this peer connected.
    broadcast(room, 'interviewer', { type: 'peer', role, connected: true });

    function openDeepgram() {
      if (!env.DEEPGRAM_API_KEY) { send({ type: 'error', message: 'stt_unconfigured' }); return; }
      const dg = new WebSocket(DG_URL, { headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` } });
      participant.dg = dg;
      dg.on('open', () => send({ type: 'ready' }));
      dg.on('message', (raw) => {
        let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
        if (msg.type === 'Results') {
          const text = msg.channel?.alternatives?.[0]?.transcript || '';
          if (!text) return;
          // Labeled transcript goes to the interviewer(s); candidate sees only their own.
          broadcast(room, 'interviewer', { type: 'transcript', role, text, isFinal: !!msg.is_final });
          if (role === 'candidate') send({ type: 'transcript', role, text, isFinal: !!msg.is_final });
          if (msg.is_final) appendTurn(room, role, text);
        } else if (msg.type === 'UtteranceEnd' && role === 'candidate') {
          maybeInsight(room);
        }
      });
      dg.on('error', () => send({ type: 'error', message: 'stt_error' }));
      dg.on('close', () => { participant.dg = null; });
    }

    ws.on('message', (raw, isBinary) => {
      if (isBinary) {
        if (participant.dg && participant.dg.readyState === WebSocket.OPEN) participant.dg.send(raw);
        return;
      }
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'start') {
        if (role === 'interviewer' && typeof msg.plannedQuestion === 'string') room.plannedQuestion = msg.plannedQuestion;
        if (!participant.dg) openDeepgram();
        else send({ type: 'ready' });
      } else if (msg.type === 'planned' && role === 'interviewer') {
        room.plannedQuestion = msg.question || null;
      } else if (msg.type === 'insight_now' && role === 'interviewer') {
        maybeInsight(room, true);
      } else if (msg.type === 'stop') {
        // keep the socket open for the rest of the session
      }
    });

    ws.on('close', () => {
      if (participant.dg && participant.dg.readyState === WebSocket.OPEN) participant.dg.close();
      room.participants.delete(participant);
      broadcast(room, 'interviewer', { type: 'peer', role, connected: false });
      if (room.participants.size === 0) rooms.delete(sessionId);
    });
    ws.on('error', () => { if (participant.dg?.readyState === WebSocket.OPEN) participant.dg.close(); });
  });

  async function maybeInsight(room, force = false) {
    const now = Date.now();
    const candidateChars = room.turns.filter((t) => t.role === 'candidate').reduce((n, t) => n + t.text.length, 0);
    if (candidateChars < INSIGHT_MIN_CHARS) return;
    if (!force && (room.insightInFlight || now - room.lastInsightAt < INSIGHT_MIN_GAP_MS)) return;
    room.insightInFlight = true;
    room.lastInsightAt = now;
    try {
      const insight = await conversationInsight({ turns: room.turns, plannedQuestion: room.plannedQuestion });
      broadcast(room, 'interviewer', { type: 'insight', ...insight });
    } catch {
      // non-fatal
    } finally {
      room.insightInFlight = false;
    }
  }

  return wss;
}
