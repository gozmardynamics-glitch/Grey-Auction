'use client';

import { useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button, Card } from '@/shared/components/common';
import { BecomeSellerForm } from './become_seller_form';

export default function Hero() {
  const router = useRouter();
  const [isFormActive, setIsFormActive] = useState(false);

  const handleStartSelling = () => {
    setIsFormActive((prev) => !prev);
  };
  return (
    <section
      className="grid grid-cols-1 min-h-[60vh] items-center gap-12 lg:grid-cols-2 p-16"
      style={{
        backgroundImage: 'url(/banner_image.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Left - Hero Content */}
      <div>
        <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
          Turn Your Items Into Winning Bids
        </h1>

        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              Reach serious buyers ready to compete for your items.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              List once, let bidders drive the price up.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              Secure payouts and full transaction protection.
            </span>
          </div>
        </div>

        <div className="mb-10 flex items-center gap-4">
          <Button size="xl" onClick={handleStartSelling}>
            Start Selling
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={() => router.push('#how-it-works')}
            className="bg-card text-primary shadow-none"
          >
            How it Works
          </Button>
        </div>

        {/* Trust Badges */}
        <Card className="flex flex-col p-4 shadow-none border-none w-fit">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-background bg-blue-500" />
              <div className="h-8 w-8 rounded-full border-2 border-background bg-green-500" />
              <div className="h-8 w-8 rounded-full border-2 border-background bg-yellow-500" />
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-muted text-muted" />
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Trusted by thousands of sellers nationwide
          </p>
        </Card>
      </div>

      {/* Right - Stepper Form */}
      <div className="flex justify-center lg:justify-end">
        <BecomeSellerForm
          isActive={isFormActive}
          onActivate={() => setIsFormActive(true)}
        />
      </div>
    </section>
  );
}
