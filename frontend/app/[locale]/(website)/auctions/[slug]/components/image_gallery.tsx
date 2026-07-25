'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/shared/components/common';

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div>
      <div className="relative mb-4 h-[250px] w-full overflow-hidden rounded-xl bg-muted sm:h-[400px]">
        <Image
          src={images[selectedImage]}
          alt="Auction item"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <Button
          variant="default"
          size="sm"
          className="absolute bg-foreground text-background rounded-full bottom-4 right-4 gap-1.5 text-xs"
        >
          View All Images
        </Button>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <Button
            key={idx}
            variant="ghost"
            onClick={() => setSelectedImage(idx)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all p-0 sm:h-32 sm:w-auto sm:flex-1 ${
              selectedImage === idx
                ? 'border-primary'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 64px, 96px"
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
