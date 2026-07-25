import { MessageSquare } from 'lucide-react';
import { Badge, EmptyState } from '@/shared/components/common';
import { messages } from '../../models/data';

export default function BuyerMessagesModule() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Messages</h3>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10" />}
          title="No Messages"
          description="Your messages from sellers and support will appear here."
        />
      ) : (
        <div className="rounded-lg border divide-y">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-4 px-4 py-4 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {msg.from[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${msg.unread ? 'font-semibold' : 'font-medium'}`}
                    >
                      {msg.from}
                    </span>
                    {msg.unread && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {msg.date} - {msg.time}
                  </span>
                </div>
                <p
                  className={`text-sm ${msg.unread ? 'font-medium' : 'text-muted-foreground'}`}
                >
                  {msg.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {msg.preview}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
