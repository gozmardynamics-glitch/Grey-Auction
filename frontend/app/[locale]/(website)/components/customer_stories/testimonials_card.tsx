// components/testimonial_card.tsx

import Image from 'next/image';
import { Card } from '@/shared/components/common';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  company: string;
  image: string;
}

export default function TestimonialCard({
  quote,
  name,
  role,
  company,
  image,
}: TestimonialCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl h-[450px] group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 text-primary-foreground">
        {/* Quote */}
        <p className="text-base md:text-lg mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>

        {/* Author Info */}
        <div>
          <h4 className="font-bold text-lg mb-1">{name}</h4>
          <p className="text-sm text-primary-foreground/80">
            {role}, {company}
          </p>
        </div>
      </div>
    </Card>
  );
}
