import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);

const COOKIE_NAME = 'mr3_token';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Rate limiting: track login attempts per IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rate limit login endpoint
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
        { status: 429 }
      );
    }
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next();
  }

  // Verify JWT token
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Admin routes: require MASTER role
    if (pathname.startsWith('/api/admin/')) {
      if (payload.role !== 'MASTER') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Vault routes: require MASTER or vault permission (checked in route handler)
    // Middleware lets it through; route handler does fine-grained check

    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
