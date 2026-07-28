'use client';

import { cn } from '@/lib/utils';

export type StatusTabKey = 'all' | 'closing-soon' | 'new-today' | 'no-reserve';

export interface StatusTab {
  key: StatusTabKey;
  label: string;
  count: number;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: StatusTabKey;
  onTabChange: (tab: StatusTabKey) => void;
}

export function StatusTabs({ tabs, activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max gap-0 border-b border-border">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                activeTab === tab.key
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ease-in-out" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const STATUS_TAB_KEYS: Record<StatusTabKey, string> = {
  'all': 'All Auctions',
  'closing-soon': 'Closing Soon',
  'new-today': 'New Today',
  'no-reserve': 'No Reserve',
};
