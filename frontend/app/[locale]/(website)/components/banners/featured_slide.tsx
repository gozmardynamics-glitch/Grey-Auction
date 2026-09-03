import Image from 'next/image';
import { Button } from '@/shared/components/common';
import { HeroSlide } from '../../models';
import { CountdownTimer } from '../../../../../shared/components/common/countdown_timer';
import { ArrowRight } from 'lucide-react';

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
      className="relative h-[520px] md:h-[560px] rounded-2xl overflow-hidden"
      style={{ minHeight: '420px' }}
    >
      <Image
        src={slide.backgroundImage}
        alt={slide.heading}
        fill
        className="object-cover transition-transform duration-[8s] hover:scale-105"
        sizes="100vw"
        priority={isFirstSlide}
      />
      {/* Multi-layer overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-14 max-w-3xl space-y-6">
        {/* Current Bid */}
        {slide.currentBid != null && (
          <div className="animate-fade-in-up">
            <p className="text-xs text-white/60 uppercase tracking-[0.2em] font-medium mb-1">
              Current Bid
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {slide.currentBid}
            </p>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-white tracking-tight animate-fade-in-up stagger-1">
          {slide.heading}
        </h1>

        {/* Countdown */}
        {slide.endTime && (
          <div className="animate-fade-in-up stagger-2">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <CountdownTimer endTime={slide.endTime} size="lg" />
            </div>
          </div>
        )}

        <div className="animate-fade-in-up stagger-3">
          <Button
            size="xl"
            className="rounded-xl bg-gradient-to-r from-secondary to-amber-400 text-primary font-bold px-8 py-4 text-base shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group/btn"
            onClick={onPrimary}
          >
            {slide.primaryCta}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary/20 to-transparent" />
    </div>
  );
}