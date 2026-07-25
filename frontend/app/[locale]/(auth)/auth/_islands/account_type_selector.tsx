'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/shared/components/common';

type AccountType = 'buyer' | 'seller' | null;

export default function AccountTypeSelector() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AccountType>(null);

  const handleContinue = () => {
    if (!selectedType) {
      alert('Please select an account type');
      return;
    }

    router.push(`${selectedType}/register`);
  };

  return (
    <>
      {/* Account Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
        {/* Buyer Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
            selectedType === 'buyer'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedType('buyer')}
        >
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground">Buyer</h3>
            <p className="text-sm text-muted-foreground">
              Bid on and buy auction items
            </p>
          </div>
        </Card>

        {/* Seller Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
            selectedType === 'seller'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedType('seller')}
        >
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground">Seller</h3>
            <p className="text-sm text-muted-foreground">
              List items and run auctions
            </p>
          </div>
        </Card>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedType}
        size="lg"
        className="w-full h-14 bg-primary hover:bg-primary-2 text-primary-foreground font-semibold text-lg mb-6"
      >
        Continue
      </Button>
    </>
  );
}
