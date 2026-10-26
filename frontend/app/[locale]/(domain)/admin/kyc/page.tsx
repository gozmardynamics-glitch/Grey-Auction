'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface QueuedDocument {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  requirement?: { name?: string; code?: string; audience?: string } | null;
}

interface Requirement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  audience: 'buyer' | 'seller' | 'both';
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  maxSizeMb?: number;
}

interface RiskReport {
  userId: string;
  complianceScore: number;
  band: 'low' | 'medium' | 'high';
  requiredTotal: number;
  requiredApproved: number;
  signals: Array<{ code: string; severity: 'info' | 'warn' | 'critical'; detail: string }>;
  recommendation: 'approve' | 'review' | 'withhold';
  eligibleToPublish: boolean;
  publishing?: {
    publishApproved: boolean;
    decisionNote: string | null;
    decidedAt: string | null;
    hasSellerProfile: boolean;
  };
}

const BAND_CLASS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-0',
  medium: 'bg-amber-100 text-amber-700 border-0',
  high: 'bg-red-100 text-red-700 border-0',
};

/**
 * Admin KYC console: review submissions, see the compliance assessment for the
 * account holder, decide whether they may publish, and manage the document
 * requirements themselves. Nothing about the paperwork is hardcoded.
 */
export default function AdminKycPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueuedDocument[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskReport | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    audience: 'buyer' as 'buyer' | 'seller' | 'both',
    isRequired: true,
    maxSizeMb: '10',
  });

  const load = useCallback(async () => {
    try {
      const [queueJson, reqJson] = await Promise.all([
        apiFetch<{ data?: QueuedDocument[] }>('admin/kyc/documents', {
          query: { status: 'pending', limit: 50 },
        }),
        apiFetch<{ data?: Requirement[] }>('admin/kyc/requirements', {
          query: { includeInactive: 'true' },
        }),
      ]);
      // The review endpoint spreads { data, total, page, limit } at the top level.
      const rows = Array.isArray(queueJson?.data)
        ? queueJson.data
        : Array.isArray((queueJson as unknown as { data?: { data?: QueuedDocument[] } })?.data?.data)
          ? ((queueJson as unknown as { data: { data: QueuedDocument[] } }).data.data)
          : [];
      setQueue(rows);
      setRequirements(Array.isArray(reqJson?.data) ? reqJson.data : []);
    } catch {
      toast.error('Could not load the KYC console');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRisk = async (userId: string) => {
    setSelectedUser(userId);
    setRisk(null);
    try {
      const json = await apiFetch<{ data: RiskReport }>(`admin/kyc/sellers/${userId}/risk`);
      setRisk(json.data ?? null);
    } catch {
      toast.error('Could not load the compliance assessment');
    }
  };

  const review = async (doc: QueuedDocument, status: 'approved' | 'rejected') => {
    const note = notes[doc.id] ?? '';
    if (status === 'rejected' && !note.trim()) {
      toast.error('A rejection needs a reason');
      return;
    }
    setBusy(doc.id);
    try {
      await apiFetch(`admin/kyc/documents/${doc.id}/review`, {
        method: 'POST',
        body: { status, reviewNotes: note || undefined },
      });
      toast.success(status === 'approved' ? 'Document approved' : 'Document rejected');
      await load();
      if (selectedUser === doc.userId) await openRisk(doc.userId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not record the review');
    } finally {
      setBusy(null);
    }
  };

  const decidePublish = async (approved: boolean) => {
    if (!selectedUser) return;
    setBusy('publish');
    try {
      await apiFetch(`admin/kyc/sellers/${selectedUser}/publish`, {
        method: 'POST',
        body: { approved, note: decisionNote || undefined },
      });
      toast.success(approved ? 'Publishing approved' : 'Publishing withheld');
      await openRisk(selectedUser);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not record the decision');
    } finally {
      setBusy(null);
    }
  };

  const createRequirement = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    setBusy('create');
    try {
      await apiFetch('admin/kyc/requirements', {
        method: 'POST',
        body: {
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          audience: form.audience,
          isRequired: form.isRequired,
          maxSizeMb: Number(form.maxSizeMb) || 10,
        },
      });
      toast.success('Requirement created');
      setForm({ code: '', name: '', description: '', audience: 'buyer', isRequired: true, maxSizeMb: '10' });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create the requirement');
    } finally {
      setBusy(null);
    }
  };

  const deactivate = async (requirement: Requirement) => {
    setBusy(requirement.id);
    try {
      await apiFetch(`admin/kyc/requirements/${requirement.id}/deactivate`, { method: 'POST' });
      toast.success('Requirement deactivated');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not deactivate it');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KYC</h1>
        <p className="text-sm text-muted-foreground">
          Review submitted documents, assess the account holder, and decide who may publish.
        </p>
      </div>

      {/* Review queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Awaiting review
            {queue.length > 0 && <Badge variant="outline">{queue.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : queue.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing waiting for review.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Requirement</th>
                    <th className="px-4 py-2.5 font-medium">Account holder</th>
                    <th className="px-4 py-2.5 font-medium">File</th>
                    <th className="px-4 py-2.5 font-medium">Submitted</th>
                    <th className="px-4 py-2.5 font-medium">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((doc) => (
                    <tr key={doc.id} className="border-t border-border/50 align-top">
                      <td className="px-4 py-3">{doc.requirement?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          className="text-primary hover:underline"
                          onClick={() => void openRisk(doc.userId)}
                        >
                          {doc.userId.slice(0, 8)}…
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          className="text-primary hover:underline"
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {doc.fileName}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Reason (required to reject)"
                            value={notes[doc.id] ?? ''}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))
                            }
                            className="h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={busy === doc.id}
                              onClick={() => void review(doc, 'approved')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={busy === doc.id}
                              onClick={() => void review(doc, 'rejected')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance assessment + publish decision */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Compliance assessment — {selectedUser.slice(0, 8)}…
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!risk ? (
              <p className="text-sm text-muted-foreground">Loading assessment…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={BAND_CLASS[risk.band] ?? ''}>{risk.band} risk</Badge>
                  <span className="text-sm">
                    Score <strong>{risk.complianceScore}</strong>/100
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {risk.requiredApproved}/{risk.requiredTotal} required approved
                  </span>
                  <Badge variant="outline">recommendation: {risk.recommendation}</Badge>
                  <Badge
                    className={
                      risk.publishing?.publishApproved
                        ? 'bg-emerald-100 text-emerald-700 border-0'
                        : 'bg-muted text-muted-foreground border-0'
                    }
                  >
                    publishing {risk.publishing?.publishApproved ? 'approved' : 'not approved'}
                  </Badge>
                </div>

                {risk.signals.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {risk.signals.map((s) => (
                      <li
                        key={s.code}
                        className={
                          s.severity === 'critical'
                            ? 'text-destructive'
                            : s.severity === 'warn'
                              ? 'text-amber-700'
                              : 'text-muted-foreground'
                        }
                      >
                        • {s.detail}
                      </li>
                    ))}
                  </ul>
                )}

                {risk.publishing?.hasSellerProfile === false ? (
                  <p className="text-sm text-muted-foreground">
                    This account has no seller profile, so there is no publishing permission to
                    decide. It can still bid, and KYC documents above are reviewed normally.
                  </p>
                ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="decision-note">Decision note (optional)</Label>
                    <Input
                      id="decision-note"
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="Why you decided this"
                    />
                  </div>
                  <Button
                    disabled={busy === 'publish'}
                    onClick={() => void decidePublish(true)}
                  >
                    Approve publishing
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy === 'publish'}
                    onClick={() => void decidePublish(false)}
                  >
                    Withhold
                  </Button>
                </div>
                )}
                <p className="text-xs text-muted-foreground">
                  KYC approval and publishing permission are separate: documents passing review do
                  not by themselves make a seller able to publish lots.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requirements configured yet.</p>
          ) : (
            <div className="space-y-2">
              {requirements.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {r.name}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({r.code} · {r.audience}
                        {r.isRequired ? ' · required' : ' · optional'})
                      </span>
                    </p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        r.isActive
                          ? 'bg-emerald-100 text-emerald-700 border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {r.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {r.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === r.id}
                        onClick={() => void deactivate(r)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-code">Code</Label>
              <Input
                id="req-code"
                placeholder="national_id"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-name">Name</Label>
              <Input
                id="req-name"
                placeholder="National ID Card"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-desc">Description (optional)</Label>
              <Input
                id="req-desc"
                placeholder="Front and back, clearly legible"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-audience">Audience</Label>
              <select
                id="req-audience"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value as 'buyer' | 'seller' | 'both' })
                }
              >
                <option value="buyer">buyer</option>
                <option value="seller">seller</option>
                <option value="both">both</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-size">Max size (MB)</Label>
              <Input
                id="req-size"
                type="number"
                min={1}
                value={form.maxSizeMb}
                onChange={(e) => setForm({ ...form, maxSizeMb: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void createRequirement()}
                disabled={busy === 'create'}
                className="w-full"
              >
                Add requirement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
