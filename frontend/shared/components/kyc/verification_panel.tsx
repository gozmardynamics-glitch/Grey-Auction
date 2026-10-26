'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck, Upload, X } from 'lucide-react';
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

interface ChecklistDocument {
  id: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ChecklistItem {
  requirementId: string;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  maxSizeMb: number;
  allowedMimeTypes: string[];
  document: ChecklistDocument | null;
}

interface KycStatus {
  isVerified: boolean;
  requiredTotal: number;
  requiredApproved: number;
  pendingReview: number;
  rejected: number;
  outstanding: Array<{ code: string; name: string }>;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 border-0' },
  pending: { label: 'In review', className: 'bg-amber-100 text-amber-700 border-0' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-0' },
};

/**
 * Account-holder KYC: the checklist the admin configured, an upload per
 * requirement, and the outcome of each review. The API is the authority on the
 * MIME type and size — this form only hints at them.
 */
export default function KycVerificationPanel() {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      const [statusJson, checklistJson] = await Promise.all([
        apiFetch<{ data: KycStatus }>('kyc/status'),
        apiFetch<{ data: ChecklistItem[] }>('kyc/requirements'),
      ]);
      setStatus(statusJson.data ?? null);
      setChecklist(Array.isArray(checklistJson.data) ? checklistJson.data : []);
    } catch {
      toast.error('Could not load your verification status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (item: ChecklistItem) => {
    const input = fileInputs.current[item.code];
    const file = input?.files?.[0];
    if (!file) {
      toast.error('Choose a file first');
      return;
    }

    setBusyCode(item.code);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('requirementCode', item.code);
      if (expiry[item.code]) form.append('expiresAt', expiry[item.code]);

      await apiFetch('kyc/documents', { method: 'POST', body: form });
      toast.success(`${item.name} submitted for review`);
      if (input) input.value = '';
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Upload failed. Please try again.',
      );
    } finally {
      setBusyCode(null);
    }
  };

  const withdraw = async (item: ChecklistItem) => {
    if (!item.document) return;
    setBusyCode(item.code);
    try {
      await apiFetch(`kyc/documents/${item.document.id}`, { method: 'DELETE' });
      toast.success('Document withdrawn');
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not withdraw the document',
      );
    } finally {
      setBusyCode(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your verification…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Verification</h2>
          <p className="text-sm text-muted-foreground">
            Upload the documents the platform requires. An admin reviews each one.
          </p>
        </div>
        {status && (
          <Badge
            className={
              status.isVerified
                ? 'bg-emerald-100 text-emerald-700 border-0'
                : 'bg-amber-100 text-amber-700 border-0'
            }
          >
            {status.isVerified
              ? 'Verified'
              : `${status.requiredApproved}/${status.requiredTotal} required approved`}
          </Badge>
        )}
      </div>

      {checklist.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No documents are required of you right now.
          </CardContent>
        </Card>
      )}

      {checklist.map((item) => {
        const doc = item.document;
        const meta = doc ? STATUS_META[doc.status] : null;
        return (
          <Card key={item.requirementId}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {item.name}
                  {item.isRequired && (
                    <span className="text-xs font-normal text-muted-foreground">(required)</span>
                  )}
                </CardTitle>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              {meta && <Badge className={meta.className}>{meta.label}</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {doc && (
                <div className="rounded-md border border-border/60 p-3 text-sm">
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                    {doc.expiresAt ? ` · expires ${new Date(doc.expiresAt).toLocaleDateString('en-GB')}` : ''}
                  </p>
                  {doc.reviewNotes && (
                    <p className="mt-2 text-xs text-destructive">Reviewer: {doc.reviewNotes}</p>
                  )}
                </div>
              )}

              {doc?.status === 'approved' ? (
                <p className="text-sm text-muted-foreground">
                  Approved — upload a replacement only if it expires.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`file-${item.code}`}>
                      {doc ? 'Replace file' : 'Choose file'}
                    </Label>
                    <Input
                      id={`file-${item.code}`}
                      type="file"
                      accept={item.allowedMimeTypes.join(',') || undefined}
                      ref={(el) => {
                        fileInputs.current[item.code] = el;
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Up to {item.maxSizeMb} MB
                      {item.allowedMimeTypes.length
                        ? ` · ${item.allowedMimeTypes.join(', ')}`
                        : ''}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`expiry-${item.code}`}>Expiry (optional)</Label>
                    <Input
                      id={`expiry-${item.code}`}
                      type="date"
                      value={expiry[item.code] ?? ''}
                      onChange={(e) =>
                        setExpiry((prev) => ({ ...prev, [item.code]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => void upload(item)}
                    disabled={busyCode === item.code}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {busyCode === item.code ? 'Uploading…' : 'Upload'}
                  </Button>
                  {doc && (
                    <Button
                      variant="outline"
                      onClick={() => void withdraw(item)}
                      disabled={busyCode === item.code}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Withdraw
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
