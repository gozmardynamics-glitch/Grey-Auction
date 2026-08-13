'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/shared/components/common';
import { Heart, ChevronLeft, ChevronRight, Maximize2, Grid3X3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';
import { toast } from 'sonner';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  auctionId?: string;
}

export default function ImageGallery({ images, title, auctionId }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = auctionId ? wishlistItems.includes(auctionId) : false;

  const handlePrev = useCallback(() => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleWishlist = useCallback(() => {
    if (auctionId) {
      dispatch(toggleWishlist(auctionId));
      toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
        icon: <Heart className={`h-4 w-4 ${isWishlisted ? 'text-muted-foreground' : 'fill-red-500 text-red-500'}`} />,
      });
    }
  }, [auctionId, dispatch, isWishlisted]);

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-muted sm:h-[450px] group">
        <Image
          src={images[selectedImage]}
          alt={title || 'Auction item'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Image counter badge (top-left) */}
        <div className="absolute left-3 top-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
          {selectedImage + 1} / {images.length}
        </div>

        {/* Favorite + Fullscreen buttons (top-right) */}
        <div className="absolute right-3 top-3 flex gap-2">
          {auctionId && (
            <Button
              onClick={handleWishlist}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110"
          >
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* "View all images" button (bottom center) */}
        <button
          onClick={() => setShowAllImages(!showAllImages)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-foreground shadow-md transition-all hover:bg-background hover:scale-105"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          View all {images.length} images
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20 ${
              selectedImage === idx
                ? 'border-primary shadow-md scale-105'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
