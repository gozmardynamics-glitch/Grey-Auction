'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/common';

export default function SubscribePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiBase + '/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError('Please enter a valid email address.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Subscribe to GreyAuction updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-2 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="text-sm font-medium">Almost there.</p>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to your email. Please click it to confirm your subscription.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get notified about new auctions, price drops and special offers.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !email}>
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </Button>
              </div>
              {error && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> {error}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
