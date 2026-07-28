'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SharedImageGalleryProps {
  images: string[];
}

export function SharedImageGallery({ images }: SharedImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fading, setFading] = useState(false);

  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      setFading(true);
      setTimeout(() => {
        setSelectedIndex(index);
        setFading(false);
      }, 150);
    },
    [selectedIndex]
  );

  const openLightbox = useCallback(() => {
    if (hasMultiple) setLightboxOpen(true);
  }, [hasMultiple]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, closeLightbox, goToPrev, goToNext]);

  if (!hasImages) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div>
        <div
          className={`relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-muted ${hasMultiple ? 'cursor-pointer' : ''}`}
          onClick={openLightbox}
        >
          <Image
            src={images[selectedIndex]}
            alt={`Auction item ${selectedIndex + 1}`}
            fill
            className={`object-cover transition-opacity duration-150 ${fading ? 'opacity-50' : 'opacity-100'}`}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {hasMultiple && (
            <button className="absolute bottom-4 right-4 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/90 transition-colors">
              View All Images
            </button>
          )}
        </div>

        {hasMultiple && (
          <div className="flex w-full gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all md:h-20 md:w-full ${
                  selectedIndex === idx
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
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white tabular-nums">
            {selectedIndex + 1} / {images.length}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div
            className="relative w-full max-w-5xl aspect-video mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`Auction item ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </>
  );
}
