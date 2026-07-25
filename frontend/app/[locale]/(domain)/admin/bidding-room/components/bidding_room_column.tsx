'use client';

import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { DoorOpen, MoreHorizontal } from 'lucide-react';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

import { BiddingRoom, BiddingRoomStatus } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';

interface ColumnCallbacks {
  onViewDetails: (room: BiddingRoom) => void;
  onEnterRoom?: (room: BiddingRoom) => void;
  onSuspend?: (room: BiddingRoom) => void;
  onActivate?: (room: BiddingRoom) => void;
  onDelete?: (room: BiddingRoom) => void;
}

export const Columns = ({
  onViewDetails,
  onEnterRoom,
  onSuspend,
  onActivate,
  onDelete,
}: ColumnCallbacks): ColumnDef<BiddingRoom>[] => [
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
    accessorKey: 'id',
    header: 'Room ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">
        {row.getValue('id')}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Room Name',
    meta:{sticky:true},
    cell: ({ row }) => {
      const room = row.original;
      return (
        <div className="flex items-center gap-2">
          {room.roomImage && (
            <div className="relative h-8 w-8">
              <Image
                src={room.roomImage}
                alt={room.name}
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <span className="font-medium truncate max-w-[180px]">
            {room.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
  },
  {
    accessorKey: 'auctions',
    header: 'Auctions',
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('auctions')}</span>
    ),
  },
  {
    accessorKey: 'bidders',
    header: 'Bidders',
    cell: ({ row }) => (
      <span className="text-center">{row.getValue('bidders')}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue('date')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BiddingRoomStatus;
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
      const room = row.original;
      const isActiveOrCompleted =
        room.status === 'Active' || room.status === 'Completed';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEnterRoom?.(room)}>
              <DoorOpen className="mr-2 h-4 w-4" />
              Enter Room
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(room)}>
              View details
            </DropdownMenuItem>
            {isActiveOrCompleted ? (
              <DropdownMenuItem onClick={() => onSuspend?.(room)}>
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onActivate?.(room)}>
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(room)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
