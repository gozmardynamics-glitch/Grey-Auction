import Image from 'next/image';
import { Button } from '@/shared/components/common';

interface LatestAuctionsBannerProps {
  badge?: string;
  title?: string;
  boldWords?: string[];
  ctaText?: string;
  ctaHref?: string;
  imageUrl?: string;
  className?: string;
}

export default function LatestAuctionsBanner({
  badge = 'Latest Auctions',
  title = 'Bid on Heavy-Duty Tractors for Transport & Logistics',
  boldWords = ['Tractors', 'Transport & Logistics'],
  ctaText = 'View More',
  ctaHref = '/auctions?category=transport',
  imageUrl = '/buggy.svg',
  className = '',
}: LatestAuctionsBannerProps) {
  // Bold specific words in the title
  const renderTitle = () => {
    // let result = title;
    const parts: { text: string; bold: boolean }[] = [];
    let remaining = title;

    boldWords.forEach((word) => {
      const idx = remaining.indexOf(word);
      if (idx !== -1) {
        if (idx > 0) {
          parts.push({ text: remaining.slice(0, idx), bold: false });
        }
        parts.push({ text: word, bold: true });
        remaining = remaining.slice(idx + word.length);
      }
    });
    if (remaining) {
      parts.push({ text: remaining, bold: false });
    }

    if (parts.length === 0) {
      return <span>{title}</span>;
    }

    return parts.map((part, i) =>
      part.bold ? (
        <span key={i} className="font-bold">
          {part.text}
        </span>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  return (
    <div
      className={`relative py-4 rounded-2xl bg-linear-to-t from-primary/90 mb-8 to-transparent p-2 ${className}`}
    >
      {/* Scattered decorative circles */}
      <div className="overflow-hidden rounded-2xl absolute inset-0">
        <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-primary-foreground/5" />
        <div className="absolute left-1/4 top-2 h-20 w-20 rounded-full bg-primary-foreground/5" />
        <div className="absolute left-1/2 top-6 h-20 w-20 rounded-full bg-primary-foreground/5" />

        <div className="absolute -bottom-14 left-[15%] h-36 w-36 rounded-full bg-primary-foreground/5" />
        <div className="absolute right-[35%] top--4 h-24 w-24 rounded-full bg-primary-foreground/5" />
        <div className="absolute -right-8 -bottom-12 h-40 w-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute right-[20%] top-1/2 h-16 w-16 rounded-full bg-primary-foreground/8" />
      </div>

      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
        {/* Text Content */}
        <div className="max-w-md space-y-4">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {badge}
          </span>
          <h2 className="text-lg leading-snug text-foreground md:text-2xl">
            {renderTitle()}
          </h2>
          <Button asChild variant="default" size="lg">
            <a href={ctaHref}>{ctaText}</a>
          </Button>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute right-0">
          <div className="relative h-[250px] w-[400px] ">
            <Image
              src={imageUrl}
              alt="Featured auction item"
              fill
              className="object-contain object-bottom"
              sizes="400px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
