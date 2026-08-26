/* eslint-disable react-hooks/incompatible-library */
'use client';

import { useState, useMemo, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { TablePagination } from './table_pagination';
import { EmptyState } from './empty_state';
import { Skeleton } from './skeleton';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { Input } from './input';
import { SortDropdown } from './sort_dropdown';
import { Button } from './button';

import type { SortOption } from '@/shared/models';

interface TabFilter {
  value: string;
  label: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Filtering
  globalFilter?: string;

  // Tab filtering
  tabFilters?: readonly TabFilter[];
  filterField?: keyof TData;
  onTabChange?: (value: string) => void;

  // Title (alternative to tabs)
  title?: string;

  // Toolbar
  showToolbar?: boolean;
  searchPlaceholder?: string;
  sortOptions?: SortOption[];
  onSortChange?: (value: string) => void;

  // Pagination (client-side by default)
  pagination?: boolean;
  pageSize?: number;

  // Server-side pagination (when provided, switches to manual mode)
  totalItems?: number;
  pageCount?: number;
  onPaginationChange?: (state: PaginationState) => void;

  // Empty state
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;

  // Row selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  getRowId?: (row: TData) => string;

  // Loading
  isLoading?: boolean;

  // Custom wrapper class
  className?: string;

  // Mobile cards (below sm breakpoint): renders simple cards instead of table rows
  mobileCards?: (row: TData, index: number) => ReactNode;
}

function ToolbarControls({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  sortOptions,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions?: SortOption[];
}) {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="relative flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full sm:w-[200px] h-9 bg-card"
        />
      </div>
      <SortDropdown
        value={sortValue}
        onValueChange={onSortChange}
        options={sortOptions}
      />
      <Button variant="outline" size="sm" className="gap-2">
        <ListFilter className="h-4 w-4" />
        Filter
      </Button>
    </div>
  );
}

function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  tabFilters,
  filterField = 'status' as keyof TData,
  onTabChange,
  title,
  showToolbar: showToolbarProp,
  searchPlaceholder = 'Search',
  sortOptions,
  onSortChange,
  pagination = true,
  pageSize = 10,
  totalItems,
  pageCount: manualPageCount,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  emptyIcon,
  emptyTitle = 'No results found',
  emptyDescription,
  isLoading = false,
  className,
  mobileCards,
}: DataTableProps<TData, TValue>) {
  const isServerSide = !!onPaginationChange;
  const showToolbar = showToolbarProp ?? !!(tabFilters || title);

  const [activeTab, setActiveTab] = useState('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('default');

  const searchQuery = showToolbar ? internalSearchQuery : globalFilter;

  const filteredData = useMemo(() => {
    if (!tabFilters || activeTab === 'all') return data;
    return data.filter((item) => String(item[filterField]) === activeTab);
  }, [data, tabFilters, activeTab, filterField]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    onSortChange?.(value);
  };

  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(!isServerSide && {
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    }),
    ...(isServerSide && {
      manualPagination: true,
      manualFiltering: true,
      pageCount: manualPageCount,
    }),
    ...(onRowSelectionChange && { enableRowSelection: true }),
    ...(getRowId && { getRowId }),
    state: {
      globalFilter: isServerSide ? undefined : searchQuery,
      pagination: paginationState,
      ...(rowSelection !== undefined && { rowSelection }),
    },
    ...(onRowSelectionChange && {
      onRowSelectionChange: (updater) => {
        const next =
          typeof updater === 'function'
            ? updater(rowSelection ?? {})
            : updater;
        onRowSelectionChange(next);
      },
    }),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(paginationState) : updater;
      setPaginationState(next);
      if (isServerSide) {
        onPaginationChange(next);
      }
    },
  });

  // Pagination values
  const currentPage = paginationState.pageIndex + 1;
  const totalRows = isServerSide
    ? (totalItems ?? filteredData.length)
    : table.getFilteredRowModel().rows.length;
  const computedPageCount = isServerSide
    ? (manualPageCount ?? 1)
    : table.getPageCount();
  const startRow =
    totalRows === 0 ? 0 : (currentPage - 1) * paginationState.pageSize + 1;
  const endRow = Math.min(currentPage * paginationState.pageSize, totalRows);

  const handlePageChange = (page: number) => {
    table.setPageIndex(page - 1);
  };

  // Empty state (when not loading, no data, and no toolbar)
  if (!isLoading && data.length === 0 && !showToolbar) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const tableContent = (
    <>
      <div
        className={cn(
          'rounded-md border overflow-x-auto',
          mobileCards && 'hidden sm:block'
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'sticky top-0 z-20 bg-background',
                      header.column.columnDef.meta?.sticky &&
                        'left-0 z-30 border-r'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: paginationState.pageSize }, (_, i) => (
                <TableRow key={i}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.sticky && 'sticky left-0 z-10 bg-background')}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {mobileCards && (
        <div className="space-y-3 sm:hidden">
          {isLoading ? (
            Array.from({ length: paginationState.pageSize }, (_, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, index) =>
              mobileCards(row.original, index)
            )
          ) : (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      )}

      {pagination && computedPageCount > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={computedPageCount}
          totalItems={totalRows}
          startItem={startRow}
          endItem={endRow}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );

  // With tab filters: wrap in Tabs + toolbar
  if (tabFilters) {
    return (
      <div className={cn("space-y-4 bg-background p-2 rounded-lg", className)}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4  sm:flex-row sm:items-center sm:justify-between">
            <div className="border-b w-full ">
              <TabsList variant="line">
                {tabFilters.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    variant="line"
                    className="cursor-pointer"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <ToolbarControls
              searchQuery={internalSearchQuery}
              onSearchChange={setInternalSearchQuery}
              searchPlaceholder={searchPlaceholder}
              sortValue={sortValue}
              onSortChange={handleSortChange}
              sortOptions={sortOptions}
            />
          </div>
        </Tabs>
        {tableContent}
      </div>
    );
  }

  // With title: wrap in title + toolbar
  if (title) {
    return (
      <div className={cn("space-y-4 bg-background p-2 rounded-lg", className)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <ToolbarControls
            searchQuery={internalSearchQuery}
            onSearchChange={setInternalSearchQuery}
            searchPlaceholder={searchPlaceholder}
            sortValue={sortValue}
            onSortChange={handleSortChange}
            sortOptions={sortOptions}
          />
        </div>
        {tableContent}
      </div>
    );
  }

  // No toolbar: render as before
  return <div className={cn("space-y-4", className)}>{tableContent}</div>;
}

export { DataTable };
export type { DataTableProps, TabFilter };
