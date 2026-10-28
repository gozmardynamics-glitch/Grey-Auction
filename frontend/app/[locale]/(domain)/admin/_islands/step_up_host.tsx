'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { Button, Input, Label } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { onStepUpRequired } from '@/shared/utils/step-up';
import { useAppSelector } from '@/redux/store';

/**
 * The one prompt for "confirm it is you".
 *
 * Mounted once in the admin layout. When any request comes back needing a fresh
 * second factor, this opens, takes a code, and then re-runs whatever the user
 * was doing — they press the button again, which is honest: nothing is replayed
 * silently on their behalf.
 */
export default function StepUpHost() {
  const token = useAppSelector((state) => state.auth.token);
  const [open, setOpen] = useState(false);
  const [windowMinutes, setWindowMinutes] = useState<number | undefined>(undefined);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    () =>
      onStepUpRequired((detail) => {
        setWindowMinutes(detail.windowMinutes);
        setCode('');
        setError('');
        setOpen(true);
      }),
    [],
  );

  const close = useCallback(() => setOpen(false), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const cleaned = code.replace(/\s/g, '');
    if (cleaned.length < 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsLoading(true);
    try {
      await apiFetch('admin/mfa/step-up', { method: 'POST', token, body: { code: cleaned } });
      setOpen(false);
      setCode('');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not confirm just now. Try again, or use a recovery code.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="step-up-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 id="step-up-title" className="text-base font-semibold">
            Confirm it is you
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This action moves money or changes an account, so it needs a code from your
          authenticator app
          {windowMinutes ? ` (valid for ${windowMinutes} minutes)` : ''}. Then try the action
          again.
        </p>
        <div className="space-y-2">
          <Label htmlFor="step-up-code">Authentication code</Label>
          <Input
            id="step-up-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Lost your phone? A single-use recovery code works here too.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      </form>
    </div>
  );
}
