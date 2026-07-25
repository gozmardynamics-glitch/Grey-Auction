import type { ColumnDef, RowData } from '@tanstack/react-table';

export interface ColumnMeta {
  filterOptions?: string[];
  sticky?: boolean;
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue = unknown> {
    filterOptions?: string[];
    sticky?: boolean;
  }
}

export type ColumnDefWithMeta<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  meta?: ColumnMeta;
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDefWithMeta<TData, TValue>[];
  data: TData[];
  pagination?: boolean;
  hideableColumn?: boolean;
  header?: string;
  seeAllLink?: string;
}

export interface SortOption {
  label: string;
  value: string;
}
