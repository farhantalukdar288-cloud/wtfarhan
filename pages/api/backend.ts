import type { NextApiRequest, NextApiResponse } from 'next';
import { MASTER_PROFILE_RULES, MASTER_PROFILE_SEED } from '../../backend/master-profile';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const ADMIN_PASS = '20090401';

async function sb(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function checkAdmin(password: string) {
  if (String(password || '').trim() !== ADMIN_PASS) throw new Error('Wrong admin password.');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { method, params = {} } = req.body || {};

  try {
    if (method === 'sendChatMessage') {
      const text = String(params.message || '').trim();
      const history = Array.isArray(params.history) ? params.history.slice(-10) : [];
      const contents = [
        { role: 'user', parts: [{ text: `SYSTEM RULES:\n${MASTER_PROFILE_RULES}\n\nMASTER PROFILE ABOUT FARHAN:\n${MASTER_PROFILE_SEED}` }] },
        { role: 'model', parts: [{ text: 'Understood. I will answer strictly as Farhan’s assistant using only these facts.' }] },
        ...history.map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] })),
        { role: 'user', parts: [{ text }] },
      ];

      const aiRes = await fetch(`https://googleapis.com{GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData?.error?.message || 'Gemini API error');
      const reply = aiData?.candidates?.at(0)?.content?.parts?.at(0)?.text || 'I could not generate a reply right now.';

      if (params.sessionId) {
        const existing = await sb(`kv_store?key=eq.chat:${encodeURIComponent(params.sessionId)}`);
        const prevMsgs = existing?.at(0)?.value?.messages || [];
        const messages = [...prevMsgs, { role: 'user', content: text, createdAt: new Date().toISOString() }, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }].slice(-50);
        await sb('kv_store', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ key: `chat:${params.sessionId}`, value: { sessionId: params.sessionId, updatedAt: new Date().toISOString(), device: params.device || {}, messages } }),
        });
      }
      return res.json({ reply });
    }

    if (method === 'recordChatVisit') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({ key: `visit:${id}`, value: { id, sessionId: params.sessionId, startedAt: new Date().toISOString(), device: params.device || {} } }),
      });
      return res.json({ ok: true });
    }

    if (method === 'submitVisitorNote') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({ key: `note:${id}`, value: { id, name: String(params.name || 'Anonymous').trim() || 'Anonymous', message: String(params.message || '').trim(), createdAt: new Date().toISOString() } }),
      });
      return res.json({ ok: true });
    }

    if (method === 'listMusicTracks') {
      const rows = await sb('kv_store?key=like.track:*');
      return res.json({ tracks: rows.map((r: any) => r.value).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)) });
    }

    if (method === 'listMovies') {
      const rows = await sb('kv_store?key=like.movie:*');
      return res.json({ movies: rows.map((r: any) => r.value).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)) });
    }

    if (method === 'getAdminDashboardData') {
      checkAdmin(params.password);
      const rows = await sb('kv_store');
      const notes = rows.filter((r: any) => r.key.startsWith('note:')).map((r: any) => r.value).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      const sessions = rows.filter((r: any) => r.key.startsWith('chat:')).map((r: any) => r.value).sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt));
      const visits = rows.filter((r: any) => r.key.startsWith('visit:')).map((r: any) => r.value).sort((a: any, b: any) => b.startedAt.localeCompare(a.startedAt));
      const tracks = rows.filter((r: any) => r.key.startsWith('track:')).map((r: any) => r.value).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      const movies = rows.filter((r: any) => r.key.startsWith('movie:')).map((r: any) => r.value).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ notes, sessions, visits, tracks, movies });
    }

    if (method === 'deleteVisitorNote') {
      checkAdmin(params.password);
      await sb(`kv_store?key=eq.note:${encodeURIComponent(params.id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    if (method === 'deleteChatVisit') {
      checkAdmin(params.password);
      await sb(`kv_store?key=eq.visit:${encodeURIComponent(params.id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    if (method === 'addMusicTrack') {
      checkAdmin(params.password);
      const match = String(params.url || '').match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      if (!match) throw new Error('Invalid Spotify link.');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({ key: `track:${id}`, value: { id, title: String(params.title || 'Spotify Track').trim(), kind: match.at(1), spotifyId: match.at(2), spotifyUrl: params.url, createdAt: new Date().toISOString() } }),
      });
      return res.json({ ok: true });
    }

    if (method === 'deleteMusicTrack') {
      checkAdmin(params.password);
      await sb(`kv_store?key=eq.track:${encodeURIComponent(params.id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    if (method === 'addMovie') {
      checkAdmin(params.password);
      const match = String(params.url || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (!match) throw new Error('Invalid YouTube link.');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({ key: `movie:${id}`, value: { id, title: String(params.title || 'YouTube Movie').trim(), youtubeId: match.at(1), youtubeUrl: params.url, createdAt: new Date().toISOString() } }),
      });
      return res.json({ ok: true });
    }

    if (method === 'deleteMovie') {
      checkAdmin(params.password);
      await sb(`kv_store?key=eq.movie:${encodeURIComponent(params.id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown method' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Server error' });
  }
}
