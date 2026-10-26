import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Same-origin API proxy (BFF).
 *
 * The backend JWT used to live in the browser: Auth.js copied it into the
 * session object, which is client-readable, so a single XSS could steal a full
 * API bearer token. Browser code now calls /api/proxy/<path>, this handler
 * reads the token from the HTTP-only session cookie server-side and forwards
 * the request. Nothing in client JavaScript ever sees the token.
 */
const BACKEND = process.env.API_URL || 'http://localhost:3001/api';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function forward(req: NextRequest, method: Method) {
  const jwt = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === 'https:',
  });
  // The proxy authenticates but does not authorise: public endpoints must stay
  // callable anonymously, guarded ones answer 401 themselves.
  const token = (jwt as { accessToken?: string } | null)?.accessToken;

  // The path segments arrive after /api/proxy/.
  const segments = req.nextUrl.pathname.replace(/^\/api\/proxy\/?/, '');
  const target = `${BACKEND}/${segments}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  } else {
    // No session yet (registration, onboarding, pre-login calls): pass the
    // caller's own bearer through. Without this the proxy silently stripped the
    // credential a just-registered user was given, so onboarding 401'd.
    const incoming = req.headers.get('authorization');
    if (incoming) headers.set('authorization', incoming);
  }

  const hasBody = method !== 'GET';
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: 'no-store', redirect: 'manual' });
  } catch {
    return Response.json({ message: 'API unreachable' }, { status: 502 });
  }

  const resHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) resHeaders.set('content-type', upstreamType);
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) resHeaders.set('content-disposition', disposition);

  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}

export async function GET(req: NextRequest) {
  return forward(req, 'GET');
}
export async function POST(req: NextRequest) {
  return forward(req, 'POST');
}
export async function PUT(req: NextRequest) {
  return forward(req, 'PUT');
}
export async function PATCH(req: NextRequest) {
  return forward(req, 'PATCH');
}
export async function DELETE(req: NextRequest) {
  return forward(req, 'DELETE');
}
