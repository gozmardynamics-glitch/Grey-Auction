'use client';

import { Mail, Phone, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Ticket } from '../../models';
import Image from 'next/image';

interface TicketContactPanelProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onImageClick: (imageUrl: string) => void;
}

export default function TicketContactPanel({
  ticket,
  open,
  onClose,
  onImageClick,
}: TicketContactPanelProps) {
  const t = useTranslations('admin.tickets.contact');
  if (!ticket) return null;

  const { contact, sharedMedia } = ticket;
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden border-l transition-all duration-300 ease-in-out',
        open ? 'w-[280px]' : 'w-0 border-l-0'
      )}
    >
      <div className="flex h-full w-[280px] flex-col">
        {/* Close button */}
        <div className="flex items-center justify-end px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-4 pb-4">
            {/* Avatar + Name + Seller ID */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                {initials}
              </div>
              <h3 className="text-lg font-semibold">{contact.name}</h3>
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                {t('sellerId', { id: contact.sellerId })}
              </span>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contact.email}</span>
              </div>
            </div>

            {/* Shared media */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t('media')}</h4>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs font-medium text-primary hover:underline"
                >
                  {t('viewAll')}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {sharedMedia.slice(0, 8).map((url, i) => (
                  <Button
                    variant="ghost"
                    key={i}
                    onClick={() => onImageClick(url)}
                    className="aspect-square overflow-hidden rounded-md bg-muted p-0 h-auto"
                  >
                    <Image
                      src={url}
                      alt={t('mediaAlt', { index: i + 1 })}
                      className="h-full w-full object-cover transition-opacity hover:opacity-80"
                      width={40}
                      height={40}
                    />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
