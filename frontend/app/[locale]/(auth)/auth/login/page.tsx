'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { Logo, Button, Input, Label } from '@/shared/components/common';

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  seller: '/seller/dashboard',
  buyer: '/buyer/dashboard',
};

type Step = 'credentials' | 'code' | 'enrol';

interface Enrolment {
  otpauthUrl: string;
  secret: string;
  recoveryCodes: string[];
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [codesSaved, setCodesSaved] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // The QR is drawn in the browser: the shared secret must never be sent to a
  // third-party renderer.
  useEffect(() => {
    let cancelled = false;
    if (!enrolment?.otpauthUrl) {
      setQrDataUrl(null);
      return;
    }
    import('qrcode')
      .then((mod) => mod.toDataURL(enrolment.otpauthUrl, { margin: 1, width: 220 }))
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        // The manual secret and the otpauth link below still work.
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enrolment?.otpauthUrl]);

  const finish = async () => {
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role || 'buyer';
    const redirect = searchParams.get('redirect') || ROLE_DASHBOARDS[role] || '/';
    router.push(redirect);
    router.refresh();
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      // Auth.js answers a failed credentials sign-in with HTTP 200 and the
      // reason in the redirect URL, so `ok` alone means nothing here: `error`
      // and `code` are what distinguish success from failure.
      if (result?.ok && !result?.error && !result?.code) {
        await finish();
        return;
      }

      // Auth.js forwards the backend's reason as `code`, so the right step can
      // open instead of a blanket "invalid email or password".
      if (result?.code === 'MFA_REQUIRED') {
        setNotice('Enter the 6-digit code from your authenticator app.');
        setStep('code');
        return;
      }
      if (result?.code === 'MFA_ENROLMENT_REQUIRED') {
        await beginEnrolment();
        return;
      }
      setError('Invalid email or password');
    } catch {
      setError('Network error — is the API running on port 3001?');
    } finally {
      setIsLoading(false);
    }
  };

  const beginEnrolment = async () => {
    setIsLoading(true);
    try {
      // Two-factor setup happens before there is a session, because an
      // administrator cannot sign in without one.
      const res = await fetch('/api/proxy/auth/mfa/enrol/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || 'Could not start two-factor setup.');
        return;
      }
      setEnrolment(json.data);
      setNotice(
        'Scan the code with an authenticator app, store your recovery codes, then enter the 6-digit code.',
      );
      setStep('enrol');
    } catch {
      setError('Network error while starting two-factor setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length !== 6 && !/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    if (step === 'enrol' && !codesSaved) {
      setError('Save your recovery codes before continuing — they are shown only once.');
      return;
    }

    setIsLoading(true);
    try {
      // The same call carries the second factor: no half-authenticated
      // credential exists between the password and the code.
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        code: code.trim(),
        redirect: false,
      });

      if (result?.ok && !result?.error && !result?.code) {
        await finish();
        return;
      }
      setError(
        result?.code === 'invalid_credentials' || !result?.code
          ? 'That code is not correct.'
          : 'That code is not correct. Use the current code, or a recovery code.',
      );
    } catch {
      setError('Network error — is the API running on port 3001?');
    } finally {
      setIsLoading(false);
    }
  };

  const back = () => {
    setStep('credentials');
    setCode('');
    setError('');
    setNotice('');
    setEnrolment(null);
    setCodesSaved(false);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Logo className="text-2xl" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {step === 'credentials' ? 'Welcome back' : step === 'code' ? 'Two-step verification' : 'Set up two-factor'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 'credentials'
            ? 'Sign in to your GreyAuction account'
            : step === 'code'
              ? 'Administrator accounts need a code from your authenticator app'
              : 'Administrators must use a second factor. This takes about a minute.'}
        </p>
      </div>

      {step === 'credentials' ? (
        <form onSubmit={submitCredentials} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/login/forgot_password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-base font-semibold"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-5" noValidate>
          {step === 'enrol' && enrolment && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Authenticator setup QR code" width={220} height={220} />
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Scan the link below in your authenticator app, or type the secret.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Secret
                </p>
                <code className="block break-all rounded bg-background px-2 py-1 text-xs">
                  {enrolment.secret}
                </code>
                <a
                  href={enrolment.otpauthUrl}
                  className="block truncate text-xs text-primary hover:underline"
                >
                  Open in authenticator app
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recovery codes — each works once
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                  {enrolment.recoveryCodes.map((recoveryCode) => (
                    <span key={recoveryCode}>{recoveryCode}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  These are shown once. If you lose your phone and these codes, an administrator
                  has to reset your access.
                </p>
              </div>
              <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I have saved my recovery codes somewhere safe.</span>
              </label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">
              {step === 'enrol' ? 'Enter the 6-digit code from the app' : 'Authentication code'}
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lost your phone? A recovery code works in place of the 6 digits.
            </p>
          </div>

          {notice && !error && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{notice}</p>
          )}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-base font-semibold"
          >
            {isLoading ? 'Verifying…' : step === 'enrol' ? 'Finish setup and sign in' : 'Verify and sign in'}
          </Button>

          <button
            type="button"
            onClick={back}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Start over
          </button>
        </form>
      )}

      {step === 'credentials' && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/buyer/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
