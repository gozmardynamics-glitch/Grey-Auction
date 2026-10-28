'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldOff, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, Button, Input, Separator, Switch } from '@/shared/components/common';
import { ApiError, apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

interface RolePolicy {
  required: boolean;
  stepUpMinutes: number;
}

interface Policy {
  required: boolean;
  roles: Record<string, RolePolicy>;
}

interface MyStatus {
  enabled: boolean;
  role: string;
  enrolledAt: string | null;
  lastVerifiedAt: string | null;
  stepUpExpiresAt: string | null;
  stepUpValid: boolean;
  lockedUntil: string | null;
  recoveryCodesRemaining: number;
  policy: { required: boolean; stepUpMinutes: number };
}

interface Roster {
  policy: Policy;
  admins: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    mfaEnabled: boolean;
    enrolledAt: string | null;
    lastMfaAt: string | null;
    lockedUntil: string | null;
    recoveryCodesRemaining: number;
    requiresMfa: boolean;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super admin',
  platform_admin: 'Platform admin',
  finance_admin: 'Finance admin',
  support_admin: 'Support admin',
};

/**
 * Two-factor authentication: the admin's own state, and — for a super admin —
 * the policy and the roster.
 *
 * This replaces a `twoFactorAuth` switch that saved a boolean nobody enforced.
 * What it shows is what the API actually does: who is enrolled, whose proof has
 * lapsed, and how long a proof lasts for each role.
 */
export default function TwoFactorSettings() {
  const token = useAppSelector((state) => state.auth.token);
  const [mine, setMine] = useState<MyStatus | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const status = await apiFetch<{ data: MyStatus }>('admin/mfa/status', { token });
      setMine(status.data);
      // The policy and roster are super-admin only; a 403 here is expected for
      // the other roles and is not an error worth showing them.
      const overview = await apiFetch<{ data: Roster }>('admin/mfa/overview', { token }).catch(
        () => null,
      );
      if (overview?.data) {
        setRoster(overview.data);
        setPolicy(overview.data.policy);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load two-factor settings.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePolicy = async () => {
    if (!policy) return;
    setIsSaving(true);
    try {
      await apiFetch('admin/mfa/policy', {
        method: 'PUT',
        token,
        body: { required: policy.required, roles: policy.roles },
      });
      toast.success('Two-factor policy saved');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the policy');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateRecoveryCodes = async () => {
    if (code.replace(/\s/g, '').length < 6) {
      toast.error('Enter the 6-digit code from your authenticator app first.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiFetch<{ data: { recoveryCodes: string[] } }>(
        'admin/mfa/recovery-codes',
        { method: 'POST', token, body: { code: code.replace(/\s/g, '') } },
      );
      setRecoveryCodes(res.data.recoveryCodes);
      setCode('');
      toast.success('New recovery codes issued. The old ones no longer work.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not issue recovery codes');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAdmin = async (adminId: string, email: string) => {
    if (!window.confirm(`Reset two-factor for ${email}? They will set it up again at next sign-in.`)) {
      return;
    }
    try {
      await apiFetch(`admin/mfa/${adminId}/reset`, { method: 'POST', token });
      toast.success('Second factor reset');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not reset');
    }
  };

  const unlockAdmin = async (adminId: string) => {
    try {
      await apiFetch(`admin/mfa/${adminId}/unlock`, { method: 'POST', token });
      toast.success('Lockout cleared');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not clear the lockout');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading two-factor settings…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* ── My second factor ───────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">My second factor</h3>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          {mine?.enabled ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <ShieldOff className="h-5 w-5 text-destructive" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {mine?.enabled ? 'Authenticator app is set up' : 'No second factor on this account'}
            </p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[mine?.role ?? ''] ?? mine?.role}
              {mine?.enrolledAt
                ? ` · enrolled ${new Date(mine.enrolledAt).toLocaleDateString()}`
                : ''}
              {mine?.lastVerifiedAt
                ? ` · last confirmed ${new Date(mine.lastVerifiedAt).toLocaleString()}`
                : ''}
            </p>
          </div>
          <Badge variant={mine?.stepUpValid ? 'default' : 'secondary'}>
            {mine?.stepUpValid ? 'Sensitive actions unlocked' : 'Sensitive actions locked'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          A code is required to sign in, and again before an action that moves money or changes an
          account. The second proof lasts {mine?.policy.stepUpMinutes} minutes for your role.
          {mine?.lockedUntil
            ? ` This account is locked until ${new Date(mine.lockedUntil).toLocaleTimeString()} after repeated wrong codes.`
            : ''}
        </p>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="mfa-code" className="text-sm font-medium">
              Replace my recovery codes ({mine?.recoveryCodesRemaining ?? 0} left)
            </label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Confirming with a code proves it is you. The previous codes stop working immediately.
            </p>
          </div>
          <Button variant="outline" onClick={regenerateRecoveryCodes} disabled={isSaving}>
            <KeyRound className="mr-1 h-4 w-4" /> Issue new codes
          </Button>
        </div>

        {recoveryCodes && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="mb-2 text-sm font-medium">Save these now — they are shown once.</p>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-5">
              {recoveryCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRecoveryCodes(null)}>
              I have saved them
            </Button>
          </div>
        )}
      </section>

      {/* ── Policy (super admin) ───────────────────────────────── */}
      {policy && (
        <>
          <Separator />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Policy</h3>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Require two-factor for administrators</p>
                <p className="text-xs text-muted-foreground">
                  Off means a password alone can reach the admin surface. It cannot be switched off
                  in production without an explicit deployment flag.
                </p>
              </div>
              <Switch
                checked={policy.required}
                onCheckedChange={(checked) => setPolicy({ ...policy, required: checked })}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Requires a code</th>
                    <th className="py-2 pr-4 font-medium">Proof valid for (minutes)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(policy.roles).map(([role, entry]) => (
                    <tr key={role} className="border-b border-border/50">
                      <td className="py-2 pr-4">{ROLE_LABELS[role] ?? role}</td>
                      <td className="py-2 pr-4">
                        <Switch
                          checked={entry.required}
                          onCheckedChange={(checked) =>
                            setPolicy({
                              ...policy,
                              roles: { ...policy.roles, [role]: { ...entry, required: checked } },
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          className="h-9 w-24"
                          value={entry.stepUpMinutes}
                          onChange={(event) =>
                            setPolicy({
                              ...policy,
                              roles: {
                                ...policy.roles,
                                [role]: {
                                  ...entry,
                                  stepUpMinutes: Number(event.target.value) || entry.stepUpMinutes,
                                },
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={savePolicy} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save policy'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Saving the policy needs a fresh code — the prompt appears if your last proof has
              expired. That is deliberate: the policy protects the account that protects the money.
            </p>
          </section>
        </>
      )}

      {/* ── Roster (super admin) ───────────────────────────────── */}
      {roster && (
        <>
          <Separator />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Administrators</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Administrator</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Second factor</th>
                    <th className="py-2 pr-4 font-medium">Codes left</th>
                    <th className="py-2 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border/50 align-middle">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-xs text-muted-foreground">{admin.email}</div>
                      </td>
                      <td className="py-2 pr-4">{ROLE_LABELS[admin.role] ?? admin.role}</td>
                      <td className="py-2 pr-4">
                        {admin.mfaEnabled ? (
                          <Badge variant="default">Enrolled</Badge>
                        ) : (
                          <Badge variant={admin.requiresMfa ? 'destructive' : 'secondary'}>
                            {admin.requiresMfa ? 'Blocked until enrolled' : 'Not set up'}
                          </Badge>
                        )}
                        {admin.lockedUntil && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                            <ShieldAlert className="h-3 w-3" /> locked
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4">{admin.recoveryCodesRemaining}</td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {admin.mfaEnabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetAdmin(admin.id, admin.email)}
                            >
                              Reset
                            </Button>
                          )}
                          {admin.lockedUntil && (
                            <Button variant="ghost" size="sm" onClick={() => unlockAdmin(admin.id)}>
                              Clear lockout
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Resetting is the way back in when someone loses both their phone and their recovery
              codes. You cannot reset your own account — that is what the recovery codes are for.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
