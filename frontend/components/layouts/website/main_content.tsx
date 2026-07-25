'use client';

import { useLayoutPadding } from '@/hooks/use-layout-padding';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { paddingTop } = useLayoutPadding();

  return (
    <main className={`${paddingTop}`}>
      <div className="p-6">{children}</div>
    </main>
  );
}
