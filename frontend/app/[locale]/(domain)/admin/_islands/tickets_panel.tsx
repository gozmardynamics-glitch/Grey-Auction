'use client';

import { useState } from 'react';
import { Card, Input } from '@/shared/components/common';
import { Search } from 'lucide-react';
import TicketEmptyState from '../tickets/components/ticket_empty_state';
import TicketList from '../tickets/components/ticket_list';
import TicketChatView from '../tickets/components/ticket_chat_view';
import TicketContactPanel from '../tickets/components/ticket_contact_sheet';
import ImageLightbox from '../../seller/messages/components/image_lightbox';
import { Ticket } from '../models';

interface TicketsPanelProps {
  tickets: Ticket[];
}

export default function TicketsPanel({ tickets }: TicketsPanelProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Contact info panel
  const [contactPanelOpen, setContactPanelOpen] = useState(false);

  // Image lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  const isEmpty = tickets.length === 0;

  return (
    <>
      {isEmpty ? (
        /* Empty State */
        <Card className="flex h-[600px] items-center justify-center">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="mb-4 w-[200px] pl-9 bg-background h-9"
                disabled
              />
            </div>
          </div>
          <TicketEmptyState />
        </Card>
      ) : (
        /* Ticket View */
        <Card className="flex h-[700px] overflow-hidden bg-card">
          {/* Left: Ticket list */}
          <div className="w-[280px] shrink-0">
            <TicketList
              tickets={tickets}
              selectedId={selectedTicket?.id ?? null}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelect={setSelectedTicket}
            />
          </div>

          {/* Center: Chat or placeholder */}
          <div className="flex-1 min-w-0">
            {selectedTicket ? (
              <TicketChatView
                ticket={selectedTicket}
                onOpenContactInfo={() => setContactPanelOpen(true)}
                onImageClick={handleImageClick}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a ticket to view the conversation
                </p>
              </div>
            )}
          </div>

          {/* Right: Contact info panel (inline) */}
          <TicketContactPanel
            ticket={selectedTicket}
            open={contactPanelOpen}
            onClose={() => setContactPanelOpen(false)}
            onImageClick={handleImageClick}
          />
        </Card>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
