'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Gavel, Home, Search } from 'lucide-react';

import { Button } from '@/shared/components/common';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-2)_50%,var(--primary-1)_100%)]">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-48 w-48 -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        {/* Gavel icon */}
        <div className="animate-fade-in mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Gavel className="h-10 w-10 text-secondary" />
          </div>
        </div>

        {/* 404 number */}
        <h1
          className="animate-fade-in-up text-[10rem] font-bold leading-none tracking-tight text-primary-foreground sm:text-[12rem]"
          style={{ animationDelay: '0.1s' }}
        >
          404
        </h1>

        {/* Message */}
        <div
          className="animate-fade-in-up -mt-4 space-y-3"
          style={{ animationDelay: '0.2s' }}
        >
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Page Not Found
          </h2>
          <p className="mx-auto max-w-md text-base text-primary-foreground/70">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Buttons */}
        <div
          className="animate-fade-in-up mt-10 flex flex-col justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '0.3s' }}
        >
          <Button
            onClick={() => router.back()}
            variant="secondary"
            size="lg"
            className="group gap-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="gap-2 border border-white/20 bg-white/10 text-foreground backdrop-blur-sm hover:bg-white/20"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Search hint */}
        <div
          className="animate-fade-in-up mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-primary-foreground/50 backdrop-blur-sm"
          style={{ animationDelay: '0.4s' }}
        >
          <Search className="h-3.5 w-3.5" />
          Try searching for auctions on the homepage
        </div>

        {/* Bouncing dots */}
        <div className="mt-16 flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-white/40"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
