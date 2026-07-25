'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Plus,
  Send,
  Video,
} from 'lucide-react';
import { Button, Input, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import type { ChatConversation } from '../../../models/chat';
import { CURRENT_BUYER_ID } from '../../../models/chat';

interface ChatViewProps {
  conversation: ChatConversation;
  onBack?: () => void;
}

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const [messageInput, setMessageInput] = useState('');

  const handleSend = () => {
    if (!messageInput.trim()) return;
    console.log('Sending:', messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = conversation.contact.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-2 w-full bg-background">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:hidden"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {initials}
          </div>
          <span className="text-sm font-semibold">
            {conversation.contact.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation.messages.map((message) => {
            const isOwn = message.senderId === CURRENT_BUYER_ID;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                {!isOwn && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {initials}
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[60%] space-y-1',
                    isOwn ? 'items-end' : 'items-start'
                  )}
                >
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
      <div className="flex items-center gap-2 px-4 py-3">
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
