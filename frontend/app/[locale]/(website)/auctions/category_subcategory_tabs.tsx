'use client';

interface CategorySubcategoryTabsProps {
  options: string[];
  selected: string;
  counts: Record<string, number>;
  total: number;
  onSelect: (subCategory: string) => void;
}

/** Horizontal pill tabs for institutional arms (Federal / State / Parastatals …). */
export function CategorySubcategoryTabs({
  options,
  selected,
  counts,
  total,
  onSelect,
}: CategorySubcategoryTabsProps) {
  const tabs = [{ label: 'All', value: '', count: total }, ...options.map((o) => ({ label: o, value: o, count: counts[o] ?? 0 }))];

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ label, value, count }) => {
          const active = selected === value;
          return (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => onSelect(value)}
              aria-pressed={active}
              className={
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 border ' +
                (active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40 hover:bg-primary/5')
              }
            >
              {label}
              <span
                className={
                  'rounded-full px-1.5 text-[10px] font-bold tabular-nums ' +
                  (active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground')
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}