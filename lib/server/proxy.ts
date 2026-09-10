// Public API address only. Database credentials stay inside Supabase Edge Functions.
const apiUrl = process.env.STUDENTOS_API_URL || 'https://zjjfbjldjezxlvhtbjqu.supabase.co/functions/v1/studentos-api';

export async function proxyApi(request: Request, route: string) {
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  try {
    const target = new URL(`${apiUrl}/${route}`);
    const headers = new Headers({ 'content-type': 'application/json', origin: target.origin });
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const body = request.method === 'GET' ? undefined : await request.text();
    if (body && body.length > 100_000) return Response.json({ error: 'too_large' }, { status: 413 });
    const upstream = await fetch(target, {
      method: request.method, headers, body, cache: 'no-store',
      signal: AbortSignal.timeout(25_000), redirect: 'error',
    });
    const responseHeaders = new Headers({
      'content-type': 'application/json', 'cache-control': 'no-store',
    });
    const session = upstream.headers.get('set-cookie');
    if (session) responseHeaders.set('set-cookie', session);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: 'server_error' }, { status: 503 });
  }
}
