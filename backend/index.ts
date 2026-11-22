import { ai, router, json, error, db, requireAuth, requireAdminEmailAllowlist } from '@appdeploy/sdk';
import { MASTER_PROFILE_SEED, MASTER_PROFILE_RULES, type MasterProfileRecord } from './master-profile';

const ADMIN_EMAILS = ['ffarhantalukdar@gmail.com'];
type StoredProfile = MasterProfileRecord & { id: string }; type ChatMessage = { role: 'user' | 'assistant'; text: string }; type DeviceInfo = { label?: string; type?: 'phone' | 'tablet' | 'desktop' | 'unknown'; model?: string; os?: string; browser?: string; platform?: string; mobile?: boolean }; type ChatLog = { id: string; sessionId: string; messages: ChatMessage[]; createdAt: string; updatedAt: string; messageCount: number; device?: DeviceInfo };
type MovieItem = { id: string; title: string; youtubeId: string; youtubeUrl: string; createdAt: string };
type ChatVisit = { id: string; sessionId: string; firstVisitedAt: string; lastVisitedAt: string; visitCount: number; device?: DeviceInfo };
function sanitizeDevice(input: unknown): DeviceInfo | undefined { if (!input || typeof input !== 'object') return undefined; const d = input as Record<string, unknown>; const type = d.type === 'phone' || d.type === 'tablet' || d.type === 'desktop' || d.type === 'unknown' ? d.type : 'unknown'; const clean = (v: unknown, max: number) => String(v ?? '').trim().replace(/[\u0000-\u001f]/g, '').slice(0, max); const label = clean(d.label, 100); if (!label) return undefined; return { label, type, model: clean(d.model, 100) || 'Not available', os: clean(d.os, 80) || 'Unknown', browser: clean(d.browser, 80) || 'Unknown', platform: clean(d.platform, 100) || 'Not available', mobile: Boolean(d.mobile) }; }
function youtubeVideoId(value: string) {
    const raw = value.trim();
    const valid = (id: string | null | undefined) => id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
        const url = new URL(raw);
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host === 'youtu.be') return valid(url.pathname.split('/').filter(Boolean)[0]);
        if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return null;
        const parts = url.pathname.split('/').filter(Boolean);
        const id = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : null);
        return valid(id);
    } catch {
        return null;
    }
}
async function saveChatLog(sessionId: string, messages: ChatMessage[], device?: DeviceInfo) { if (!sessionId) return; const safeMessages = messages.slice(-12).map(message => ({ role: message.role, text: String(message.text).slice(0, 4000) })); const now = new Date().toISOString(); const current = await db.list<ChatLog>('ai_chat_logs', { limit: 100 }); const existing = current.items.find(item => item.sessionId === sessionId); const deviceRecord = device || existing?.device; if (existing) { await db.update('ai_chat_logs', [{ id: existing.id, record: { ...existing, messages: safeMessages, updatedAt: now, messageCount: safeMessages.length, device: deviceRecord } }]); } else { await db.add('ai_chat_logs', [{ sessionId, messages: safeMessages, createdAt: now, updatedAt: now, messageCount: safeMessages.length, device: deviceRecord }]); } }
async function saveChatVisit(sessionId: string, device?: DeviceInfo) {
    const current = await db.list<ChatVisit>('ai_chat_visits', { limit: 100 });
    const existing = current.items.find(item => item.sessionId === sessionId);
    const now = new Date().toISOString();
    if (existing) {
        const [updated] = await db.update('ai_chat_visits', [{
            id: existing.id,
            record: {
                ...existing,
                lastVisitedAt: now,
                visitCount: (existing.visitCount || 0) + 1,
                device: device || existing.device
            }
        }]);
        if (!updated) throw new Error('Could not update chat visit');
        return;
    }
    const [id] = await db.add('ai_chat_visits', [{
        sessionId,
        firstVisitedAt: now,
        lastVisitedAt: now,
        visitCount: 1,
        device
    }]);
    if (!id) throw new Error('Could not save chat visit');
}
async function ensureMasterProfile() { const current = await db.list<MasterProfileRecord>('ai_master_profile', { limit: 50 }); const existingKeys = new Set(current.items.map(item => item.key)); const missing = MASTER_PROFILE_SEED.filter(item => !existingKeys.has(item.key)); if (missing.length) await db.add('ai_master_profile', missing); const migration = await db.list<{ key: string }>('ai_master_profile_meta', { limit: 10 }); const migrationKey = 'efty-lock-v2'; const seedByKey = new Map(MASTER_PROFILE_SEED.map(record => [record.key, record])); if (!migration.items.some(item => item.key === migrationKey)) { const updates = current.items.filter(item => item.key === 'primary-friends' || item.key === 'efty-guidance').map(item => ({ id: item.id, record: seedByKey.get(item.key)! })); if (updates.length) { await db.update('ai_master_profile', updates); for (const update of updates) { const local = current.items.find(item => item.id === update.id); if (local) Object.assign(local, update.record); } } await db.add('ai_master_profile_meta', [{ key: migrationKey }]); } const merged = current.items as StoredProfile[]; return [...merged, ...missing.map((record, index) => ({ ...record, id: `seed-${index}` }))].sort((a, b) => a.order - b.order); }
async function buildMasterProfile() { const records = await ensureMasterProfile(); return records.map(record => `${record.section}: ${record.value}`).join('\n'); }
function spotifyTrackId(value: string) { const v = value.trim(); const direct = v.match(/(?:open\.)?spotify\.com\/track\/([A-Za-z0-9]{22})(?:[/?#]|$)/i); if (direct) return direct[1]; const uri = v.match(/^spotify:track:([A-Za-z0-9]{22})$/i); if (uri) return uri[1]; if (/^[A-Za-z0-9]{22}$/.test(v)) return v; return null; }
export const handler = router({
    'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
    'POST /api/chat': [async ({ body }) => { try { const input = body as { messages?: ChatMessage[]; sessionId?: string; device?: DeviceInfo }; const messages = Array.isArray(input?.messages) ? input.messages.slice(-12) : []; const sessionId = String(input?.sessionId || '').trim().slice(0, 120); const device = sanitizeDevice(input?.device); if (!messages.length) return error('No messages provided', 400); const latestUserMessage = [...messages].reverse().find(message => message.role === 'user')?.text ?? ''; if (/\b(?:efty|samia\s+ahad\s+efty|sami\s+ahad\s+efty)\b/i.test(latestUserMessage)) { const lockedText = 'That information is private, so I can\'t share details about Efty.'; await saveChatLog(sessionId, [...messages, { role: 'assistant', text: lockedText }], device); return json({ text: lockedText }); } const masterProfile = await buildMasterProfile(); const result = await ai.generate({ system: `${MASTER_PROFILE_RULES}\n\nMaster Profile:\n${masterProfile}`, messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })), maxTokens: 400, temperature: 0.4, thinkingMode: 'FAST' }); const assistantText = result.text || 'Sorry, I could not answer that right now.'; await saveChatLog(sessionId, [...messages, { role: 'assistant', text: assistantText }], device); return json({ text: assistantText }); } catch (err) { console.error('AI chat failed', err); return error('AI chat unavailable', 500); } }],
    'POST /api/notes': [async ({ body }) => { const input = body as { name?: string; note?: string }; const name = input?.name?.trim(); const note = input?.note?.trim(); if (!name || !note) return error('Name and note are required', 400); if (name.length > 80 || note.length > 2000) return error('Input is too long', 400); const [id] = await db.add('visitor_notes', [{ name, note, createdAt: new Date().toISOString() }]); if (!id) return error('Could not save note', 500); return json({ ok: true }); }],
    'GET /api/admin/notes': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => { const r = await db.list<{ name: string; note: string; createdAt: string }>('visitor_notes', { limit: 100 }); return json({ items: [...r.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }); }],
    'GET /api/admin/chat-logs': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => { const r = await db.list<ChatLog>('ai_chat_logs', { limit: 100 }); return json({ items: [...r.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(item => ({ ...item, active: Date.now() - new Date(item.updatedAt).getTime() < 90000 })) }); }],
    'DELETE /api/admin/chat-logs': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ query }) => { const id = query.id; if (!id) return error('Conversation id is required', 400); const [ok] = await db.delete('ai_chat_logs', [id]); if (!ok) return error('Conversation not found', 404); return json({ ok: true }); }],
    'DELETE /api/admin/notes': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ query }) => { const id = query.id; if (!id) return error('Note id is required', 400); const [ok] = await db.delete('visitor_notes', [id]); if (!ok) return error('Could not delete note', 404); return json({ ok: true }); }],
    'POST /api/admin/music': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body }) => { const input = body as { spotifyUrl?: string }; const raw = input?.spotifyUrl?.trim(); if (!raw) return error('Spotify link or track ID is required', 400); const trackId = spotifyTrackId(raw); if (!trackId) return error('Enter a valid Spotify track Share Link or 22-character Track ID', 400); const spotifyUrl = `https://open.spotify.com/track/${trackId}`; const existing = await db.list<{ spotifyId: string }>('music', { limit: 100 }); if (existing.items.some(item => item.spotifyId === trackId)) return error('That Spotify track is already in the playlist', 409); let title = 'Spotify track'; try { const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`); if (response.ok) { const meta = await response.json() as { title?: string }; if (meta.title?.trim()) title = meta.title.trim(); } } catch (err) { console.warn('Spotify metadata lookup failed', err); } const [id] = await db.add('music', [{ title, spotifyId: trackId, spotifyUrl, createdAt: new Date().toISOString() }]); if (!id) return error('Could not save Spotify track', 500); return json({ ok: true, id, title, spotifyUrl }); }],
    'GET /api/music': [async () => { const r = await db.list<{ title: string; spotifyId: string; spotifyUrl: string; createdAt: string }>('music', { limit: 100 }); return json({ items: [...r.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }); }],
    'DELETE /api/admin/music': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ query }) => { const id = query.id; if (!id) return error('Music id is required', 400); const [ok] = await db.delete('music', [id]); if (!ok) return error('Music not found', 404); return json({ ok: true }); }],
    'POST /api/chat-visits': [async ({ body }) => {
        try {
            const input = body as { sessionId?: string; device?: DeviceInfo };
            const sessionId = String(input?.sessionId || '').trim().slice(0, 120);
            if (!sessionId) return error('Session id is required', 400);
            await saveChatVisit(sessionId, sanitizeDevice(input.device));
            return json({ ok: true });
        } catch (err) {
            console.error('Chat visit logging failed', err);
            return error('Could not record chat visit', 500);
        }
    }],
    'GET /api/admin/chat-visits': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => {
        const r = await db.list<ChatVisit>('ai_chat_visits', { limit: 100 });
        return json({
            items: [...r.items]
                .sort((a, b) => b.lastVisitedAt.localeCompare(a.lastVisitedAt))
                .map(item => ({
                    ...item,
                    active: Date.now() - new Date(item.lastVisitedAt).getTime() < 90000
                }))
        });
    }],
    'GET /api/movies': [async () => {
        const r = await db.list<MovieItem>('movies', { limit: 100 });
        return json({ items: [...r.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
    }],
    'POST /api/admin/movies': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body }) => {
        const input = body as { youtubeUrl?: string; title?: string };
        const raw = input?.youtubeUrl?.trim();
        if (!raw) return error('YouTube video link is required', 400);
        const youtubeId = youtubeVideoId(raw);
        if (!youtubeId) return error('Enter a valid YouTube video link or video ID', 400);
        const suppliedTitle = String(input?.title || '').trim().replace(/[\u0000-\u001f]/g, '');
        if (suppliedTitle.length > 120) return error('Title must be 120 characters or fewer', 400);
        const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        const existing = await db.list<{ youtubeId: string }>('movies', { limit: 100 });
        if (existing.items.some(item => item.youtubeId === youtubeId)) return error('That YouTube video is already in Movies', 409);
        let title = suppliedTitle || 'YouTube video';
        if (!suppliedTitle) {
            try {
                const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
                if (response.ok) {
                    const metadata = await response.json() as { title?: string };
                    if (metadata.title?.trim()) title = metadata.title.trim().slice(0, 120);
                }
            } catch (err) {
                console.warn('YouTube title lookup failed', err);
            }
        }
        const [id] = await db.add('movies', [{ title, youtubeId, youtubeUrl, createdAt: new Date().toISOString() }]);
        if (!id) return error('Could not save YouTube video', 500);
        return json({ ok: true, id, title, youtubeId, youtubeUrl });
    }],
    'DELETE /api/admin/movies': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ query }) => {
        const id = query.id;
        if (!id) return error('Movie id is required', 400);
        const [ok] = await db.delete('movies', [id]);
        if (!ok) return error('Movie not found', 404);
        return json({ ok: true });
    }]
});