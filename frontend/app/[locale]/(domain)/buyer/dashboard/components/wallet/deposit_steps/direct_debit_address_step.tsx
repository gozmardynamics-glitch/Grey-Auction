'use client';

import { useState } from 'react';

import {
  Button,
  DialogDescription,
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

const STATES = ['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Enugu'];
const CITIES: Record<string, string[]> = {
  Lagos: ['Lekki', 'Ikeja', 'Victoria Island', 'Surulere', 'Yaba'],
  Abuja: ['Garki', 'Wuse', 'Maitama', 'Asokoro'],
  Rivers: ['Port Harcourt', 'Obio-Akpor'],
  Oyo: ['Ibadan', 'Ogbomosho'],
  Kano: ['Kano Municipal', 'Nassarawa'],
  Enugu: ['Enugu', 'Nsukka'],
};

interface DirectDebitAddressStepProps {
  onNext: () => void;
  onCancel: () => void;
}

export default function DirectDebitAddressStep({
  onNext,
  onCancel,
}: DirectDebitAddressStepProps) {
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const canContinue = address.trim() !== '' && state !== '' && city !== '';

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>Enter Address</DialogTitle>
        <DialogDescription>
          Your account has been added for deposits. Kindly enter your home
          address to complete setup.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Residential Address</Label>
          <Input
            placeholder="Enter your address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <Select
            value={state}
            onValueChange={(val) => {
              setState(val);
              setCity('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Select value={city} onValueChange={setCity} disabled={!state}>
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {(CITIES[state] || []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!canContinue} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
