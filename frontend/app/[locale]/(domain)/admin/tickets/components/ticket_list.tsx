'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Ticket } from '../../models';

interface TicketListProps {
  tickets: Ticket[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (ticket: Ticket) => void;
}

export default function TicketList({
  tickets,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
}: TicketListProps) {
  const t = useTranslations('admin.tickets.list');
  const filtered = tickets.filter((ticket) =>
    ticket.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col border-r">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background h-9"
          />
        </div>
      </div>

      {/* Tickets */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5">
          {filtered.map((ticket) => (
            <Button
              variant="ghost"
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              className={cn(
                'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 h-auto rounded-none',
                selectedId === ticket.id && 'bg-muted'
              )}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {ticket.contact.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {ticket.contact.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ticket.lastMessageTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.lastMessage}
                  </p>
                  {ticket.unread && (
                    <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      1
                    </span>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
