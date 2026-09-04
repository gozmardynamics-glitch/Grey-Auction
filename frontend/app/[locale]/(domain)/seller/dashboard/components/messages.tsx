'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/shared/components/common';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Message {
  id: string;
  senderName: string;
  senderAvatar?: string;
  preview: string;
  timestamp: string;
  unreadCount?: number;
}

interface MessagesProps {
  messages?: Message[];
}

const defaultMessages: Message[] = [];

export default function Messages({ messages = defaultMessages }: MessagesProps) {
  const t = useTranslations('seller.home');
  return (
    <Card className="">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t('messages')}</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-10 w-10" />}
            title={t('noMessagesTitle')}
            description={t('noMessagesDescription')}
            className="py-8"
          />
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                {/* Avatar */}
                <Avatar>
                  <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{message.senderName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {message.preview}
                  </p>
                </div>

                {/* Timestamp + Badge */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </span>
                  {message.unreadCount && message.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {message.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}