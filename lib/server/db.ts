import { connection } from './connection';
import { collections, type Collection } from '../models';
export function db() { return connection(); }
export async function rows(user: string, table: Collection) { if (!collections.includes(table))
    throw new Error('Invalid collection'); const r = await db().prepare(`SELECT id,data FROM ${table} WHERE user_id=? ORDER BY created_at`).bind(user).all(); return r.results.map((r: any) => ({ ...JSON.parse(r.data), id: r.id })); }
export function insert(user: string, table: Collection, data: unknown, id = crypto.randomUUID()) { return db().prepare(`INSERT INTO ${table}(id,user_id,data,created_at) VALUES(?,?,?,?)`).bind(id, user, JSON.stringify(data), Date.now()); }
export function failure(e: unknown) { console.error('API failure', e instanceof Error ? e.message : 'unknown'); return Response.json({ error: 'server_error' }, { status: 500 }); }
export function sameOrigin(req: Request) { const origin = req.headers.get('origin'); return !origin || origin === new URL(req.url).origin; }
