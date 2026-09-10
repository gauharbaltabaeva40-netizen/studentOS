import { proxyApi } from '@/lib/server/proxy';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return proxyApi(request, 'auth'); }
export function POST(request: Request) { return proxyApi(request, 'auth'); }
