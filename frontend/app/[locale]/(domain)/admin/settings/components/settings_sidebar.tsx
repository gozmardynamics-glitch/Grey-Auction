'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/common';
import { SETTINGS_MODULES, SettingsModuleKey } from '../../models/settings';

interface SettingsSidebarProps {
  activeModule: SettingsModuleKey;
  onModuleChange: (key: SettingsModuleKey) => void;
}

export default function SettingsSidebar({
  activeModule,
  onModuleChange,
}: SettingsSidebarProps) {
  return (
    <div className="w-full md:w-[200px] shrink-0 border-b md:border-b-0 md:border-r py-2">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible px-2">
        {SETTINGS_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;

          return (
            <Button
              variant="ghost"
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              className={cn(
                'flex shrink-0 md:w-full items-center md:justify-start gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
