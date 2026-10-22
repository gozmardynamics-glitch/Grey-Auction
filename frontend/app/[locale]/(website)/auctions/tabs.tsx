'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/common/button';

interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

interface ProductDetailsTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export default function ProductDetailsTabs({
  tabs,
  defaultTab,
  className,
}: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  return (
    <div className={cn('w-full', className)}>
      {/* Tabs Header */}
      <div className="flex flex-col gap-2">
        <div className="rounded-xl bg-card p-0 h-10">
          <div className="flex h-full items-center p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeTab === tab.value}
                aria-controls={`panel-${tab.value}`}
                id={`tab-${tab.value}`}
                className={cn(
                  'rounded-xl gap-3 font-medium h-full px-6 py-3 transition-all',
                  activeTab === tab.value
                    ? 'bg-primary/30 text-primary shadow-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              role="tabpanel"
              id={`panel-${tab.value}`}
              aria-labelledby={`tab-${tab.value}`}
              hidden={activeTab !== tab.value}
              className="p-6"
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}