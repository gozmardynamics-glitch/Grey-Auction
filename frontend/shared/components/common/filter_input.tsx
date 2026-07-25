/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Column } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Input } from './input';
import type { ColumnMeta } from '@/shared/models';

interface FilterInputProps<TData, TValue> {
  column: Column<TData, TValue> & { columnDef: { meta?: ColumnMeta } };
}

const FilterInput = <TData, TValue>({
  column,
}: FilterInputProps<TData, TValue>) => {
  const columnFilterValue = column.getFilterValue() as string;
  const options = column.columnDef.meta?.filterOptions;
  const label =
    typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id;
  const ariaLabel = `Filter by ${label}`;

  if (options) {
    return (
      <Select
        value={columnFilterValue}
        onValueChange={(value) =>
          column.setFilterValue(value === 'all' ? '' : value)
        }
      >
        <SelectTrigger className="h-10 w-[180px]" aria-label={ariaLabel}>
          <SelectValue
            placeholder={`${column.columnDef.header || column.id}...`}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((option: any) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      placeholder={`${column.columnDef.header || column.id}...`}
      value={columnFilterValue ?? ''}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-10 w-[180px]"
      aria-label={ariaLabel}
    />
  );
};

export { FilterInput };
