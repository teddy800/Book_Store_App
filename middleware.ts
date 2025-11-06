import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

let ratelimit: any = null;

try {
  // Safely initialize ratelimit only if env vars are present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 h'), // Adjust limits as needed
      analytics: true,
    });
  } else {
    console.warn('Upstash env vars missing; rate limiting disabled for safety');
  }
} catch (error) {
  console.warn('Ratelimit initialization failed:', error);
  ratelimit = null;
}

export async function middleware(request: NextRequest) {
  // Rate limit only API routes, and only if ratelimit is available
  if (request.nextUrl.pathname.startsWith('/api/') && ratelimit) {
    try {
      const ip = request.headers.get('x-forwarded-for') ?? request.ip ?? 'anonymous';
      const { success } = await ratelimit.limit(ip);

      if (!success) {
        return new Response('Too Many Requests', { status: 429 });
      }
    } catch (error) {
      console.warn('Ratelimit check failed:', error);
      // Continue without blocking on error – graceful fallback
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};