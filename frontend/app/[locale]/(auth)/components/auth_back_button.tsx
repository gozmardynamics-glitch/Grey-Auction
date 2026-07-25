'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/shared/components/common';

const AuthBackButton = () => {
  const router = useRouter();

  return (
    <div>
      <Button
        variant="link"
        size="xl"
        className="text-primary-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft />
        Back
      </Button>
    </div>
  );
};

export default AuthBackButton;
