import * as auth from '../../../lib/server/handlers/auth';
import * as data from '../../../lib/server/handlers/data';
import * as focus from '../../../lib/server/handlers/focus';
import * as assistant from '../../../lib/server/handlers/assistant';

// Registration/login are public. Every data operation authenticates our HttpOnly
// session cookie and scopes its SQL to the session's user. No Supabase service key
// or database credential is ever returned to the browser or the Vercel frontend.
const routes = { auth, data, focus, assistant };
Deno.serve(async (request: Request) => {
  // The edge gateway uses an internal request host. Compare CSRF Origin with
  // the trusted public Supabase host, never with a caller-supplied proxy header.
  request = new Request(new URL(new URL(request.url).pathname, Deno.env.get('SUPABASE_URL')), request);
  const route = new URL(request.url).pathname.split('/').pop() as keyof typeof routes;
  const handlers = routes[route] as Record<string, (request: Request) => Promise<Response>> | undefined;
  const handler = handlers?.[request.method];
  if (!handler) return Response.json({ error: 'not_found' }, { status: 404 });
  if (Number(request.headers.get('content-length') || 0) > 100_000) {
    return Response.json({ error: 'too_large' }, { status: 413 });
  }
  const response = await handler(request);
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-content-type-options', 'nosniff');
  return response;
});
