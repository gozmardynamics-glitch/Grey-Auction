'use client';

import { useAppSelector } from '@/redux/store';
import { MyDisputes } from '@/shared/components/trust';

/** Buyer dashboard "Disputes" module (L4 trust & safety). */
export default function BuyerDisputesModule() {
  const token = useAppSelector((state) => state.auth.token);
  return <MyDisputes token={token ?? undefined} />;
}
