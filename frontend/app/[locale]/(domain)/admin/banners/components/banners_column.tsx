import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import { Banner, BannerStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

export const Columns = (
  onViewDetails: (banner: Banner) => void,
  onDelete: (banner: Banner) => void
): ColumnDef<Banner>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'image',
    header: 'image',
    meta:{sticky:true},
    cell: ({ row }) => {
      const banner = row.original;
      return (
        <div className="flex items-center gap-2">
          {banner.image && (
            <div className="relative h-8 w-24">
              <Image
                src={banner.image}
                alt={banner.title || 'Banner image'}
                fill
                className="rounded object-cover"
              />
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue('type')}</span>
    ),
  },
  {
    accessorKey: 'visibility',
    header: 'Visibility',
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Created',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue('createdAt')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BannerStatus;
      return (
        <Badge variant="outline" className={statusStyles[status]}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const banner = row.original;
      const isInactive = banner.status === 'Inactive';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(banner)}>
              View details
            </DropdownMenuItem>
            {isInactive ? (
              <DropdownMenuItem onClick={() => {}}>Enable</DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-destructive" onClick={() => {}}>
                Disable
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(banner)}
            >
              Delete banner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
