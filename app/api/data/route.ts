import { z } from 'zod';
import { collections, schemas, type Collection } from '@/lib/models';
import { db, rows, insert, sameOrigin, failure } from '@/lib/server/db';
import { identity } from '@/lib/server/auth';
import { demoRecords } from '@/lib/server/demo';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { try {
    const user = await identity(req);
    if (!user)
        return Response.json({ error: 'unauthorized' }, { status: 401 });
    const data = Object.fromEntries(await Promise.all(collections.map(async (t) => [t, await rows(user, t)])));
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
export async function POST(req: Request) {
    try {
        if (!sameOrigin(req))
            return Response.json({ error: 'forbidden' }, { status: 403 });
        const user = await identity(req);
        if (!user)
            return Response.json({ error: 'unauthorized' }, { status: 401 });
        const body = await req.json();
        if (body.action === 'onboard') {
            const current = (await rows(user, 'profiles'))[0];
            if (current.onboarded)
                return Response.json({ ok: true });
            const profile = schemas.profiles.parse({ ...body.profile, onboarded: true, demoSeeded: current.demoSeeded || !!body.demo });
            const income = z.record(z.enum(['stipend', 'parents', 'salary', 'business', 'other']), z.coerce.number().min(0).max(1e10)).parse(body.income);
            const operations = Object.entries(income).filter(([, amount]) => amount > 0).map(([category, amount]) => insert(user, 'transactions', schemas.transactions.parse({ title: category, amount, category, date: body.date, type: 'income', description: '' })));
            if (body.demo && !current.demoSeeded)
                operations.push(...demoRecords().map(([table, d]) => insert(user, table, schemas[table].parse(d))));
            await db().batch([insert(user, 'notifications', { title: 'Onboarding completed', read: true }, 'onboard-' + user), ...operations, db().prepare('UPDATE profiles SET data=? WHERE user_id=?').bind(JSON.stringify(profile), user)]);
            return Response.json({ ok: true });
        }
        if (body.action === 'seed') {
            const profile = (await rows(user, 'profiles'))[0];
            if (profile.demoSeeded)
                return Response.json({ ok: true });
            // A unique seed receipt makes concurrent duplicate seed requests fail atomically.
            await db().batch([insert(user, 'notifications', { title: 'Demo data added', read: true }, 'seed-' + user), ...demoRecords().map(([t, d]) => insert(user, t, schemas[t].parse(d))), db().prepare('UPDATE profiles SET data=? WHERE user_id=?').bind(JSON.stringify({ ...profile, demoSeeded: true }), user)]);
            return Response.json({ ok: true });
        }
        const table = z.enum(collections).parse(body.table) as Collection;
        if (['focus_sessions', 'ai_messages'].includes(table))
            return Response.json({ error: 'forbidden' }, { status: 403 });
        const id = body.id ? z.string().min(1).max(100).parse(body.id) : null;
        if (body.action === 'delete') {
            if (table === 'profiles' || !id)
                return Response.json({ error: 'forbidden' }, { status: 403 });
            await db().prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`).bind(id, user).run();
            return Response.json({ ok: true });
        }
        let data: any = schemas[table].parse(body.data);
        if (table === 'profiles') {
            const old = (await rows(user, 'profiles'))[0];
            if (id !== old.id)
                return Response.json({ error: 'forbidden' }, { status: 403 });
            data = { ...data, demoSeeded: old.demoSeeded };
        }
        if (table === 'tasks') {
            const old = id ? (await rows(user, table)).find((x: any) => x.id === id) : null;
            data.completedAt = data.status === 'done' ? (old?.completedAt || new Date().toISOString()) : null;
        }
        if (id) {
            const result = await db().prepare(`UPDATE ${table} SET data=? WHERE id=? AND user_id=?`).bind(JSON.stringify(data), id, user).run();
            if (!result.meta.changes)
                return Response.json({ error: 'not_found' }, { status: 404 });
        }
        else {
            if (table === 'profiles')
                return Response.json({ error: 'forbidden' }, { status: 403 });
            await insert(user, table, data).run();
        }
        return Response.json({ ok: true });
    }
    catch (e) {
        if (e instanceof z.ZodError)
            return Response.json({ error: 'validation' }, { status: 400 });
        return failure(e);
    }
}
