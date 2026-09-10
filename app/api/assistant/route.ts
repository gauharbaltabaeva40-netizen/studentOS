import { proxyApi } from '@/lib/server/proxy';
export const dynamic = 'force-dynamic';
export function POST(request: Request) { return proxyApi(request, 'assistant'); }
