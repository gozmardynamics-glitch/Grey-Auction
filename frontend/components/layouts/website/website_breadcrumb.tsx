'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/common';

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/auctions': 'Auctions',
  '/auth': 'Authentication',
  '/auth/login': 'Sign In',
  '/auth/login/create': 'Create Account',
  '/auth/login/forgot_password': 'Forgot Password',
  '/auth/login/forgot_password/reset_password': 'Reset Password',
  '/auth/seller': 'Seller',
  '/auth/seller/register': 'Seller Register',
  '/auth/seller/register/otp': 'OTP Verification',
  '/auth/seller/register/otp/complete_profile': 'Complete Profile',
  '/auth/seller/register/otp/complete_profile/verify': 'Verification',
  '/auth/seller/register/otp/complete_profile/verify/select_plan':
    'Select Plan',
  '/buyer': 'My Account',
  '/auth/buyer': 'My Account',
  '/auth/buyer/register': 'Register',
  '/auth/buyer/register/otp': 'OTP Verification',
  '/auth/buyer/register/otp/complete_profile': 'Complete Profile',
  '/categories': 'Categories',
  '/art': 'Art',
  '/construction': 'Construction',
  '/electronics': 'Electronics',
  '/fashion': 'Fashion',
  '/transport': 'Transport',
  '/agriculture': 'Agriculture',
};

// Query params that should appear as breadcrumb segments
const queryParamLabels: Record<string, string> = {
  category: 'Category',
  subcategory: 'Subcategory',
  brand: 'Brand',
  country: 'Country',
  search: 'Search',
};

export default function WebsiteBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { href: string; label: string }[] = [
      { href: '/', label: 'Home' },
    ];

    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label =
        routeNames[currentPath] ||
        segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      breadcrumbs.push({ href: currentPath, label });
    });

    // Append relevant query params as breadcrumb segments
    for (const [key, value] of searchParams.entries()) {
      if (queryParamLabels[key] && value) {
        const label = value
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        breadcrumbs.push({
          href: `${pathname}?${key}=${value}`,
          label,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="bg-background border-none">
      <div className="mx-auto max-w-[96%] py-4 border-none">
        <Breadcrumb className="border-none">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={`${breadcrumb.href}-${index}`}>
                <BreadcrumbItem>
                  {index === 0 ? (
                    <BreadcrumbLink
                      href={breadcrumb.href}
                      className="flex items-center gap-1"
                    >
                      <Home className="h-4 w-4" />
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  ) : index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
