'use client';

import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { Button, Separator } from '@/shared/components/common';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/common/card';
import { CreateListingFormData } from '../../../models';
import { formatCurrency2 } from '@/shared/utils/helpers';

interface ReviewListingProps {
  data: CreateListingFormData;
  onEdit: (step: number) => void;
  onBack: () => void;
  onPublish: () => void;
  isSubmitting?: boolean;
}

export default function ReviewListing({
  data,
  onEdit,
  onBack,
  onPublish,
  isSubmitting = false,
}: ReviewListingProps) {
  const { auctionDetails, lotAndInventory, pricingAndTerms } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        {/* Left column - Details */}
        <div className="space-y-6">
          {/* Auction Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Auction Details
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => onEdit(1)}
                className="p-0 h-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Edit <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <Separator className="mb-2 max-w-[95%] mx-auto" />
            <CardContent className="space-y-2 text-sm mt-4">
              <div>
                <span className="font-medium">Name:</span>{' '}
                {auctionDetails.productName || '—'}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                {auctionDetails.category || '—'}
              </div>
              <div>
                <span className="font-medium">Sub-Category:</span>{' '}
                {auctionDetails.subCategory || '—'}
              </div>
            </CardContent>
          </Card>

          {/* Lot & Inventory */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Lot & Inventory
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => onEdit(2)}
                className="p-0 h-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Edit <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <Separator className="mb-2 max-w-[95%] mx-auto" />

            <CardContent className="space-y-2 text-sm mt-4">
              <div>
                <span className="font-medium">Lot:</span>{' '}
                {lotAndInventory.lot || '—'}
              </div>
              <div>
                <span className="font-medium">Inventory:</span> Auto-set to{' '}
                {lotAndInventory.inventory}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Terms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Pricing & Terms
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => onEdit(3)}
                className="p-0 h-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Edit <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <Separator className="mb-2 max-w-[95%] mx-auto" />

            <CardContent className="text-sm mt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <span className="font-medium">Starting Price:</span>{' '}
                  {formatCurrency2(pricingAndTerms.startingPrice)}
                </div>
                <div>
                  <span className="font-medium">Bid Increment:</span>{' '}
                  {formatCurrency2(pricingAndTerms.bidIncrement)}
                </div>
                <div>
                  <span className="font-medium">Reserve Price:</span>{' '}
                  {pricingAndTerms.hasReservePrice ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Allow Buy Now:</span>{' '}
                  {pricingAndTerms.allowBuyNow ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Auction Duration:</span>{' '}
                  {pricingAndTerms.auctionDuration}
                </div>
                <div>
                  <span className="font-medium">Inspection Duration:</span>{' '}
                  {pricingAndTerms.allowInspection
                    ? pricingAndTerms.inspectionDuration
                    : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Product Images */}
        <div className="w-full lg:w-[320px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">
                Product Images
              </CardTitle>
              <Button
                variant="link"
                onClick={() => onEdit(2)}
                className="p-0 h-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Edit <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {lotAndInventory.imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  {/* Main image */}
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={lotAndInventory.imagePreviews[0]}
                      alt="Product main"
                      fill
                      className="object-cover"
                    />
                    {lotAndInventory.imagePreviews.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-primary-foreground">
                        {lotAndInventory.imagePreviews.length} images
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    No images uploaded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="xl" onClick={onBack} className="gap-2">
          ← Back
        </Button>
        <Button onClick={onPublish} size="xl" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
