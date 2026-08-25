import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { routing } from './i18n/routing';

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATTERNS = [
  '/admin(.*)',
  '/seller/dashboard(.*)',
  '/seller/auctions(.*)',
  '/seller/messages(.*)',
  '/seller/payment(.*)',
  '/seller/sales(.*)',
  '/seller/settings(.*)',
  '/seller/bidding-room(.*)',
  '/buyer(.*)',
  '/checkout(.*)',
  '/cart(.*)',
  '/wishlist(.*)',
  '/room(.*)',
  '/invite(.*)',
];

function toRegExp(pattern: string): RegExp {
  const escapePart = (p: string) => p.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
  const escaped = pattern.split('(.*)').map(escapePart).join('(.*)');
  return new RegExp('^' + escaped + '$');
}

function isProtectedRoute(pathname: string): boolean {
  let stripped = pathname;
  for (const locale of routing.locales) {
    if (stripped === '/' + locale) {
      stripped = '/';
      break;
    }
    if (stripped.startsWith('/' + locale + '/')) {
      stripped = stripped.slice(locale.length + 1);
      break;
    }
  }
  return PROTECTED_PATTERNS.some((p) => toRegExp(p).test(stripped));
}

function getPathWithoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith('/' + locale + '/') || pathname === '/' + locale) {
      return pathname.replace('/' + locale, '') || '/';
    }
  }
  return pathname;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  seller: '/seller/dashboard',
  buyer: '/buyer/dashboard',
};

export default auth(async (req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Always pass through API routes untouched
  if (path.startsWith('/api/') || path === '/api') {
    return NextResponse.next();
  }

  const pathWithoutLocale = getPathWithoutLocale(path);
  const session = req.auth;

  // NextAuth v5 middleware does not surface custom JWT claims on req.auth.user,
  // so decode the session JWT directly (JWE with salt = cookie name) for the role.
  let role: string | undefined;
  if (session?.user) {
    const cookieName = req.cookies.get('__Secure-authjs.session-token')
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';
    const cookie = req.cookies.get(cookieName)?.value;
    if (cookie) {
      try {
        const decoded = (await decode({
          token: cookie,
          secret: process.env.AUTH_SECRET || '',
          salt: cookieName,
        })) as any;
        role = decoded?.role;
      } catch {
        role = (session?.user as any)?.role as string | undefined;
      }
    }
    if (!role) role = (session?.user as any)?.role as string | undefined;
  }

  // Protect dashboard routes
  if (isProtectedRoute(path)) {
    if (!session?.user) {
      const loginUrl = new URL('/auth/login', req.url);
      if (pathWithoutLocale && pathWithoutLocale !== '/') {
        loginUrl.searchParams.set('redirect', pathWithoutLocale);
      }
      return NextResponse.redirect(loginUrl);
    }
    if (pathWithoutLocale.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    if (pathWithoutLocale.startsWith('/seller') && role !== 'seller') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    if (pathWithoutLocale.startsWith('/buyer') && role !== 'buyer') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathWithoutLocale.startsWith('/auth')) {
    if (session?.user) {
      const redirectTo = ROLE_DASHBOARDS[role || 'buyer'] ?? '/';
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
