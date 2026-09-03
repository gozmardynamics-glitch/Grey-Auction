import Image from 'next/image';
import { CheckCircle2, Hammer } from 'lucide-react';
import { Button, Card } from '@/shared/components/common';
import { HeroSlide, TrustBadge } from '../../models';
const NairaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M4 7h11l-5 10H4" /><path d="M9 7l5 10h6" /><path d="M3 12h18" /><path d="M3 16h18" />
  </svg>
);

const trustBadges: TrustBadge[] = [
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: 'Auction Excellence',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: 'No Hidden Fee',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: '24/7 Support',
  },
];

export function SplitSlide({
  slide,
  onPrimary,
  onSecondary,
  isFirstSlide,
}: {
  slide: HeroSlide;
  onPrimary: () => void;
  onSecondary: () => void;
  isFirstSlide?: boolean;
}) {
  return (
    <div
      className="relative grid grid-cols-1 h-[440px] lg:grid-cols-2 gap-6 lg:gap-10 items-center px-4 py-8 sm:p-8 lg:p-12 rounded-2xl overflow-hidden"
      style={{ minHeight: '380px' }}
    >
      <Image
        src={slide.backgroundImage}
        alt={slide.heading}
        fill
        className="object-cover"
        sizes="100vw"
        priority={isFirstSlide}
      />
      {/* Left Column */}
      <div className="relative z-10 space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
          {slide.heading}
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-foreground">
          {slide.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="xl" variant="default" onClick={onPrimary}>
            {slide.primaryCta}
          </Button>
          {slide.secondaryCta && (
            <Button
              size="xl"
              variant="outline"
              onClick={onSecondary}
              className="border-primary text-primary"
            >
              {slide.secondaryCta}
            </Button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-6 pt-4">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="text-green-600">{badge.icon}</div>
              <span className="font-medium text-foreground">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Product Card */}
      {slide.product && (
        <Card className="relative z-10 hidden p-0 border-none lg:block max-w-[90%] mx-auto">
          <div className="relative bg-background min-w-[400px] rounded-2xl shadow-xl overflow-hidden">
            <Image
              src={slide.product.image}
              alt={slide.product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0vw, 40vw"
            />
            <div className="relative min-h-[300px] lg:min-h-[400px]">
              <div className="p-6 space-y-4 text-secondary-foreground">
                <div>
                  <h3 className="text-2xl font-bold">{slide.product.title}</h3>
                  <p className="text-sm mt-1">{slide.product.specs}</p>
                </div>

                <div className="rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1">
                        Current bid:
                      </p>
                      <p className="text-2xl font-bold inline-flex items-center">
                        <NairaIcon className="w-5 h-5" /> {slide.product.currentBid}
                      </p>
                    </div>
                    <div className="bg-blue-600 rounded-full p-3">
                      <Hammer className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
