import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { Check, Eye, MoreHorizontal, ShieldOff, Trash2 } from 'lucide-react';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import { Category, CategoryStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

export const Columns = (
  onViewDetails: (category: Category) => void,
  onDelete: (category: Category) => void,
  onToggleStatus: (category: Category) => void
): ColumnDef<Category>[] => [
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
    accessorKey: 'category',
    header: 'Category',
    meta:{sticky:true},
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-3">
          {category.icon && (
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src={category.icon}
                alt={category.category}
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <span className="font-medium truncate max-w-[200px]">
            {category.category}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'parentCategory',
    header: 'Parent Category',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue('parentCategory')}
      </span>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug URL',
    cell: ({ row }) => (
      <span className="text-primary">{row.getValue('slug')}</span>
    ),
  },
  {
    accessorKey: 'listings',
    header: 'Listings',
    cell: ({ row }) => (
      <span>{row.getValue('listings')}</span>
    ),
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
      const status = row.getValue('status') as CategoryStatus;
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
      const category = row.original;
      const isActive = category.status === 'Active';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(category)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(category)}>
              {isActive ? (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
