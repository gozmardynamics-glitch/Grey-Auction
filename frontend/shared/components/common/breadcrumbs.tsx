import Link from 'next/link';
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
          if (item === null) {
            return (
              <BreadcrumbItem key={`ellipsis-${index}`}>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
            );
          }

          const isLast = index === visibleItems.length - 1;

          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
