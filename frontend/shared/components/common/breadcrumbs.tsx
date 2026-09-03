import Link from 'next/link';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb';

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const showEllipsis = items.length > 4;

  const visibleItems = showEllipsis
    ? [items[0], null as unknown as BreadcrumbItemData, items[items.length - 2], items[items.length - 1]]
    : items;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const content =
            item === null ? (
              <BreadcrumbItem key={`ellipsis-${index}`}>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
            ) : isLast || !item.href ? (
              <BreadcrumbItem key={`${item.label}-${index}`}>
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem key={`${item.label}-${index}`}>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            );

          return (
            <Fragment key={`crumb-${index}`}>
              {content}
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}