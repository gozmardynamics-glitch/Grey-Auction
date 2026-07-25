import MessagesPanel from '../_islands/messages_panel';
import { getSellerConversations } from '@/lib/server/data';

export default async function MessagesPage() {
  const conversations = await getSellerConversations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <MessagesPanel conversations={conversations} />
    </div>
  );
}
