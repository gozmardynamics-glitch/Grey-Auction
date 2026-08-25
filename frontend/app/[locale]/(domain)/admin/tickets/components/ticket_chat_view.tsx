'use client';

import { useState } from 'react';
import { MoreVertical, Plus, Send } from 'lucide-react';
import { Button, Input, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Ticket } from '../../models';
import Image from 'next/image';
import { ADMIN_USER_ID } from '../../models/data';

interface TicketChatViewProps {
  ticket: Ticket;
  onOpenContactInfo: () => void;
  onImageClick: (imageUrl: string) => void;
}

export default function TicketChatView({
  ticket,
  onOpenContactInfo,
  onImageClick,
}: TicketChatViewProps) {
  const [messageInput, setMessageInput] = useState('');

  const handleSend = () => {
    if (!messageInput.trim()) return;
    
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = ticket.contact.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {initials}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{ticket.contact.name}</span>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
              Seller ID: {ticket.contact.sellerId}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onOpenContactInfo}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4 bg-background">
        <div className="space-y-4">
          {ticket.messages.map((message) => {
            const isOwn = message.senderId === ADMIN_USER_ID;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                {/* User avatar */}
                {!isOwn && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {initials}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[60%] space-y-1',
                    isOwn ? 'items-end' : 'items-start'
                  )}
                >
                  {message.type === 'text' && (
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm',
                        isOwn
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm bg-muted text-foreground'
                      )}
                    >
                      {message.content}
                    </div>
                  )}

                  {message.type === 'image' && message.imageUrl && (
                    <Button
                      variant="ghost"
                      onClick={() => onImageClick(message.imageUrl!)}
                      className="overflow-hidden relative rounded-2xl p-0 h-auto"
                    >
                      <Image
                        src={message.imageUrl}
                        alt="Shared image"
                        fill
                        className="max-h-[200px] w-[300px] rounded-2xl object-cover transition-opacity hover:opacity-90"
                      />
                    </Button>
                  )}

                  <p
                    className={cn(
                      'text-[11px] text-muted-foreground',
                      isOwn ? 'text-right' : 'text-left'
                    )}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-background"
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={handleSend}
          disabled={!messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
