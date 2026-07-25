'use client';

import { Button, EmptyState, ScrollArea } from '@/shared/components/common';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import type { ChatConversation } from '../../../models/chat';

interface ChatConversationListProps {
  conversations: ChatConversation[];
  selectedId: string | null;
  onSelect: (conversation: ChatConversation) => void;
}

export default function ChatConversationList({
  conversations,
  selectedId,
  onSelect,
}: ChatConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold">All Messages</h3>
      </div>

      <ScrollArea className="flex-1 pt-2">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-10 w-10" />}
            title="No Conversations"
            description="No conversations match your search."
            className="py-10"
          />
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conversation) => {
              const initials = conversation.contact.name
                .split(' ')
                .map((n) => n[0])
                .join('');

              return (
                <Button
                  variant="ghost"
                  key={conversation.id}
                  onClick={() => onSelect(conversation)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-t h-auto rounded-none',
                    selectedId === conversation.id && 'bg-muted'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {conversation.contact.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread && (
                        <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
