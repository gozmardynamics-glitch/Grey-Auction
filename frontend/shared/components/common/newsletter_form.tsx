'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Input } from './input';
import { Button } from './button';
import { MiniSpinner } from './spinner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'greyauction_newsletter_email';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const existing = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || '[]'
        );
        existing.push({ email: email.trim(), subscribedAt: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        toast.success('Thanks for subscribing!');
        setEmail('');
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  // Rendered inside the dark navy footer → light text on navy, white input with
  // dark text so both foreground and placeholder meet WCAG AA.
  return (
    <div className="w-full max-w-sm space-y-2">
      <h4 className="font-semibold text-white">Newsletter</h4>
      <p className="text-sm text-[#c3cdda]">
        Subscribe to get updates on new auctions and exclusive deals.
      </p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-10 rounded-full border-white/10 bg-white text-[#101c2b] placeholder:text-[#64748b]"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-10 shrink-0 rounded-full px-5"
        >
          {loading ? <MiniSpinner className="size-4" /> : 'Subscribe'}
        </Button>
      </form>
    </div>
  );
}