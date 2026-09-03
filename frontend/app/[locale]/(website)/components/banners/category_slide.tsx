import Image from 'next/image';
import { Button } from '@/shared/components/common';
import { HeroSlide } from '../../models';
const NairaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M4 7h11l-5 10H4" /><path d="M9 7l5 10h6" /><path d="M3 12h18" /><path d="M3 16h18" />
  </svg>
);

export function CategorySlide({
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
      <div className="relative z-10 h-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center px-4 sm:px-8 lg:px-12">
        {/* Left */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary-foreground">
            {slide.heading}
          </h1>

          {slide.startingBid != null && (
            <p className="text-lg text-primary-foreground flex items-center">
              Starting bid:{' '}
              <span className="flex items-center font-bold text-xl text-primary-foreground">
                <NairaIcon className="w-5 h-5" /> {slide.startingBid}
              </span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="xl" variant="default" onClick={onPrimary}>
              {slide.primaryCta}
            </Button>
            {slide.secondaryCta && (
              <Button
                size="xl"
                variant="outline"
                onClick={onSecondary}
                className="text-primary hover:bg-white/10"
              >
                {slide.secondaryCta}
              </Button>
            )}
          </div>
        </div>

        {/* Right - Thumbnails */}
        {slide.thumbnails && slide.thumbnails.length > 0 && (
          <div className="hidden lg:flex gap-4 justify-end items-end h-full pb-8 pr-8">
            {slide.thumbnails.map((src, i) => (
              <div
                key={i}
                className="relative w-72 h-72 rounded-xl overflow-hidden border-2 border-border bg-background/10"
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
