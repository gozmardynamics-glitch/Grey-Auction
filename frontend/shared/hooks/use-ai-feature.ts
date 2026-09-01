'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAIFeatureOptions {
  featureKey: string;
  onSuccess?: (output: string) => void;
  onError?: (error: string) => void;
}

interface UseAIFeatureReturn {
  execute: (input: Record<string, unknown>) => Promise<string | null>;
  result: string | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useAIFeature({ featureKey, onSuccess, onError }: UseAIFeatureOptions): UseAIFeatureReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: Record<string, unknown>): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, input }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
      const data = await res.json();
      const output = data?.data?.output || '';
      setResult(output);
      onSuccess?.(output);
      return output;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI feature failed';
      setError(msg);
      onError?.(msg);
      toast.error('AI feature failed. A fallback model may be used.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [featureKey, onSuccess, onError]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { execute, result, isLoading, error, reset };
}
