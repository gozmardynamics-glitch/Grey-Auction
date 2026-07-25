import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, DoorOpen } from 'lucide-react';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { BiddingRoom } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';
import Image from 'next/image';

interface BiddingRoomColumnActions {
  onEnterRoom?: (room: BiddingRoom) => void;
}

export const createColumns = (
  actions?: BiddingRoomColumnActions
): ColumnDef<BiddingRoom>[] => [
  {
    accessorKey: 'roomId',
    header: 'Room ID',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('roomId')}</span>
    ),
  },
  {
    accessorKey: 'roomName',
    header: 'Room Name',
    cell: ({ row }) => {
      const room = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-md bg-muted">
            <Image
              src={room.roomImage}
              alt={room.roomName}
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium">{room.roomName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'items',
    header: 'Items',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('items')}</span>
    ),
  },
  {
    accessorKey: 'bidders',
    header: 'Bidders',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('bidders')}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('date')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BiddingRoom['status'];
      return (
        <Badge
          variant="secondary"
          className={cn('font-medium', statusStyles[status])}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const room = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions?.onEnterRoom?.(room)}>
              <DoorOpen className="h-4 w-4" />
              Enter Room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
