import { z } from 'zod';
import { collections, type Data } from '@/lib/models';
import { rows, insert, db, sameOrigin, failure } from '@/lib/server/db';
import { identity } from '@/lib/server/auth';
import { demoAssistant } from '@/lib/server/assistant';
export async function POST(req: Request) { try {
    if (!sameOrigin(req))
        return Response.json({ error: 'forbidden' }, { status: 403 });
    const u = await identity(req);
    if (!u)
        return Response.json({ error: 'unauthorized' }, { status: 401 });
    const b = z.object({ prompt: z.string().min(1).max(2000), language: z.enum(['kk', 'ru']) }).parse(await req.json());
    const data = Object.fromEntries(await Promise.all(collections.map(async (t) => [t, await rows(u, t)]))) as Data;
    const reply = await demoAssistant.reply(b.prompt, data, b.language);
    await db().batch([insert(u, 'ai_messages', { role: 'user', content: b.prompt }), insert(u, 'ai_messages', { role: 'assistant', content: reply })]);
    return Response.json({ reply });
}
catch (e) {
    if (e instanceof z.ZodError)
        return Response.json({ error: 'validation' }, { status: 400 });
    return failure(e);
} }
