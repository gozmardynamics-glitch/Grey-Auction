import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const isProtectedRoute = createRouteMatcher([
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
]);

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  seller: '/seller/dashboard',
  buyer: '/buyer/dashboard',
};

const intlMiddleware = createIntlMiddleware(routing);

function getPathWithoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, '') || '/';
    }
  }
  return pathname;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    const role = (sessionClaims?.publicMetadata?.role as string) || 'buyer';

    // Role-based access control
    if (pathWithoutLocale.startsWith('/admin') && role !== 'admin') {
      return Response.redirect(new URL('/auth/login', req.url));
    }
    if (pathWithoutLocale.startsWith('/seller') && role !== 'seller') {
      return Response.redirect(new URL('/auth/login', req.url));
    }
    if (pathWithoutLocale.startsWith('/buyer') && role !== 'buyer') {
      return Response.redirect(new URL('/auth/login', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathWithoutLocale.startsWith('/auth')) {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const role = (sessionClaims?.publicMetadata?.role as string) || 'buyer';
      const redirectTo = ROLE_DASHBOARDS[role] ?? '/';
      return Response.redirect(new URL(redirectTo, req.url));
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
