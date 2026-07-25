
import { ReactNode } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/common';

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
}: ProductDetailsTabsProps) {
  return (
      <Tabs defaultValue={defaultTab || tabs[0]?.value} className="w-full">
        {/* Tabs Header */}
        <TabsList className="justify-start rounded-xl bg-card p-0 h-10">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl gap-3 data-[state=active]:bg-primary/30 data-[state=active]:text-primary shadow-none px-6 py-3 font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="p-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
  );
}