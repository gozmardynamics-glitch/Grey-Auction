'use client';

import dynamic from 'next/dynamic';

const AIChatbot = dynamic(() => import('./chatbot'), { ssr: false });

export default function ChatbotWrapper() {
  return <AIChatbot />;
}
