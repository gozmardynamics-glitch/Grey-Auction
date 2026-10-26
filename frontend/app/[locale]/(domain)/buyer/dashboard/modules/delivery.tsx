'use client';

import { AddressBook, RateEstimator } from '@/shared/components/shipping';

/** Buyer dashboard "Delivery" module (L5 shipping + escrow seams). */
export default function BuyerDeliveryModule() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-base font-semibold">Delivery &amp; shipping</h3>
        <p className="text-sm text-muted-foreground">
          Estimate delivery cost and manage the addresses we ship won lots to.
        </p>
      </div>
      <RateEstimator />
      <AddressBook />
    </div>
  );
}
