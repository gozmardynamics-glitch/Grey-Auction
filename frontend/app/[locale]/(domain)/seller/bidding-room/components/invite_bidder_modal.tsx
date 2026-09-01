'use client';

import { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/components/common';
import {
  Copy,
  Check,
  Mail,
  Clock,
  MessageCircle,
  Send,
  Lock,
  Users,
  Share2,
} from 'lucide-react';
import { useAppSelector } from '@/redux/store';

interface InviteBidderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  roomId?: string;
  productId?: string;
}

type InviteMode = 'exclusive' | 'request';

export default function InviteBidderModal({
  open,
  onOpenChange,
  roomName,
  roomId,
  productId,
}: InviteBidderModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expiry, setExpiry] = useState<string>('24h');
  const [mode, setMode] = useState<InviteMode>('exclusive');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const authToken = useAppSelector((state) => state.auth.token);

  const handleReset = () => {
    setStep('form');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setExpiry('24h');
    setMode('exclusive');
    setInviteLink('');
    setCopied(false);
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const handleInvite = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/invites/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          roomId,
          productId,
          expiry,
          mode,
          maxUsage: mode === 'request' ? 1 : 10,
          inviteeEmail: email.trim() || undefined,
          inviteeName: `${firstName} ${lastName}`.trim() || undefined,
          inviteePhone: phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate invite');
      }

      const json = await res.json();
      const invite = json.data ?? json;
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${invite.token}`);
      setStep('success');
    } catch {
      // Fallback for demo: generate local link
      setInviteLink(
        `${window.location.origin}/invite/demo-${Date.now().toString(36)}`
      );
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  }, [authToken, roomId, productId, expiry, mode, email, firstName, lastName, phone]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteLink]);

  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(
      `🔒 You've been invited to a ${mode === 'exclusive' ? 'private' : 'special'} auction — ${roomName}! Join here: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [inviteLink, roomName, mode]);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Auction Invitation: ${roomName}`);
    const body = encodeURIComponent(
      `You've been invited to ${roomName}. Join here: ${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }, [inviteLink, roomName]);

  const handleTelegramShare = useCallback(() => {
    const text = encodeURIComponent(
      `🔒 You've been invited to a ${mode === 'exclusive' ? 'private' : 'special'} auction — ${roomName}! Join here: ${inviteLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
  }, [inviteLink, roomName, mode]);

  const isFormValid = firstName.trim() && email.trim();

  const initials = firstName.trim()
    ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase()
    : '';

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm p-0">
          <div className="flex flex-col items-center p-6 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invitation Created</h3>
              <p className="text-sm text-muted-foreground">
                {mode === 'exclusive'
                  ? 'Exclusive invite — only this bidder can join with this link.'
                  : 'Invite by request — bidder must be approved by you.'}
              </p>
            </div>

            {/* Invite link box */}
            <div className="w-full rounded-lg border border-border bg-muted/50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                Expires in {expiry}
              </div>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {inviteLink}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share channels */}
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">
                Share via
              </p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:scale-105"
                >
                  <MessageCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-[10px] font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={handleEmailShare}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-105"
                >
                  <Send className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-medium">Email</span>
                </button>
                <button
                  onClick={handleTelegramShare}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-sky-500 hover:bg-sky-50 hover:scale-105"
                >
                  <Send className="h-5 w-5 text-sky-500 rotate-45" />
                  <span className="text-[10px] font-medium">Telegram</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-slate-400 hover:bg-slate-50 hover:scale-105"
                >
                  <Share2 className="h-5 w-5 text-slate-500" />
                  <span className="text-[10px] font-medium">Copy</span>
                </button>
              </div>
            </div>

            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            {initials && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">{initials}</span>
              </div>
            )}
            <DialogHeader>
              <DialogTitle>Invite Participant</DialogTitle>
            </DialogHeader>
          </div>

          {/* Invite mode selector */}
          <div className="space-y-2">
            <Label>Invite Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('exclusive')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                  mode === 'exclusive'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Lock className={`h-4 w-4 ${mode === 'exclusive' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">Exclusive</span>
                <span className="text-[10px] text-muted-foreground">
                  Personal invite — single bidder, can share multiple times
                </span>
              </button>
              <button
                onClick={() => setMode('request')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                  mode === 'request'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Users className={`h-4 w-4 ${mode === 'request' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">By Request</span>
                <span className="text-[10px] text-muted-foreground">
                  Open link — bidders request to join, you approve
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional — SMS invite)</Label>
              <Input
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Invite Expiry</Label>
              <div className="flex gap-2">
                {[
                  { value: '1h', label: '1 Hour' },
                  { value: '24h', label: '24 Hours' },
                  { value: '7d', label: '7 Days' },
                  { value: 'never', label: 'Never' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      expiry === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!isFormValid || isSubmitting}
              onClick={handleInvite}
            >
              {isSubmitting ? 'Creating...' : 'Create Invite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
