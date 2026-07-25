export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface ChatConversation {
  id: string;
  contact: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: ChatMessage[];
}

export const CURRENT_BUYER_ID = 'buyer-1';

export const DUMMY_BUYER_CONVERSATIONS: ChatConversation[] = Array.from(
  { length: 7 },
  (_, i) => ({
    id: `conv-${i + 1}`,
    contact: {
      name: 'Grey Auto',
      avatar: '',
    },
    lastMessage: 'I would like to make more in...',
    lastMessageTime:
      i < 2
        ? '2 mins'
        : i < 3
          ? '5 hours'
          : i < 4
            ? '7 hours'
            : i < 6
              ? 'Yesterday'
              : 'Jan 1',
    unread: i === 1 || i === 5,
    messages: [
      {
        id: `msg-${i}-1`,
        senderId: CURRENT_BUYER_ID,
        content:
          'I would like to make more inquiry about the car you posted for auction.',
        timestamp: '1 min',
        type: 'text' as const,
      },
      {
        id: `msg-${i}-2`,
        senderId: `seller-${i}`,
        content: 'Hello, Jayden. How may I help you?',
        timestamp: '1 min',
        type: 'text' as const,
      },
    ],
  })
);
