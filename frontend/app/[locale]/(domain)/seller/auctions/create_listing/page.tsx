'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAuctionMutation } from '@/redux/auctions/api/auctions.api';
import type { CreateAuctionData } from '@/redux/auctions/models';
import CreateListingStepper from './components/create_listing_stepper';
import AuctionDetailsForm from './components/auction_details_form';
import LotAndInventoryForm from './components/lots_and_inventory_form';
import PricingAndTermsForm from './components/pricing_and_terms_form';
import ReviewListing from './components/review_listing';
import { Separator } from '@/shared/components/common';
import { CreateListingFormData, DEFAULT_FORM_DATA } from '../../models';
import type { AuctionDetailsValues, LotAndInventoryValues, PricingAndTermsValues } from '../../models/schema';

export default function CreateListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateListingFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleAuctionDetailsNext = useCallback((data: AuctionDetailsValues) => {
    setFormData((prev) => ({ ...prev, auctionDetails: data }));
    setCurrentStep(2);
    scrollToTop();
  }, []);

  const handleLotNext = useCallback((data: LotAndInventoryValues) => {
    setFormData((prev) => ({ ...prev, lotAndInventory: data }));
    setCurrentStep(3);
    scrollToTop();
  }, []);

  const handlePricingNext = useCallback((data: PricingAndTermsValues) => {
    setFormData((prev) => ({ ...prev, pricingAndTerms: data }));
    setCurrentStep(4);
    scrollToTop();
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  }, []);

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
    scrollToTop();
  }, []);

  const [createAuction, { isLoading: isCreating }] = useCreateAuctionMutation();

  const handlePublish = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { auctionDetails, pricingAndTerms, lotAndInventory } = formData;

      // Calculate end time from auction duration
      const durationMap: Record<string, number> = {
        '1 day': 1, '3 days': 3, '7 days': 7, '14 days': 14,
        '27 days': 27, '1 month': 30, '2 months': 60, '3 months': 90,
      };
      const days = durationMap[pricingAndTerms.auctionDuration] || 7;
      const endTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      // Map form images to File[] (imagePreviews are data URLs, skip for now)
      const imageFiles: File[] = [];

      const auctionData: CreateAuctionData = {
        title: auctionDetails.productName,
        description: auctionDetails.description,
        startingBid: parseFloat(pricingAndTerms.startingPrice) || 0,
        endTime,
        category: auctionDetails.category,
        images: imageFiles,
      };

      await createAuction(auctionData).unwrap();

      setFormData(DEFAULT_FORM_DATA);
      setCurrentStep(1);
      router.push('/seller/auctions');
    } catch (err) {
      setError('Failed to publish listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createAuction, router]);

  return (
    <div className="space-y-8 ">
      <h1 className="text-2xl font-bold">Create Listing</h1>

      <div className="mt-8 bg-card p-4 space-y-8">
        <CreateListingStepper currentStep={currentStep} />
        <Separator />
        {currentStep === 1 && (
          <AuctionDetailsForm
            defaultValues={formData.auctionDetails}
            onNext={handleAuctionDetailsNext}
          />
        )}

        {currentStep === 2 && (
          <LotAndInventoryForm
            defaultValues={formData.lotAndInventory}
            onNext={handleLotNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <PricingAndTermsForm
            defaultValues={formData.pricingAndTerms}
            onNext={handlePricingNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <ReviewListing
            data={formData}
            onEdit={handleEditStep}
            onBack={handleBack}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
          />
        )}

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
