import { NextResponse } from 'next/server';

// Per-IP rate limiter (resets on cold start)
const ipHits = new Map();

function globalRateLimit(ip) {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || now - record.start > 60000) {
    ipHits.set(ip, { count: 1, start: now });
    return true;
  }
  record.count++;
  // Cleanup stale entries inline instead of setInterval
  if (ipHits.size > 1000) {
    for (const [k, r] of ipHits) {
      if (now - r.start > 300000) ipHits.delete(k);
    }
  }
  return record.count <= 60;
}

export function middleware(request) {
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!globalRateLimit(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const allowed = !origin || origin.includes(host) ||
    origin.includes('.vercel.app') ||
    origin.includes('localhost');
  const corsOrigin = allowed ? (origin || '') : '';

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  if (corsOrigin) {
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
