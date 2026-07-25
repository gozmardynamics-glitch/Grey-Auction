'use client'
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  close: () => void;
}

const Modal = ({
  open,
  close,
  children,
  className,
  iconClassName,
}: ModalProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      onClick={close}
      className={cn(
        'fixed inset-0 z-50 h-screen min-h-screen w-full bg-black/20 backdrop-blur-sm transition-all duration-500',
        {
          'opacity-100': open,
          'pointer-events-none opacity-0': !open,
        }
      )}
    >
      <main
        className={cn(
          'bg-background xs:w-80 fixed top-1/2 left-1/2 z-50 w-11/12 max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl px-6 py-7 transition-all duration-75 sm:max-w-sm',
          className,
          {
            'pointer-events-auto visible opacity-100': open,
            'pointer-events-none invisible opacity-0': !open,
          }
        )}
      >
        <button
          onClick={close}
          className={cn(
            'absolute top-4 right-4 z-10 cursor-pointer',
            iconClassName
          )}
        >
          <X className="size-4 md:size-5" />
        </button>

        {children}
      </main>
    </div>,
    document.body
  );
};

export { Modal };
