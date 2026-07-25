'use client';

import { ArrowUpDown } from 'lucide-react';
import type { SortOption } from '@/shared/models';
import { SORT_OPTIONS } from '@/shared/models/sort';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown_menu';

interface SortDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options?: SortOption[];
}

export function SortDropdown({
  value,
  onValueChange,
  options = SORT_OPTIONS,
}: SortDropdownProps) {
  const activeLabel = options.find((o) => o.value === value)?.label ?? 'Sort';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          {activeLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={value === option.value ? 'font-semibold' : ''}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
