import { z } from 'zod';
import { db, insert, rows, sameOrigin, failure } from '@/lib/server/db';
import { identity, newSession, passwordHash, normalizeContact, token, digest } from '@/lib/server/auth';
import { schemas } from '@/lib/models';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { try {
    const user = await identity(req);
    return Response.json({ user, profile: user ? (await rows(user, 'profiles'))[0] : null }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
export async function POST(req: Request) {
    try {
        if (!sameOrigin(req))
            return Response.json({ error: 'forbidden' }, { status: 403 });
        const body = await req.json();
        if (body.action === 'logout') {
            const t = token(req);
            if (t)
                await db().prepare('DELETE FROM sessions WHERE id=?').bind(await digest(t)).run();
            return Response.json({ ok: true }, { headers: { 'Set-Cookie': 'studentos_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' } });
        }
        if (body.action === 'password') {
            const user = await identity(req);
            if (!user)
                return Response.json({ error: 'unauthorized' }, { status: 401 });
            const p = z.string().min(8).max(128).parse(body.password);
            const old = await db().prepare('SELECT password FROM users WHERE id=?').bind(user).first();
            if (!old || await passwordHash(String(body.currentPassword), old.password.split(':')[0]) !== old.password)
                return Response.json({ error: 'invalid_login' }, { status: 400 });
            await db().batch([db().prepare('UPDATE users SET password=? WHERE id=?').bind(await passwordHash(p), user), db().prepare('DELETE FROM sessions WHERE user_id=?').bind(user)]);
            return Response.json({ ok: true }, { headers: { 'Set-Cookie': await newSession(user) } });
        }
        const contact = normalizeContact(z.string().min(5).max(160).parse(body.contact));
        if (!z.string().email().safeParse(contact).success && !/^\d{10,15}$/.test(contact))
            return Response.json({ error: 'invalid_contact' }, { status: 400 });
        const pw = z.string().min(8).max(128).parse(body.password);
        const attemptId = await digest(contact + ':' + (req.headers.get('cf-connecting-ip') || 'local'));
        const attempt = await db().prepare('SELECT count,until FROM login_attempts WHERE id=?').bind(attemptId).first();
        if (attempt && attempt.until > Date.now() && attempt.count >= 8)
            return Response.json({ error: 'too_many_attempts' }, { status: 429 });
        await db().prepare('INSERT INTO login_attempts(id,count,until) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN login_attempts.until<? THEN 1 ELSE login_attempts.count+1 END, until=CASE WHEN login_attempts.until<? THEN excluded.until ELSE login_attempts.until END').bind(attemptId, Date.now() + 900000, Date.now(), Date.now()).run();
        let user: string;
        if (body.action === 'register') {
            const profile = schemas.profiles.parse({ ...body.profile, onboarded: false, demoSeeded: false });
            if (await db().prepare('SELECT id FROM users WHERE contact=?').bind(contact).first())
                return Response.json({ error: 'contact_exists' }, { status: 409 });
            user = crypto.randomUUID();
            await db().batch([db().prepare('INSERT INTO users(id,contact,password,created_at) VALUES(?,?,?,?)').bind(user, contact, await passwordHash(pw), Date.now()), insert(user, 'profiles', profile)]);
        }
        else if (body.action === 'login') {
            const found = await db().prepare('SELECT id,password FROM users WHERE contact=?').bind(contact).first();
            const hash = await passwordHash(pw, found?.password.split(':')[0] || 'timing-padding');
            if (!found || hash !== found.password)
                return Response.json({ error: 'invalid_login' }, { status: 401 });
            user = found.id;
        }
        else
            return Response.json({ error: 'invalid_action' }, { status: 400 });
        await db().prepare('DELETE FROM login_attempts WHERE id=?').bind(attemptId).run();
        return Response.json({ user, profile: (await rows(user, 'profiles'))[0] }, { headers: { 'Set-Cookie': await newSession(user) } });
    }
    catch (e) {
        if (e instanceof z.ZodError)
            return Response.json({ error: 'validation' }, { status: 400 });
        return failure(e);
    }
}
