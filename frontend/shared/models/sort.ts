import type { SortOption } from '.';

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Default sorting', value: 'default' },
  { label: 'Ending Soon', value: 'ending-soon' },
  { label: 'By price: low to high', value: 'price-asc' },
  { label: 'By price: high to low', value: 'price-desc' },
] as const;
