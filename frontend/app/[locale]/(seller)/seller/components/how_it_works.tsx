'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/common';
import Image from 'next/image';

const STEPS = [
  {
    step: 1,
    title: 'Request Seller Access',
    bullets: [
      'Submit your details through the contact form and our team will review your request.',
      "Once approved, you'll receive access to your seller dashboard.",
    ],
    image: '/gen.svg',
  },
  {
    step: 2,
    title: 'List & Receive Competitive Bids',
    bullets: [
      'Create your listing, upload photos, and set auction details.',
      'Buyers place real-time bids, driving your final price higher.',
    ],
    image: '/car.svg',
  },
  {
    step: 3,
    title: 'Get Paid Securely',
    bullets: [
      'Winning payments are held securely until the transaction is complete.',
      'Funds are then released directly to you.',
    ],
    image: '/chair.svg',
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = STEPS[activeStep];

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [paused]);

  const handleStepClick = useCallback((index: number) => {
    setActiveStep(index);
    setPaused(true);

    const timeout = setTimeout(() => setPaused(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section id="how-it-works" className="p-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full borde-primary bg-primary/10 px-4 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary">
            !
          </div>
          <span className="text-sm font-medium text-primary">How it Works</span>
        </div>
        <h2 className="text-4xl font-bold text-foreground md:text-5xl">
          Start selling in just a few
          <br />
          simple steps
        </h2>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left Side */}
        <div>
          {/* Step Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground">
              !
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Step {current.step}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-6 text-2xl font-bold text-foreground">
            {current.title}
          </h3>

          {/* Bullet Points */}
          <div className="mb-8 space-y-4">
            {current.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{bullet}</span>
              </div>
            ))}
          </div>

          {/* Tab Indicators */}
          <div className="mb-8 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <Button
                key={i}
                variant="ghost"
                onClick={() => handleStepClick(i)}
                className={`h-1 rounded-full transition-all p-0 min-w-0 ${
                  i === activeStep
                    ? 'w-8 bg-primary'
                    : 'w-8 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <Button>Contact Us</Button>
        </div>

        {/* Right Side - Illustration Placeholder */}
        <div className="flex items-center justify-center rounded-2xl bg-muted/30 p-8">
          <div className="relative h-[300px] w-full md:h-[400px]">
            {STEPS[current.step]?.image ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/50">
                <Image
                  src={STEPS[current.step].image}
                  alt={`Step ${current.step} Illustration`}
                  width={300}
                  height={300}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  Step {current.step} Illustration
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
