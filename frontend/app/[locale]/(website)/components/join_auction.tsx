import Image from 'next/image';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/common';

const steps = [
  { number: '01', text: 'Explore Auctions', description: 'Browse thousands of live and upcoming lots' },
  { number: '02', text: 'Place Your Bids', description: 'Bid in real-time with instant notifications' },
  { number: '03', text: 'Win & Pay Securely', description: 'Escrow-protected payments for peace of mind' },
];

const benefits: string[] = [
  'Browse live and upcoming auctions across multiple categories',
  'Bid or sell with confidence in real time',
  'Secure great deals with escrow-protected payments',
];

export default function JoinAuctionsCTA() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-16 bg-primary/[0.03] -mx-4 sm:-mx-0">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left — Content */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-2">Get Started</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                Join live auctions in{' '}
                <span className="text-primary">three easy steps</span>
              </h2>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-tertiary group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>

            <Button
              size="xl"
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-8 shadow-md shadow-primary/20 hover:bg-primary-1 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group/btn"
            >
              Start Bidding
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>

          {/* Right — Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card soft-border hover-card-accent transition-all duration-300"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-extrabold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{step.text}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}