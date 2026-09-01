'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
const HISTORY_CAP = 50;
const TITLE_ID = 'ai-chatbot-title';
const INPUT_ID = 'ai-chatbot-input';

function buildInitialMessages(t: (key: string) => string): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore malformed history and fall through to the greeting
  }
  return [{ role: 'assistant', content: t('greeting') }];
}

export default function AIChatbot() {
  const t = useTranslations('chatbot');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => buildInitialMessages(t));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-HISTORY_CAP)));
    } catch {}
  }, [messages]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    launcherRef.current?.focus();
  }, []);

  // Focus the input when the panel opens, and close on Escape.
  useEffect(() => {
    if (isOpen) {
      document.getElementById(INPUT_ID)?.focus();
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          launcherRef.current?.focus();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen]);

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

      if (!res.ok) {
        const text = await res.text();
        const lower = text.toLowerCase();
        if (
          lower.includes('not enabled') ||
          lower.includes('no models configured') ||
          lower.includes('not configured')
        ) {
          setMessages((prev) => [...prev, { role: 'assistant', content: t('notConfigured') }]);
          return;
        }
        throw new Error('Request failed');
      }

      const data = await res.json();
      const reply = data?.data?.output || t('error');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('error') }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, t]);

  return (
    <>
      {!isOpen && (
        <button
          ref={launcherRef}
          onClick={openPanel}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label={t('launcherLabel')}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {isOpen && (
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className="fixed bottom-6 right-6 z-50 flex h-[min(500px,calc(100dvh-96px))] w-[min(380px,calc(100vw-32px))] flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 id={TITLE_ID} className="font-semibold">
              {t('title')}
            </h3>
            <button
              onClick={closePanel}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2">
                  <MiniSpinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input
              id={INPUT_ID}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t('inputPlaceholder')}
              aria-label={t('inputLabel')}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              aria-label={t('send')}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
