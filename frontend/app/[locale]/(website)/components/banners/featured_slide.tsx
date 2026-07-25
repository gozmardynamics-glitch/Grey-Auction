import Image from 'next/image';
import { Button } from '@/shared/components/common';
import { HeroSlide } from '../../models';
import { CountdownTimer } from '../../../../../shared/components/common/countdown_timer';

export function FeaturedSlide({
  slide,
  onPrimary,
  isFirstSlide,
}: {
  slide: HeroSlide;
  onPrimary: () => void;
  isFirstSlide?: boolean;
}) {
  return (
    <div
      className="relative h-[500px] rounded-xl overflow-hidden"
      style={{ minHeight: '400px' }}
    >
      <Image
        src={slide.backgroundImage}
        alt={slide.heading}
        fill
        className="object-cover"
        sizes="100vw"
        priority={isFirstSlide}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-8 lg:px-12 max-w-4xl space-y-6">
        {/* Current Bid */}
        {slide.currentBid != null && (
          <div>
            <p className="text-sm text-primary-foreground/70 uppercase tracking-wide">
              Current Bid:
            </p>
            <p className="text-3xl md:text-4xl font-bold text-primary-foreground">
              {slide.currentBid}
            </p>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary-foreground">
          {slide.heading}
        </h1>

        {/* Countdown */}
        {slide.endTime && <CountdownTimer endTime={slide.endTime} />}

        <div>
          <Button size="xl" variant="default" onClick={onPrimary}>
            {slide.primaryCta}
          </Button>
        </div>
      </div>
    </div>
  );
}
