import { db, rows, insert, sameOrigin, failure } from '@/lib/server/db';
import { identity } from '@/lib/server/auth';
export async function POST(req: Request) {
    try {
        if (!sameOrigin(req))
            return Response.json({ error: 'forbidden' }, { status: 403 });
        const user = await identity(req);
        if (!user)
            return Response.json({ error: 'unauthorized' }, { status: 401 });
        const b = await req.json();
        if (b.action === 'start') {
            const id = crypto.randomUUID();
            await insert(user, 'focus_sessions', { startedAt: Date.now(), duration: 1500, completed: false, endedAt: null }, id).run();
            return Response.json({ id });
        }
        const item = (await rows(user, 'focus_sessions')).find((x: any) => x.id === b.id);
        if (!item)
            return Response.json({ error: 'not_found' }, { status: 404 });
        if (b.action === 'cancel') {
            await db().prepare('DELETE FROM focus_sessions WHERE id=? AND user_id=? AND json_extract(data,\'$.completed\')=0').bind(item.id, user).run();
            return Response.json({ ok: true });
        }
        if (b.action === 'complete') {
            if (Date.now() - item.startedAt < 1500000)
                return Response.json({ error: 'too_early' }, { status: 400 });
            await db().prepare('UPDATE focus_sessions SET data=? WHERE id=? AND user_id=?').bind(JSON.stringify({ ...item, completed: true, endedAt: item.endedAt || Date.now() }), item.id, user).run();
            return Response.json({ ok: true });
        }
        return Response.json({ error: 'validation' }, { status: 400 });
    }
    catch (e) {
        return failure(e);
    }
}
