"use client";

import { memo } from "react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { TableSkeletonRows, type SkeletonColumn } from "./skeletons";

export type SortState = { by: string; order: "asc" | "desc" };

/** Row selection for bulk actions (desktop table only). */
export type RowSelection = { selectedIds: ReadonlySet<string>; onChange: (ids: Set<string>) => void };

export type DataTableColumn<T> = {
  key: string;
  header: string;
  /** Applied to both the header and body cells (alignment, responsive visibility). */
  className?: string;
  /** Server sort field; makes the header clickable. */
  sortKey?: string;
  /** Shape of this column's shimmer placeholder. */
  skeleton: Omit<SkeletonColumn, "className">;
  /** Custom header content (used for the select-all checkbox). */
  headerCell?: React.ReactNode;
  cell: (row: T) => React.ReactNode;
};

type RowProps<T> = {
  row: T;
  selected?: boolean;
  /** Position on the page, used to stagger the entrance animation. */
  index: number;
  columns: DataTableColumn<T>[];
  highlighted: boolean;
  onRowClick?: (row: T) => void;
};

function DataTableRowInner<T>({ row, index, columns, highlighted, selected, onRowClick }: RowProps<T>) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "animate-stagger transition-colors duration-150 hover:bg-accent/50",
        onRowClick && "cursor-pointer",
        highlighted && "animate-row-flash",
      )}
    >
      {columns.map((column) => (
        <TableCell key={column.key} className={column.className}>
          {column.cell(row)}
        </TableCell>
      ))}
    </TableRow>
  );
}

// Rows keep their object identity between renders, so only rows whose data changed re-render.
const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;

function SortableHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  alignEnd,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSortChange: (sortKey: string) => void;
  alignEnd: boolean;
}) {
  const active = sort.by === sortKey;
  const Icon = !active ? ArrowUpDownIcon : sort.order === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <button
      type="button"
      onClick={() => onSortChange(sortKey)}
      className={cn(
        "-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 uppercase transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "text-foreground",
        alignEnd && "flex-row-reverse",
      )}
    >
      {label}
      <Icon className={cn("size-3.5", !active && "opacity-40")} />
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" aria-hidden>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function DataTable<T>({
  columns: baseColumns,
  rows,
  getRowId,
  loading,
  skeletonRows = 10,
  highlightedId,
  onRowClick,
  emptyState,
  caption,
  sort,
  onSortChange,
  renderCard,
  selection,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Shows shimmer rows instead of data. */
  loading: boolean;
  skeletonRows?: number;
  /** Row that was just created or edited; it flashes briefly. */
  highlightedId?: string | null;
  onRowClick?: (row: T) => void;
  emptyState: React.ReactNode;
  /** Accessible name of the table. */
  caption: string;
  sort?: SortState;
  onSortChange?: (sortKey: string) => void;
  /** Card shown instead of a table row on phones. */
  renderCard?: (row: T) => React.ReactNode;
  selection?: RowSelection;
}) {
  if (!loading && rows.length === 0) return emptyState;

  let columns = baseColumns;
  if (selection) {
    const pageIds = rows.map(getRowId);
    const selectedOnPage = pageIds.filter((id) => selection.selectedIds.has(id)).length;
    const allChecked = selectedOnPage > 0 && selectedOnPage === pageIds.length;
    const toggleOne = (id: string, checked: boolean) => {
      const next = new Set(selection.selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      selection.onChange(next);
    };
    columns = [
      {
        key: "__select",
        header: "",
        className: "w-10",
        skeleton: { width: "w-4" },
        headerCell: (
          <Checkbox
            aria-label="Select all rows on this page"
            disabled={loading}
            checked={allChecked ? true : selectedOnPage > 0 ? "indeterminate" : false}
            onCheckedChange={(checked) => selection.onChange(checked === true ? new Set(pageIds) : new Set())}
          />
        ),
        cell: (row: T) => {
          const id = getRowId(row);
          return (
            // The row itself is clickable; the checkbox must not trigger it.
            <div onClick={(event) => event.stopPropagation()} className="flex">
              <Checkbox
                aria-label="Select row"
                checked={selection.selectedIds.has(id)}
                onCheckedChange={(checked) => toggleOne(id, checked === true)}
              />
            </div>
          );
        },
      },
      ...columns,
    ];
  }

  const table = (
    <Table
      aria-busy={loading}
      aria-label={caption}
      className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-3 [&_th:first-child]:pl-4 [&_th:last-child]:pr-3"
    >
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => {
            const active = sort && column.sortKey && sort.by === column.sortKey;
            return (
              <TableHead
                key={column.key}
                aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : undefined}
                className={cn("h-11 text-xs font-semibold tracking-wider text-muted-foreground uppercase", column.className)}
              >
                {column.headerCell ? (
                  column.headerCell
                ) : column.sortKey && sort && onSortChange ? (
                  <SortableHeader
                    label={column.header}
                    sortKey={column.sortKey}
                    sort={sort}
                    onSortChange={onSortChange}
                    alignEnd={Boolean(column.className?.includes("text-right"))}
                  />
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeletonRows
            rows={skeletonRows}
            columns={columns.map((column) => ({ ...column.skeleton, className: column.className }))}
          />
        ) : (
          rows.map((row, index) => {
            const id = getRowId(row);
            return (
              <DataTableRow
                key={id}
                row={row}
                index={index}
                selected={selection?.selectedIds.has(id)}
                columns={columns}
                highlighted={id === highlightedId}
                onRowClick={onRowClick}
              />
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (!renderCard) return table;

  // Phones get a card list; both are rendered and CSS picks one, so there is no layout jump.
  return (
    <>
      <div className="hidden md:block">{table}</div>
      <ul className="divide-y md:hidden" aria-label={caption} aria-busy={loading}>
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 8) }, (_, index) => (
              <li key={index}>
                <CardSkeleton />
              </li>
            ))
          : rows.map((row, index) => {
              const id = getRowId(row);
              return (
                <li
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{ "--i": index } as React.CSSProperties}
                  className={cn(
                    "animate-stagger px-4 py-3 transition-colors",
                    onRowClick && "cursor-pointer active:bg-muted/70",
                    id === highlightedId && "animate-row-flash",
                  )}
                >
                  {renderCard(row)}
                </li>
              );
            })}
      </ul>
    </>
  );
}

/** Next sort state when a header is clicked: same column flips, a new column starts at its default. */
export function nextSort(current: SortState, sortKey: string, defaultOrder: (key: string) => "asc" | "desc") {
  if (current.by === sortKey) return { by: sortKey, order: current.order === "asc" ? "desc" : "asc" } as SortState;
  return { by: sortKey, order: defaultOrder(sortKey) } as SortState;
}
