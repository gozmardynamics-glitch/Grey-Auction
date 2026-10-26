'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { apiFetch } from '@/shared/utils/api-client';

/** Absolute backend origin for sockets — they cannot use the same-origin proxy. */
export function getRealtimeBase(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3001';
}

/**
 * Connect to a backend socket namespace as the signed-in account.
 *
 * The browser holds no API token (5.6) and sockets cannot ride the HTTP proxy,
 * so a short-lived ticket is fetched over the proxy and presented once in the
 * handshake. Realtime is an enhancement: if the ticket or the connection fails
 * the caller simply keeps working by refetching.
 */
export function useRealtimeSocket(namespace: string, enabled = true): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSocket(null);
      return;
    }
    let cancelled = false;
    let instance: Socket | null = null;

    const connect = async () => {
      try {
        const json = await apiFetch<{ data?: { ticket?: string } }>('realtime/ticket', {
          method: 'POST',
        });
        const ticket = json?.data?.ticket;
        if (!ticket || cancelled) return;

        instance = io(`${getRealtimeBase()}${namespace}`, {
          auth: { ticket },
          transports: ['websocket', 'polling'],
        });
        if (cancelled) {
          instance.disconnect();
          return;
        }
        setSocket(instance);
      } catch {
        // No realtime; the thread still loads and sends over HTTP.
      }
    };

    void connect();

    return () => {
      cancelled = true;
      instance?.disconnect();
      setSocket(null);
    };
  }, [namespace, enabled]);

  return socket;
}
