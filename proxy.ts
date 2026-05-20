import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

// ── In-memory rate limiter ─────────────────────────────────────────────────
const store = new Map<string, { count: number; resetAt: number }>();

function checkRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (Date.now() > v.resetAt) { store.delete(k); break; }
    }
  }
  return true;
}

const PUBLIC_EXACT = ['/', '/pricing'];
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/embed.js', '/widget', '/suspended'];
const API_PUBLIC   = ['/api/auth', '/api/bot-config', '/api/chat', '/api/feedback', '/api/register', '/api/embed', '/api/stripe/webhook'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/auth') || pathname === '/api/register') {
    if (!checkRate(`auth:${ip}`, 10, 60_000)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  if (pathname.startsWith('/api/chat')) {
    if (!checkRate(`chat:${ip}`, 60, 60_000)) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  if (pathname === '/api/auth/forgot-password') {
    if (!checkRate(`reset:${ip}`, 5, 15 * 60_000)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── Public route pass-through ──────────────────────────────────────────────
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    API_PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  // ── Decode session from JWT cookie ─────────────────────────────────────────
  const secret = process.env.AUTH_SECRET;
  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  const token = secret
    ? await decode({
        token: request.cookies.get(cookieName)?.value,
        secret,
        salt: cookieName,
      }).catch(() => null)
    : null;

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Suspension check ───────────────────────────────────────────────────────
  if ((token as any)?.suspended && pathname !== '/suspended') {
    return NextResponse.redirect(new URL('/suspended', request.nextUrl.origin));
  }

  // ── Admin gate ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
    if (!adminEmails.includes((token.email as string) ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
