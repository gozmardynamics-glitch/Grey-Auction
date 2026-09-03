'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Layers } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/common';

type Theme = 'light' | 'grey' | 'dark';

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'grey', label: 'Grey', icon: Layers },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const STORAGE_KEY = 'greyauction-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'grey', 'dark');
  if (theme !== 'light') root.classList.add(theme);
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light';
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const select = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  const Active = THEMES.find((t) => t.value === theme) ?? THEMES[0];
  const ActiveIcon = Active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${Active.label}`}
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => select(value)}
            className={theme === value ? 'font-semibold text-primary' : ''}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}