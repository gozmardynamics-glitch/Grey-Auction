'use client';

import { MessageCircle } from 'lucide-react';

export default function MessagesEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No messages yet</h3>
      <p className="max-w-[280px] text-sm text-muted-foreground">
        When buyers contact you about your listings, their messages will appear
        here.
      </p>
    </div>
  );
}