'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/common/button';
import { Input } from '@/shared/components/common/input';
import { Card } from '@/shared/components/common/card';
import { MiniSpinner } from '@/shared/components/common/spinner';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const STORAGE_KEY = 'ai_chatbot_history';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Hello! I\'m the Grey Auctions assistant. How can I help you today?' }];
    } catch {
      return [{ role: 'assistant', content: 'Hello! How can I help you today?' }];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/public/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureKey: 'chatbot_assistant',
          input: {
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          },
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const reply = data?.data?.output || 'Sorry, I encountered an error. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2"><MiniSpinner /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
