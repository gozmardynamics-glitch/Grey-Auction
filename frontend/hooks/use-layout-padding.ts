'use client';

import { usePathname } from 'next/navigation';

export function useLayoutPadding() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isSellerPage = pathname === '/seller';

  return {
    isHomePage,
    paddingTop: isHomePage ? 'pt-28' : 'pt-48',
    sellerPaddingTop: isSellerPage ? 'pt-28' : 'pt-48',
    showBreadcrumb: !isHomePage,
  };
}
