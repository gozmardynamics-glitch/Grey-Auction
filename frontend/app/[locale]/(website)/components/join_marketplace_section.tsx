'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { Button, Card } from '@/shared/components/common';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { CountdownTimer } from '../../../../shared/components/common/countdown_timer';

const benefits = [
  'Access exclusive items and deals',
  'Bid or sell with confidence in real time',
  'Secure great deals safely',
];

export default function JoinMarketplace() {
  const router = useRouter();
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  }, []);
  const timeRemaining = useCountdown(targetDate);

  return (
    <section className="bg-background">
      <div className="bg-primary rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Side - Content */}
          <div className="p-8 md:ml-16 md:p-12 max-w-xl lg:p-16 flex flex-col justify-center">
            {/* Heading */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-8 leading-tight">
              Join the Auction Marketplace Today
            </h2>

            {/* Benefits List */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    <BadgeCheck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-primary-foreground text-base md:text-lg">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="xl"
                className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-semibold px-8"
              >
                Start Bidding
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm font-semibold px-8"
                onClick={() => router.push('/seller')}
              >
                Become a Seller
              </Button>
            </div>
          </div>

          {/* Right Side - Image Card with Countdown */}
          <div className="relative flex items-center justify-center p-8 lg:p-12">
            <Card className="relative w-full max-w-full md:max-w-[80%] bg-linear-to-br from-gray-900 to-gray-800 border-0 overflow-hidden rounded-xl">
              {/* Car Image */}
              <div className="relative h-[250px] md:h-[350px] lg:h-[400px]">
                <Image
                  src="/car.svg"
                  alt="Luxury yellow sports car"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Countdown Timer Overlay */}
              <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6">
                {/* <div className="bg-white rounded-xl px-3 py-3 md:px-6 md:py-4 shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 md:gap-3 text-secondary-foreground">
                    <div className="text-center md:flex items-center gap-2">
                      <div className="text-lg md:text-3xl font-bold tabular-nums">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm mt-1">Days</div>
                    </div>

                    <div className="text-lg md:text-2xl font-bold">:</div>

                    <div className="text-center md:flex items-center gap-2">
                      <div className="text-lg md:text-3xl font-bold tabular-nums">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm mt-1">Hours</div>
                    </div>

                    <div className="text-lg md:text-2xl font-bold">:</div>

                    <div className="text-center md:flex items-center gap-2">
                      <div className="text-lg md:text-3xl font-bold tabular-nums">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm mt-1">Mins</div>
                    </div>

                    <div className="text-lg md:text-2xl font-bold">:</div>

                    <div className="text-center md:flex items-center gap-2">
                      <div className="text-lg md:text-3xl font-bold tabular-nums">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm mt-1">Secs</div>
                    </div>
                  </div>
                </div> */}
                <CountdownTimer
                  endTime={new Date(
                    Date.now() + 3 * 24 * 60 * 60 * 1000
                  ).toISOString()}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
