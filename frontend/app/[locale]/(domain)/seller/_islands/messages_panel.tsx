'use client';

import { useState } from 'react';
import { Card, Input } from '@/shared/components/common';
import { Search } from 'lucide-react';
import MessagesEmptyState from '../messages/components/message_empty_state';
import ConversationList from '../messages/components/conversation_list';
import ChatView from '../messages/components/chat_view';
import ContactInfoPanel from '../messages/components/contact_info_sheet';
import ImageLightbox from '../messages/components/image_lightbox';
import { Conversation } from '../models';

interface MessagesPanelProps {
  conversations: Conversation[];
}

export default function MessagesPanel({ conversations }: MessagesPanelProps) {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
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

  const isEmpty = conversations.length === 0;

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
          <MessagesEmptyState />
        </Card>
      ) : (
        /* Conversation View */
        <Card className="flex h-[700px] overflow-hidden bg-card">
          {/* Left: Conversation list */}
          <div className="w-[280px] shrink-0">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id ?? null}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelect={setSelectedConversation}
            />
          </div>

          {/* Center: Chat or placeholder */}
          <div className="flex-1 min-w-0">
            {selectedConversation ? (
              <ChatView
                conversation={selectedConversation}
                onOpenContactInfo={() => setContactPanelOpen(true)}
                onImageClick={handleImageClick}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>

          {/* Right: Contact info panel (inline) */}
          <ContactInfoPanel
            conversation={selectedConversation}
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
