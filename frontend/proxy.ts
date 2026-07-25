import { auth } from '@/auth';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/seller/dashboard': ['seller'],
  '/seller/auctions': ['seller'],
  '/seller/messages': ['seller'],
  '/seller/payment': ['seller'],
  '/seller/sales': ['seller'],
  '/seller/settings': ['seller'],
  '/seller/bidding-room': ['seller'],
  '/buyer': ['buyer'],
};

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  seller: '/seller/dashboard',
  buyer: '/buyer/dashboard',
};

const intlMiddleware = createIntlMiddleware(routing);

function getPathWithoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (
      pathname.startsWith(`/${locale}/`) ||
      pathname === `/${locale}`
    ) {
      return pathname.replace(`/${locale}`, '') || '/';
    }
  }
  return pathname;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  const session = request.auth;
  const userRole = session?.user?.role ?? null;

  // Route protection
  for (const [routePrefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathWithoutLocale.startsWith(routePrefix)) {
      if (!userRole) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathWithoutLocale);
        return Response.redirect(loginUrl);
      }

      if (!allowedRoles.includes(userRole)) {
        const redirectTo = ROLE_DASHBOARDS[userRole] ?? '/auth/login';
        return Response.redirect(new URL(redirectTo, request.url));
      }
    }
  }

  // Redirect authenticated users away from login
  if (pathWithoutLocale === '/auth/login' && userRole) {
    const redirectTo = ROLE_DASHBOARDS[userRole] ?? '/';
    return Response.redirect(new URL(redirectTo, request.url));
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
