// components/join_auctions_cta.tsx

import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/common';

interface Step {
  number: string;
  text: string;
  position: {
    top: string;
    left: string;
  };
}

const steps: Step[] = [
  {
    number: '1',
    text: 'Explore Auctions',
    position: { top: '52%', left: '10%' },
  },
  {
    number: '2',
    text: 'Place Your Bids',
    position: { top: '68%', left: '5%' },
  },
  {
    number: '3',
    text: 'Win & Pay Securely',
    position: { top: '84%', left: '10%' },
  },
];

const benefits: string[] = [
  'Browse live and upcoming auctions across multiple categories and find items that match your interest',
  'Bid or sell with confidence in real time',
  'Secure great deals safely',
];

export default function JoinAuctionsCTA() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-16 bg-secondary/20 -mx-4 sm:-mx-0">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8 flex flex-col justify-between">
            {/* Heading */}
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold text-foreground leading-tight">
              Join live auctions in three easy steps
            </h2>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-[#6B7280]" />
                  </div>
                  <p className="text-foreground text-base md:text-xl leading-relaxed">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div>
              <Button
                variant="secondary"
                size="xl"
                className="text-primary-foreground rounded-md text-lg"
              >
                Create an Account
              </Button>
            </div>
          </div>

          {/* Right Side - Image with Steps Overlay */}
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl">
              {/* Background Image */}
              <Image
                src="/car.svg"
                alt="Luxury yellow sports car"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

              {/* Steps Overlay - Individual positioning */}
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="absolute flex items-center gap-3 md:gap-4 w-52 md:w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg md:rounded-xl px-3 py-2.5 md:px-5 md:py-4 hover:bg-white/20 transition-all"
                  style={{
                    top: step.position.top,
                    left: step.position.left,
                  }}
                >
                  {/* Step Number */}
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F8BD00] flex items-center justify-center text-gray-900 font-bold text-sm md:text-lg shrink-0 shadow-lg">
                    {step.number}
                  </div>
                  {/* Step Text */}
                  <span className="text-primary-foreground font-semibold text-sm md:text-base">
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
