'use client';

import { useCallback, useEffect, useState } from 'react';
import { MoreVertical, Phone, Plus, Send, Video } from 'lucide-react';
import { Button, Input, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { Conversation } from '../../models';
import { apiFetch } from '@/shared/utils/api-client';
import Image from 'next/image';

interface ChatViewProps {
  conversation: Conversation;
  /** Signed-in account id — decides which bubbles are "mine". */
  currentUserId: string;
  onOpenContactInfo: () => void;
  onImageClick: (imageUrl: string) => void;
}

interface RawChatMessage {
  id: string;
  senderId: string;
  content: string | null;
  type: string;
  fileUrl?: string | null;
  createdAt: string;
}

const toMessage = (raw: RawChatMessage): Conversation['messages'][number] => ({
  id: raw.id,
  senderId: raw.senderId,
  content: raw.content ?? '',
  timestamp: raw.createdAt,
  type: raw.type === 'image' ? 'image' : 'text',
  imageUrl: raw.fileUrl ?? undefined,
});

export default function ChatView({
  conversation,
  currentUserId,
  onOpenContactInfo,
  onImageClick,
}: ChatViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Conversation['messages']>(
    conversation.messages ?? [],
  );

  // Load the thread for the selected conversation (newest last for display).
  useEffect(() => {
    let cancelled = false;
    setMessages(conversation.messages ?? []);
    apiFetch<{ data?: { messages?: RawChatMessage[] } }>(
      `conversations/${conversation.id}/messages`,
    )
      .then((json) => {
        if (cancelled) return;
        const rows = json?.data?.messages;
        if (Array.isArray(rows)) setMessages(rows.map(toMessage));
      })
      .catch(() => {
        /* keep whatever we have — an empty thread is not an error state */
      });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, conversation.messages]);

  const handleSend = useCallback(async () => {
    const content = messageInput.trim();
    if (!content) return;
    setMessageInput('');

    // Optimistic bubble, replaced by the server's row when it answers.
    const optimistic: Conversation['messages'][number] = {
      id: 'pending-' + Date.now(),
      senderId: currentUserId,
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const json = await apiFetch<{ data?: RawChatMessage }>(
        `conversations/${conversation.id}/messages`,
        { method: 'POST', body: { content } },
      );
      const saved = json?.data;
      if (saved) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? toMessage(saved) : m)),
        );
      }
    } catch {
      // Roll the bubble back rather than pretend it was delivered.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  }, [messageInput, conversation.id, currentUserId]);

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
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenContactInfo}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4 bg-background">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Buyer avatar */}
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
