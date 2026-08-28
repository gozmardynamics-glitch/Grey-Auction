'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from '@/shared/components/common';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const DISPUTE_REASONS = [
  { value: 'not_as_described', label: 'Item not as described' },
  { value: 'non_delivery', label: 'Non-delivery' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'conduct', label: 'Seller conduct' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Open-a-dispute dialog (L4). Posts to POST /disputes with a reason + description.
 */
export function DisputeDialog({
  open,
  onClose,
  onOpened,
  token,
  productId,
  productTitle,
}: {
  open: boolean;
  onClose: () => void;
  onOpened?: () => void;
  token?: string;
  productId?: string;
  productTitle?: string;
}) {
  const [reason, setReason] = useState<string>('not_as_described');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(API_BASE + '/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          reason,
          description: description.trim(),
          ...(productId ? { productId } : {}),
        }),
      });
      if (!res.ok) {
        setError('Could not open the dispute. Please try again.');
        return;
      }
      setDescription('');
      onClose();
      onOpened?.();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Open a dispute
          </DialogTitle>
          <DialogDescription>
            {productTitle
              ? 'Report an issue with "' + productTitle + '".'
              : 'Report an issue with a transaction.'}{' '}
            Our support team will review it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dispute-reason">Reason</Label>
            <select
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              data-testid="dispute-reason"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dispute-description">What went wrong?</Label>
            <Textarea
              id="dispute-description"
              data-testid="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in a few sentences..."
              rows={4}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} data-testid="dispute-submit">
            {submitting ? 'Submitting...' : 'Submit dispute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DisputeDialog;
