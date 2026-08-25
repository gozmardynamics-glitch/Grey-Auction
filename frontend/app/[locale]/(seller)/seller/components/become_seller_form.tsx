'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Building2, UserRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/redux/store';

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
  addressLine1: '',
  city: '',
  state: '',
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
  const router = useRouter();
  const authToken = useAppSelector((state) => state.auth.token);
  const [currentStep, setCurrentStep] = useState(0);
  const [sellerType, setSellerType] = useState<'individual' | 'organization'>(
    'individual'
  );
  const [formData, setFormData] =
    useState<BecomeSellerFormData>(DEFAULT_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePersonalDetails = (data: PersonalDetailsValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleBusinessDetails = (data: BusinessDetailsValues) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleAuctionDetails = async (data: AuctionDetailsValues) => {
    const finalData = { ...formData, ...data };

    // The seller profile endpoint requires an authenticated account
    if (!authToken) {
      toast.error('Please create a seller account first');
      router.push('/auth/seller/register');
      return;
    }

    // Build a payload that matches the backend RegisterSellerDto
    const payload = {
      business_name: finalData.company || finalData.fullName,
      business_type: sellerType === 'organization' ? 'LLC' : 'INDIVIDUAL',
      business_registration_number: finalData.registrationNumber || undefined,
      email: finalData.email,
      phone: finalData.phoneNumber,
      address_line1: finalData.addressLine1,
      city: finalData.city,
      state: finalData.state,
      postal_code: finalData.postalCode,
      country: 'NG',
      contact_person: finalData.fullName,
    };

    setSubmitting(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(apiBase + '/sellers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.message || 'Registration failed. Please try again.');
        return;
      }

      toast.success('Seller profile created — pending verification');
      setSubmitted(true);
    } catch {
      toast.error('Network error — is the API running on port 3001?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Seller type selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSellerType('individual')}
          className={cn(
            'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
            sellerType === 'individual'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent'
          )}
        >
          <UserRound
            className={cn(
              'mt-0.5 h-5 w-5',
              sellerType === 'individual' ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Individual / Business
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Register as a personal seller or small business.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSellerType('organization')}
          className={cn(
            'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
            sellerType === 'organization'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent'
          )}
        >
          <Building2
            className={cn(
              'mt-0.5 h-5 w-5',
              sellerType === 'organization'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Organization / Government / Embassy
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              For agencies, companies, firms, government bodies, embassies & NGOs.
            </span>
          </span>
        </button>
      </div>

      {sellerType === 'organization' && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Registering an organization?
            </p>
            <p className="text-xs text-muted-foreground">
              Use our dedicated organization registration form for a smoother
              setup.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-primary hover:bg-primary-2"
            onClick={() => router.push('/auth/organization/register')}
          >
            Use the Organization registration form
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
            addressLine1: formData.addressLine1,
            city: formData.city,
            state: formData.state,
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

      {submitted && (
        <Card className="w-full rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="text-xl font-bold text-foreground">
              Application received
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Thank you, {formData.fullName || 'seller'}. Our team will verify
              your details and contact you shortly. Once approved you can start
              listing items for auction.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => router.push('/seller/dashboard')}
            >
              Go to seller dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
