// app/api/proxy/route.ts  ← THIS IS THE NEW 2025 WAY

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let ratelimit: any = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 h'),
      analytics: true,
    });
  } catch (e) {
    console.warn('Upstash failed – rate limiting off');
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;

async function handle(request: NextRequest) {
  // Rate limit only API routes
  if (request.nextUrl.pathname.startsWith('/api/') && ratelimit) {
    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 request.headers.get('x-real-ip') ||
                 '127.0.0.1';

      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return new Response('Too Many Requests', { status: 429 });
      }
    } catch (e) {
      console.warn('Rate limit error', e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};