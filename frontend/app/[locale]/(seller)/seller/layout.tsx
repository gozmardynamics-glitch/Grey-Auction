'use client';

import SellerHeader from '@/components/layouts/website/seller-header';
import Footer from '@/components/layouts/website/footer';
import { useLayoutPadding } from '@/hooks/use-layout-padding';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sellerPaddingTop } = useLayoutPadding();

  return (
    <div className="mx-auto max-w-[96%]">
      <SellerHeader />
      <main className={`relative ${sellerPaddingTop}`}>{children}</main>
      <div className="mt-4">
        <Footer />
      </div>
    </div>
  );
}
