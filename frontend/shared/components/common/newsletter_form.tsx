'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from './input';
import { Button } from './button';
import { MiniSpinner } from './spinner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * G33 — footer newsletter capture, wired to the real double opt-in flow:
 * POST /subscriptions sends a confirmation email; the link lands on
 * /subscribe/confirm?token=… (backend marks the address CONFIRMED).
 */
export function NewsletterForm() {
  const t = useTranslations('footer.newsletter');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error(t('invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      toast.success(t('checkInbox'));
      setEmail('');
    } catch {
      toast.error(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  // Rendered inside the dark navy footer → light text on navy, white input with
  // dark text so both foreground and placeholder meet WCAG AA.
  return (
    <div className="w-full max-w-sm space-y-2">
      <h4 className="font-semibold text-white">{t('title')}</h4>
      <p className="text-sm text-[#c3cdda]">{t('blurb')}</p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="email"
          placeholder={t('placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          aria-label={t('placeholder')}
          className="h-10 rounded-full border-white/10 bg-white text-[#101c2b] placeholder:text-[#64748b]"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-10 shrink-0 rounded-full px-5"
        >
          {loading ? <MiniSpinner className="size-4" /> : t('subscribe')}
        </Button>
      </form>
    </div>
  );
}
