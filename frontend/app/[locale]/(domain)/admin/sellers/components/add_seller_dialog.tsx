'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';

/** Mirrors SellerBusinessType in the backend seller entity. */
export const SELLER_BUSINESS_TYPES = [
  'INDIVIDUAL',
  'LLC',
  'CORPORATION',
  'AGENCY',
  'GOVERNMENT',
  'EMBASSY',
  'NGO',
  'PARTNERSHIP',
  'SOLE_PROPRIETORSHIP',
] as const;

export type SellerBusinessType = (typeof SELLER_BUSINESS_TYPES)[number];

export interface SellerRegistrationPayload {
  business_name: string;
  business_type: SellerBusinessType;
  email: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
}

interface AddSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SellerRegistrationPayload) => void;
}

const PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/;

export default function AddSellerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddSellerDialogProps) {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<SellerBusinessType | ''>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');

  const reset = () => {
    setBusinessName('');
    setBusinessType('');
    setEmail('');
    setPhone('');
    setAddressLine1('');
    setCity('');
    setStateName('');
    setCountry('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = () => {
    if (!businessType) return;
    onSubmit({
      business_name: businessName.trim(),
      business_type: businessType,
      email: email.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      city: city.trim(),
      state: stateName.trim(),
      country: country.trim().toUpperCase(),
    });
    handleOpenChange(false);
  };

  const isValid =
    businessName.trim().length >= 2 &&
    businessType &&
    email.trim() &&
    PHONE_PATTERN.test(phone.trim()) &&
    addressLine1.trim() &&
    city.trim() &&
    stateName.trim() &&
    country.trim().length === 2;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Seller
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Business Name</Label>
            <Input
              placeholder="Business or trading name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Business Type</Label>
            <Select
              value={businessType}
              onValueChange={(v) => setBusinessType(v as SellerBusinessType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {SELLER_BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Email Address</Label>
            <Input
              type="email"
              placeholder="seller@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Phone</Label>
            <Input
              type="tel"
              placeholder="+2348012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include the country code, e.g. +2348012345678.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Address Line 1</Label>
            <Input
              placeholder="Street address"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">City</Label>
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">State</Label>
              <Input
                placeholder="State"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Country Code</Label>
            <Input
              placeholder="NG"
              maxLength={2}
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">
              Two-letter ISO country code (e.g. NG).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!isValid} onClick={handleSubmit}>
              Add Seller
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
