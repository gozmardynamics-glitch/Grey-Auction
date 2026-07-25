# Authentication Architecture

## Overview

This application uses a dual-layer authentication architecture: **Auth.js v5** handles session management, OAuth flows, and credential verification, while **Redux (RTK Query)** handles application state and authenticated API calls. A bridge component keeps them in sync.

```
                        +---------------------+
                        |     Auth.js v5      |
                        | (sessions, OAuth,   |
                        |  credentials login) |
                        +----------+----------+
                                   |
                            session data
                                   |
                        +----------v----------+
                        |      AuthSync       |
                        |  (bridge component) |
                        +----------+----------+
                                   |
                     dispatch setUser / clearUser
                                   |
                        +----------v----------+
                        |   Redux auth slice  |
                        |  (in-memory state)  |
                        +----------+----------+
                                   |
                          state.auth.token
                                   |
                        +----------v----------+
                        |  RTK Query headers  |
                        |  (Bearer token)     |
                        +---------------------+
```

---

## Why Auth.js v5 Instead of Manual Auth

The previous setup stored the user and token manually in `secureLocalStorage`, set a role cookie for middleware to read, and used mock data for login. This had several problems:

1. **No real OAuth support.** Google login was a `// TODO` stub. Auth.js handles the full OAuth redirect flow, token exchange, and callback verification out of the box.

2. **Client-side token storage is fragile.** Storing JWTs in `secureLocalStorage` means the token lives in the browser where it can be cleared unexpectedly, duplicated across tabs inconsistently, or accessed by XSS. Auth.js stores its session token in an `httpOnly` cookie that JavaScript cannot read, which is inherently more secure.

3. **Middleware couldn't reliably read auth state.** The old approach wrote a separate cookie (`gray-auctions-role`) containing the user's role so middleware could parse it. This created a split source of truth: the real session lived in `secureLocalStorage` while a shadow copy lived in a cookie. If either got out of sync (cleared storage but stale cookie, or vice versa), the middleware would make wrong routing decisions. Auth.js gives middleware direct access to the verified session via `request.auth`.

4. **Session lifecycle was entirely manual.** Every page that needed to check auth had to import helpers, parse storage, and handle edge cases. Auth.js provides `useSession()` on the client and `auth()` on the server, both reading from a single cryptographically signed JWT.

---

## Why Keep Redux + RTK Query

Auth.js manages *who you are*. Redux manages *what the app is doing*. Removing Redux would mean:

- Rewriting every component that reads `state.auth.user` or `state.auth.token`.
- Losing RTK Query's cache, automatic re-fetching, and `prepareHeaders` mechanism.
- Replacing tag-based cache invalidation (`providesTags` / `invalidatesTags`) with manual solutions.

The existing Redux store powers auctions, bidding, notifications, wallet, search, categories, and the entire RTK Query API layer. These have nothing to do with authentication. The bridge pattern lets Auth.js own the session while Redux consumers keep working without any changes.

---

## File-by-File Breakdown

### `/auth.ts` - Auth.js Configuration

This is the central Auth.js configuration. It exports four things:

| Export | What it does |
|--------|-------------|
| `handlers` | The `GET` and `POST` route handlers that power `/api/auth/*` |
| `auth` | A function that wraps middleware to provide `request.auth` |
| `signIn` | Server-side sign-in trigger (not used client-side) |
| `signOut` | Server-side sign-out trigger (not used client-side) |

**Providers:**

- **Google** - Uses `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from environment variables. Auth.js v5 auto-detects `AUTH_*` env vars for providers, so no explicit `clientId`/`clientSecret` config is needed.

- **Credentials** - For email/password login. The `authorize()` function calls the backend's `POST /auth/login` endpoint. If the backend returns a user, it maps the response to Auth.js's `User` shape including two custom fields: `role` and `backendToken`. If the backend rejects the credentials, it returns `null` and Auth.js treats it as a failed login.

**Why `authorize()` calls the backend directly:** Auth.js credentials provider runs server-side during the sign-in flow. It needs to validate the password against the backend database. This runs on the Next.js server, not in the browser, so the fetch call never exposes the password to the client.

**Session strategy: `"jwt"`:** This means sessions are stored as a signed JWT in a cookie, not in a database. Chosen because:
- No database adapter configuration needed.
- Stateless - works across multiple server instances without shared session storage.
- The JWT contains `role` and `backendToken`, making them available everywhere the session is read.

**`jwt` callback:** Runs every time a JWT is created or updated. On initial sign-in (`if (user)`), it copies `role` and `backendToken` from the user object into the JWT. For Google OAuth specifically (`if (account?.provider === 'google')`), it sends Google's tokens to the backend's `POST /auth/oauth/google` endpoint, which creates or finds the user and returns a backend-issued JWT and role. This is necessary because Google only provides identity - the backend still needs to issue its own token for API authorization.

**`session` callback:** Runs whenever a session is read. It copies `role` and `backendToken` from the JWT into the session object, making them available to client-side code via `useSession()`.

**`pages.signIn: "/auth/login"`:** Tells Auth.js to redirect to the custom login page instead of its default `/api/auth/signin` page.

---

### `/types/next-auth.d.ts` - Type Augmentation

Auth.js's default `User` type only has `id`, `name`, `email`, and `image`. The application needs `role` and `backendToken` on the user, session, and JWT. This file uses TypeScript module augmentation to extend the Auth.js types so that `session.user.role` and `session.user.backendToken` are strongly typed throughout the codebase instead of requiring `as` casts everywhere.

The `User` interface fields are optional (`role?: string`) because during the Google OAuth flow, the user object doesn't have these fields until the `jwt` callback runs. The `Session` interface fields are required (`role: string`) because by the time a session reaches client code, the JWT callback has already populated them.

---

### `/app/api/auth/[...nextauth]/route.ts` - API Route

A three-line file that re-exports Auth.js's `GET` and `POST` handlers. This creates the following API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/signin` | Default sign-in page (not used - custom page configured) |
| `GET /api/auth/signout` | Default sign-out page |
| `POST /api/auth/signin/:provider` | Initiates sign-in with a provider |
| `GET /api/auth/callback/:provider` | OAuth callback handler |
| `GET /api/auth/session` | Returns current session (used by `useSession()`) |
| `POST /api/auth/csrf` | CSRF token endpoint |

**Why at `/app/api/auth/` (outside `[locale]`):** Auth.js requires stable, predictable callback URLs for OAuth. Google's OAuth console is configured with `http://localhost:3000/api/auth/callback/google`. If this route were inside `[locale]`, the URL would become `/en/api/auth/callback/google` or `/fr/api/auth/callback/google`, breaking the OAuth flow. The existing middleware matcher (`/((?!api|_next|.*\\..*).*)`) already excludes `/api` routes from locale processing.

---

### `/proxy.ts` - Route Protection + i18n

Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`. This file protects routes based on the user's role and delegates to next-intl for locale handling.

**How it works:**

1. The export `auth(handler)` wraps the handler function with Auth.js's middleware. This reads the session cookie, verifies the JWT signature, and attaches the decoded session to `request.auth`. No manual cookie parsing is needed.

2. `getPathWithoutLocale()` strips the locale prefix (`/en`, `/fr`, `/nl`) from the pathname so route matching works regardless of the active language.

3. The `PROTECTED_ROUTES` map defines which URL prefixes require which roles. For each request, the middleware checks:
   - If the path matches a protected route and there is no session: redirect to `/auth/login?redirect=/original-path`.
   - If the path matches but the user's role is not in the allowed list: redirect to that user's own dashboard.

4. If an authenticated user tries to visit `/auth/login`, they are redirected to their dashboard. This prevents the confusing experience of seeing a login page while already logged in.

5. If no redirect is needed, the request passes through to `intlMiddleware()` for locale detection and URL rewriting.

**Why `request.auth` instead of cookies:** The old approach parsed a manually-set `gray-auctions-role` cookie. This cookie was set by client-side JavaScript in the Redux reducer, meaning it was not `httpOnly`, could be tampered with, and could fall out of sync with the actual session. `request.auth` reads from the same cryptographically signed JWT that Auth.js manages, making it tamper-proof and always consistent with the real session state.

**Matcher:** `['/((?!api|_next|.*\\..*).*)']` runs middleware on all page routes but skips API routes (`/api/*`), Next.js internals (`/_next/*`), and static files (`*.css`, `*.js`, `*.ico`, etc.). This is critical - if the matcher included `/api`, it would interfere with Auth.js's own endpoints.

---

### `/app/auth-sync.tsx` - Session to Redux Bridge

This component renders nothing (`return null`). Its only job is to react to Auth.js session changes and dispatch Redux actions.

**Why a separate component instead of putting this in providers:** Separation of concerns. The `Providers` component sets up context. `AuthSync` contains reactive logic with `useEffect`. Keeping them separate makes both easier to understand and test.

**How it works:**

- `useSession()` returns `{ data: session, status }` where status is `"loading"`, `"authenticated"`, or `"unauthenticated"`.
- When status becomes `"authenticated"`, it dispatches `setUser()` with the user data and backend token extracted from the session.
- When status becomes `"unauthenticated"`, it dispatches `clearUser()` to reset Redux state.
- The `useEffect` dependency array `[session, status, dispatch]` ensures it re-runs whenever the session changes (e.g., token refresh, sign out in another tab).

**Why this is needed:** RTK Query's `prepareHeaders` reads the token from `state.auth.token`. Without this bridge, signing in via Auth.js would create a session but RTK Query would have no token to send. The bridge keeps Redux's auth state as a synchronized mirror of the Auth.js session.

---

### `/app/providers.tsx` - Provider Hierarchy

```tsx
<SessionProvider>        // Auth.js - provides useSession() context
  <Provider store={store}>  // Redux - provides useSelector/useDispatch
    <AuthSync />            // Bridge - syncs session into Redux
    {children}
  </Provider>
</SessionProvider>
```

**Why `SessionProvider` wraps `Provider`:** `AuthSync` needs both `useSession()` (from Auth.js) and `useAppDispatch()` (from Redux). By putting `SessionProvider` on the outside, both contexts are available to `AuthSync` and all children.

**Why `AuthSync` is inside `Provider`:** It dispatches Redux actions, so it must be a descendant of the Redux `Provider`.

---

### `/app/[locale]/(auth)/slices/auth.slice.ts` - Simplified Auth Slice

The previous version of this file contained:
- `secureLocalStorage` imports for persisting auth state across page refreshes.
- `loadAuthState()` to hydrate Redux from storage on initialization.
- `setCookie()` / `deleteCookie()` helpers to write a role cookie for middleware.
- Constants `AUTH_STORAGE_KEY` and `AUTH_COOKIE_KEY`.

All of this was removed because Auth.js now handles persistence (via its session cookie) and middleware access (via `request.auth`). The slice is now a pure in-memory state container with three actions:

| Action | Purpose |
|--------|---------|
| `setUser` | Called by `AuthSync` when session becomes authenticated |
| `clearUser` | Called by `AuthSync` when session becomes unauthenticated |
| `setLoading` | Used by components to show loading states |

The initial state starts with `user: null, token: null, isAuthenticated: false`. On app load, `AuthSync` will check the Auth.js session and hydrate Redux if a session exists. This is slightly slower than reading from `secureLocalStorage` synchronously, but it is always consistent with the real session.

---

### `/redux/api.ts` - RTK Query Base Configuration

The previous version had a fallback: if `state.auth.token` was empty, it tried reading from `secureLocalStorage`. This was a workaround for cases where Redux hadn't been hydrated yet but the user was logged in.

Now the only token source is Redux state:
```ts
const token = (getState() as RootState).auth.token;
```

This works because `AuthSync` populates the token before any user-initiated API call happens. The `secureLocalStorage` import and the `typeof window` check are both gone.

---

### `/app/[locale]/(auth)/auth/login/page.tsx` - Login Page

**Before:** Called `authenticateUser()` (a function that checked credentials against a hardcoded array of mock users), then dispatched `setUser()` to Redux, then used `router.push()` to navigate.

**After:** Calls `signIn("credentials", { email, password, redirect: false })`.

Key changes:

- **`redirect: false`**: By default, `signIn()` performs a full-page redirect. Setting this to `false` makes it return a result object instead, so the page can show error toasts for invalid credentials before redirecting.

- **`window.location.href` instead of `router.push()`**: After successful credential login, a hard navigation is used. This forces the session cookie to be read fresh by the server and triggers `AuthSync` to populate Redux from the new session. A client-side `router.push()` would navigate without re-reading the session, potentially showing a dashboard before Redux is hydrated.

- **`useSearchParams()` for redirect**: The middleware sets `?redirect=/original-path` when redirecting unauthenticated users to login. The login page reads this param and redirects back after successful sign-in, so users land on the page they originally requested.

- **Google login** calls `signIn("google", { callbackUrl })`. This triggers a full-page redirect to Google's OAuth consent screen. After consent, Google redirects back to `/api/auth/callback/google`, where Auth.js exchanges the code for tokens, runs the `jwt` callback (which calls the backend), and redirects to `callbackUrl`.

- **No Redux dispatch**: The login page no longer dispatches `setUser()`. `AuthSync` handles that automatically when the session becomes active.

---

### `/shared/components/common/logout-dialog.tsx` - Logout

**Before:** Dispatched `clearUser()` to Redux (which cleared storage + cookies) then called `router.push("/auth/login")`.

**After:** Calls `signOut({ callbackUrl: "/auth/login" })`.

`signOut()` clears the Auth.js session cookie server-side, then redirects to the callback URL. When the page loads at `/auth/login`, `AuthSync` sees status `"unauthenticated"` and dispatches `clearUser()` to Redux automatically. This means the logout dialog no longer needs to know about Redux at all.

---

### `/app/[locale]/(auth)/auth/seller/register/page.tsx` and `/app/[locale]/(auth)/auth/buyer/register/page.tsx` - Registration

The Google buttons on both registration pages now call `signIn("google", { callbackUrl })` instead of a stub `console.log`. The callback URL points to the respective OTP page (`/auth/seller/otp` or `/auth/buyer/otp`) so the registration flow continues after Google authentication.

The form-based registration flow (email/password/name fields) still uses RTK Query endpoints (`useRegisterMutation`, `useVerifyOtpMutation`, etc.) for the multi-step registration process. Auth.js is not involved in registration - it only manages sessions. After registration completes, the user signs in via `signIn("credentials", ...)` to establish an Auth.js session.

---

### `/app/[locale]/(auth)/api/auth.api.ts` - RTK Query Auth Endpoints

This file was not changed. It contains RTK Query endpoints for registration, OTP verification, profile completion, password reset, and other auth-adjacent operations that are not session management. These endpoints still use `prepareHeaders` from `redux/api.ts` to attach the Bearer token.

The `login` mutation defined here (`POST /auth/login`) is the same endpoint that Auth.js's `Credentials` provider calls in `authorize()`. However, the RTK Query mutation is no longer used for login on the client - `signIn("credentials")` handles that now. The endpoint remains available in case other parts of the app need it.

---

## What Was Removed and Why

| Removed | Why |
|---------|-----|
| `react-secure-storage` package | Auth.js stores sessions in `httpOnly` cookies. No client-side storage needed. |
| `proxy.ts` | Replaced by the new `proxy.ts` which uses Auth.js's `auth()` wrapper instead of manual cookie parsing. |
| `mock-users.ts` | Login now hits the real backend via Auth.js's `authorize()` function. |
| `loadAuthState()` in auth slice | Auth.js persists sessions. `AuthSync` hydrates Redux from the session. |
| `setCookie()` / `deleteCookie()` in auth slice | Middleware reads `request.auth` instead of a manually managed cookie. |
| `secureLocalStorage` fallback in `redux/api.ts` | Redux state is the single token source, populated by `AuthSync`. |

---

## Data Flow: Login with Credentials

```
1. User submits email + password on /auth/login
2. signIn("credentials", { email, password, redirect: false })
3. Auth.js POST /api/auth/callback/credentials
4. Credentials authorize() → fetch POST /backend/auth/login
5. Backend validates → returns { user, token }
6. authorize() returns { id, name, email, role, backendToken }
7. jwt callback: persists role + backendToken into JWT
8. session callback: exposes role + backendToken on session.user
9. Auth.js sets signed session cookie
10. Client receives { ok: true } from signIn()
11. window.location.href → hard navigation to dashboard
12. Middleware reads request.auth → role matches → allows access
13. Page renders → SessionProvider fetches session → useSession() updates
14. AuthSync sees "authenticated" → dispatches setUser() to Redux
15. RTK Query reads state.auth.token → sends Bearer header on API calls
```

## Data Flow: Login with Google

```
1. User clicks "Continue with Google"
2. signIn("google", { callbackUrl: "/seller/dashboard" })
3. Full-page redirect to Google OAuth consent screen
4. User consents → Google redirects to /api/auth/callback/google
5. Auth.js exchanges authorization code for Google tokens
6. jwt callback: detects account.provider === "google"
7. jwt callback → fetch POST /backend/auth/oauth/google with Google tokens
8. Backend creates/finds user → returns { user: { role }, token }
9. jwt callback: persists role + backendToken into JWT
10. session callback: exposes role + backendToken on session.user
11. Auth.js sets signed session cookie → redirects to callbackUrl
12. Middleware reads request.auth → role matches → allows access
13. AuthSync dispatches setUser() → RTK Query has Bearer token
```

## Data Flow: Logout

```
1. User clicks "Log out" in dialog
2. signOut({ callbackUrl: "/auth/login" })
3. Auth.js clears session cookie server-side
4. Redirects to /auth/login
5. AuthSync sees status "unauthenticated" → dispatches clearUser()
6. Redux state reset: user null, token null, isAuthenticated false
7. RTK Query stops sending Bearer header
8. Middleware blocks protected routes (no session)
```

## Data Flow: Route Protection

```
1. Unauthenticated user navigates to /seller/dashboard
2. Middleware runs: auth() reads session cookie → no session
3. request.auth is null → userRole is null
4. /seller/dashboard matches PROTECTED_ROUTES["/seller/dashboard"]
5. No role → redirect to /auth/login?redirect=/seller/dashboard
6. After login, login page reads ?redirect param
7. Redirects to /seller/dashboard with active session
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Signs and encrypts the session JWT. Must be a random 32+ byte string. If leaked, attackers can forge sessions. |
| `AUTH_GOOGLE_ID` | Google OAuth client ID from Google Cloud Console. |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret. Never expose this client-side. |
| `NEXT_PUBLIC_API_URL` | Backend API base URL. Used by both Auth.js (in `authorize()`) and RTK Query (in `baseUrl`). |
