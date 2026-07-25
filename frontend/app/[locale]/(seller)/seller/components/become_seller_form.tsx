'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '@/shared/components/common';

import type {
  BecomeSellerFormData,
  PersonalDetailsValues,
  BusinessDetailsValues,
  AuctionDetailsValues,
} from '../models/schema';
import PersonalDetailsStep from '../steps/personal_details_step';
import BusinessDetailsStep from '../steps/business_details_step';
import AuctionDetailsStep from '../steps/auction_details_step';

const STEPS = [
  'Personal Details',
  'Business Details',
  'Auction Details',
] as const;

const DEFAULT_FORM_DATA: BecomeSellerFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  company: '',
  registrationNumber: '',
  postalCode: '',
  category: '',
  numberOfItems: '',
  estimatedValue: '',
};

interface BecomeSellerFormProps {
  isActive?: boolean;
  onActivate?: () => void;
}

export const BecomeSellerForm: React.FC<BecomeSellerFormProps> = ({
  isActive,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] =
    useState<BecomeSellerFormData>(DEFAULT_FORM_DATA);

  const handlePersonalDetails = (data: PersonalDetailsValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleBusinessDetails = (data: BusinessDetailsValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleAuctionDetails = (data: AuctionDetailsValues) => {
    const finalData = { ...formData, ...data };
    // TODO: handle form submission
    console.log('Form submitted:', finalData);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <Card
      className={`w-full rounded-2xl border-primary/20 bg-card p-6 shadow-lg lg:p-8 ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-border'}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Become a Seller</h2>
          <p className="text-sm text-muted-foreground">
            Do you have items & goods to sell?
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Avg. Response time: 24 hrs
          </span>
        </div>
      </div>

      {/* Step Indicator */}
      <Card className="mb-6 flex items-center border justify-between rounded-xl  px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {currentStep + 1}
          </span>
          <span className="text-sm font-medium text-foreground">
            {STEPS[currentStep]}
          </span>
        </div>
        <span className="text-sm font-semibold text-primary border-2 border-primary/20 rounded-full p-1">
          {currentStep + 1}/{STEPS.length}
        </span>
      </Card>

      {/* Steps */}
      {currentStep === 0 && (
        <PersonalDetailsStep
          defaultValues={{
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
          }}
          onNext={handlePersonalDetails}
        />
      )}

      {currentStep === 1 && (
        <BusinessDetailsStep
          defaultValues={{
            company: formData.company,
            registrationNumber: formData.registrationNumber,
            postalCode: formData.postalCode,
          }}
          onNext={handleBusinessDetails}
          onBack={handleBack}
        />
      )}

      {currentStep === 2 && (
        <AuctionDetailsStep
          defaultValues={{
            category: formData.category,
            numberOfItems: formData.numberOfItems,
            estimatedValue: formData.estimatedValue,
          }}
          onSubmit={handleAuctionDetails}
          onBack={handleBack}
        />
      )}
    </Card>
  );
};
