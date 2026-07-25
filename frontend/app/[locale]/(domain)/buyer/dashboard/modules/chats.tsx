'use client';

import { useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { EmptyState, Input } from '@/shared/components/common';

import ChatConversationList from '../components/chat/chat_conversation_list';
import ChatView from '../components/chat/chat_view';
import {
  type ChatConversation,
  DUMMY_BUYER_CONVERSATIONS,
} from '../../models/chat';

export default function BuyerChatsModule() {
  const [conversations] = useState<ChatConversation[]>(
    DUMMY_BUYER_CONVERSATIONS
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => setSelectedConversation(null);

  return (
    <div className="flex h-full flex-col p-2">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="relative w-full sm:w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card h-9"
          />
        </div>
      </div>

      {/* Chat layout */}
      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="No Conversations"
          description="Your chat conversations with sellers will appear here."
        />
      ) : (
        <div className="flex flex-1 overflow-hidden border rounded-lg">
          {/* Left: Conversation list — hidden on mobile when a chat is selected */}
          <div
            className={`w-full sm:w-[260px] shrink-0 ${selectedConversation ? 'hidden sm:block' : 'block'}`}
          >
            <ChatConversationList
              conversations={filtered}
              selectedId={selectedConversation?.id ?? null}
              onSelect={setSelectedConversation}
            />
          </div>

          {/* Right: Chat or placeholder — full width on mobile when selected */}
          <div
            className={`flex-1 ${selectedConversation ? 'block' : 'hidden sm:block'}`}
          >
            {selectedConversation ? (
              <ChatView
                conversation={selectedConversation}
                onBack={handleBack}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
