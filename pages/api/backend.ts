import type { NextApiRequest, NextApiResponse } from 'next';
import { MASTER_PROFILE_RULES, MASTER_PROFILE_SEED } from '../../backend/master-profile';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const ADMIN_PASS = '20090401';

const MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

async function callGeminiWithFallback(contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>) {
  let lastError = 'Gemini API error';

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_KEY,
          },
          body: JSON.stringify({ contents }),
        }
      );

      const aiData = await aiRes.json();
      if (aiRes.ok) {
        return aiData;
      }

      const msg = String(aiData?.error?.message || `Gemini API error (${aiRes.status})`);
      lastError = msg;

      const isOverloaded =
        aiRes.status === 429 ||
        aiRes.status === 503 ||
        /high demand|overloaded|unavailable|quota|capacity/i.test(msg);

      if (isOverloaded && attempt === 0) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      if (isOverloaded) {
        break;
      }

      throw new Error(msg);
    }
  }

  throw new Error(lastError);
}

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
  const { httpMethod = 'GET', path = '', body = {} } = req.body || {};
  const cleanPath = String(path).split('?').at(0) || '';

  try {
    // 1. AI Chat
    if (cleanPath === '/api/chat' && httpMethod === 'POST') {
      if (!GEMINI_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing in environment variables.' });
      }

      const rawMsgs = Array.isArray(body.messages) ? body.messages : [];
      const cleanMsgs = rawMsgs
        .map((m: any) => ({
          role: m?.role === 'assistant' ? 'model' : 'user',
          text: String(m?.content ?? m?.text ?? '').trim(),
        }))
        .filter((m: any) => m.text.length > 0);

      let lastUserText = '';
      if (cleanMsgs.length > 0 && cleanMsgs.at(-1)?.role === 'user') {
        lastUserText = cleanMsgs.at(-1)!.text;
      } else {
        lastUserText = String(body.message || body.prompt || '').trim() || 'Hello';
      }

      const historyMsgs =
        cleanMsgs.length > 0 && cleanMsgs.at(-1)?.role === 'user'
          ? cleanMsgs.slice(0, -1).slice(-10)
          : cleanMsgs.slice(-10);

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [
        {
          role: 'user',
          parts: [
            {
              text: `SYSTEM RULES:\n${MASTER_PROFILE_RULES}\n\nMASTER PROFILE ABOUT FARHAN:\n${MASTER_PROFILE_SEED}`,
            },
          ],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will answer strictly as Farhan’s assistant using only these facts.' }],
        },
      ];

      for (const item of historyMsgs) {
        const prevRole = contents.at(-1)?.role;
        if (prevRole !== item.role) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }

      if (contents.at(-1)?.role === 'user') {
        contents.at(-1)!.parts[0].text = `${contents.at(-1)!.parts[0].text}\n\n${lastUserText}`.trim();
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: lastUserText }],
        });
      }

      const aiData = await callGeminiWithFallback(contents);

      const reply =
        aiData?.candidates?.at(0)?.content?.parts?.at(0)?.text ||
        'I could not generate a reply right now.';

      if (body.sessionId) {
        const savedMessages = [
          ...rawMsgs,
          { role: 'assistant', content: reply, createdAt: new Date().toISOString() },
        ].slice(-50);

        await sb('kv_store', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            key: `chat:${body.sessionId}`,
            value: {
              sessionId: body.sessionId,
              updatedAt: new Date().toISOString(),
              device: body.device || {},
              messages: savedMessages,
            },
          }),
        });
      }

      return res.json({ text: reply, reply });
    }

    // 2. Chat Visits
    if (cleanPath === '/api/chat-visits' && httpMethod === 'POST') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({
          key: `visit:${id}`,
          value: {
            id,
            sessionId: body.sessionId,
            startedAt: new Date().toISOString(),
            device: body.device || {},
          },
        }),
      });
      return res.json({ ok: true });
    }

    if (cleanPath.startsWith('/api/chat-visits/') && httpMethod === 'DELETE') {
      checkAdmin(body.password);
      const id = cleanPath.replace('/api/chat-visits/', '');
      await sb(`kv_store?key=eq.visit:${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // 3. Visitor Notes
    if (cleanPath === '/api/notes' && httpMethod === 'POST') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({
          key: `note:${id}`,
          value: {
            id,
            name: String(body.name || 'Anonymous').trim() || 'Anonymous',
            message: String(body.message || '').trim(),
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return res.json({ ok: true });
    }

    if (cleanPath.startsWith('/api/notes/') && httpMethod === 'DELETE') {
      checkAdmin(body.password);
      const id = cleanPath.replace('/api/notes/', '');
      await sb(`kv_store?key=eq.note:${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // 4. Spotify Music
    if (cleanPath === '/api/music' && httpMethod === 'GET') {
      const rows = await sb('kv_store?key=like.track:*');
      const items = rows
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ items, tracks: items });
    }

    if (cleanPath === '/api/music' && httpMethod === 'POST') {
      checkAdmin(body.password);
      const match = String(body.url || '').match(
        /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
      );
      if (!match) throw new Error('Invalid Spotify link.');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({
          key: `track:${id}`,
          value: {
            id,
            title: String(body.title || 'Spotify Track').trim(),
            kind: match.at(1),
            spotifyId: match.at(2),
            spotifyUrl: body.url,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return res.json({ ok: true });
    }

    if (cleanPath.startsWith('/api/music/') && httpMethod === 'DELETE') {
      checkAdmin(body.password);
      const id = cleanPath.replace('/api/music/', '');
      await sb(`kv_store?key=eq.track:${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // 5. YouTube Movies
    if (cleanPath === '/api/movies' && httpMethod === 'GET') {
      const rows = await sb('kv_store?key=like.movie:*');
      const items = rows
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ items, movies: items });
    }

    if (cleanPath === '/api/movies' && httpMethod === 'POST') {
      checkAdmin(body.password);
      const match = String(body.url || '').match(
        /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/
      );
      if (!match) throw new Error('Invalid YouTube link.');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await sb('kv_store', {
        method: 'POST',
        body: JSON.stringify({
          key: `movie:${id}`,
          value: {
            id,
            title: String(body.title || 'YouTube Movie').trim(),
            youtubeId: match.at(1),
            youtubeUrl: body.url,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return res.json({ ok: true });
    }

    if (cleanPath.startsWith('/api/movies/') && httpMethod === 'DELETE') {
      checkAdmin(body.password);
      const id = cleanPath.replace('/api/movies/', '');
      await sb(`kv_store?key=eq.movie:${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // 6. Admin Dashboard
    if (cleanPath === '/api/admin' || cleanPath === '/api/admin-notes') {
      checkAdmin(body.password);
      const rows = await sb('kv_store');
      const notes = rows
        .filter((r: any) => r.key.startsWith('note:'))
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      const sessions = rows
        .filter((r: any) => r.key.startsWith('chat:'))
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt));
      const visits = rows
        .filter((r: any) => r.key.startsWith('visit:'))
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.startedAt.localeCompare(a.startedAt));
      const tracks = rows
        .filter((r: any) => r.key.startsWith('track:'))
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      const movies = rows
        .filter((r: any) => r.key.startsWith('movie:'))
        .map((r: any) => r.value)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ notes, sessions, visits, tracks, movies });
    }

    return res.status(404).json({ error: `Route ${cleanPath} not found` });
  } catch (err: any) {
    console.error('BACKEND ERROR:', err.message);
    return res.status(400).json({ error: err.message || 'Server error' });
  }
}
