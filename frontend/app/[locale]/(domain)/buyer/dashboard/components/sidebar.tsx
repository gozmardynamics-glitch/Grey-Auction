import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Card, LogoutDialog } from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { BUYER_MODULES, BuyerModuleKey } from '../../models/buyer_modules';

interface SettingsSidebarProps {
  activeModule: BuyerModuleKey;
  onModuleChange: (key: BuyerModuleKey) => void;
}

export default function BuyerSettingsSidebar({
  activeModule,
  onModuleChange,
}: SettingsSidebarProps) {
  const t = useTranslations('buyer.nav');
  return (
    <Card className="min-w-0 shadow-none rounded-xl h-fit p-4 md:p-6 sticky top-0">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible px-2">
        {BUYER_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;

          return (
            <Button
              variant="ghost"
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              className={cn(
                'flex shrink-0 md:w-full md:justify-start items-center gap-2.5 rounded-md px-3 py-2 text-sm md:text-lg font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.label)}
            </Button>
          );
        })}

        {/* Log Out */}
        <LogoutDialog>
          <Button
            variant="ghost"
            className="flex shrink-0 md:w-full md:justify-start items-center gap-2.5 rounded-md px-3 py-2 text-sm md:text-lg font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t('logOut')}
          </Button>
        </LogoutDialog>
      </nav>
    </Card>
  );
}
