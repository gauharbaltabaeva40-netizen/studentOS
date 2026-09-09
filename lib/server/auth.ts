import { db } from './db';
export async function digest(s: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(v => v.toString(16).padStart(2, '0')).join(''); }
export async function passwordHash(password: string, salt = crypto.randomUUID()) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256); return salt + ':' + Array.from(new Uint8Array(b)).map(v => v.toString(16).padStart(2, '0')).join(''); }
export function token(req: Request) { return req.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('studentos_session='))?.split('=')[1]; }
export async function identity(req: Request) { const t = token(req); if (!t)
    return null; const row = await db().prepare('SELECT user_id FROM sessions WHERE id=? AND expires>?').bind(await digest(t), Date.now()).first(); return row?.user_id as string | null; }
export async function newSession(user: string) { const value = crypto.randomUUID() + crypto.randomUUID(); await db().prepare('INSERT INTO sessions(id,user_id,expires) VALUES(?,?,?)').bind(await digest(value), user, Date.now() + 604800000).run(); return `studentos_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`; }
export function normalizeContact(c: string) { return c.includes('@') ? c.trim().toLowerCase() : c.replace(/[\s()+-]/g, ''); }
