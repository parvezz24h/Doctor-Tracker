import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Column description shared by a table and its shimmer placeholder so they line up. */
export type SkeletonColumn = {
  /** Tailwind width of the placeholder bar, e.g. "w-32". */
  width: string;
  /** Extra classes for the cell (use the same responsive classes as the real column). */
  className?: string;
  /** Renders an avatar circle with two text lines. */
  variant?: "text" | "avatar" | "badge" | "action";
};

export function TableSkeletonRows({ columns, rows = 10 }: { columns: SkeletonColumn[]; rows?: number }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <TableRow key={rowIndex} className="hover:bg-transparent" aria-hidden>
      {columns.map((column, columnIndex) => (
        <TableCell key={columnIndex} className={column.className}>
          {column.variant === "avatar" ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className={cn("h-3.5", column.width)} />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : column.variant === "badge" ? (
            <Skeleton className={cn("h-5 rounded-full", column.width)} />
          ) : column.variant === "action" ? (
            <Skeleton className="ml-auto size-9 rounded-lg" />
          ) : (
            <Skeleton className={cn("h-3.5", column.width)} />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5" aria-hidden>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="size-11 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-3 h-3 w-36" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[280px] items-end gap-2", className)} aria-hidden>
      {[45, 70, 55, 85, 40, 65, 90, 60, 75, 50, 80, 58].map((height, index) => (
        <Skeleton key={index} className="flex-1 rounded-md" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5", className)} aria-hidden>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-56 max-w-full" />
      <ChartSkeleton className="mt-6" />
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-hidden>
      <Skeleton className="h-10 w-full sm:w-64 lg:mr-auto lg:w-full lg:max-w-md" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-44" />
    </div>
  );
}

export function DetailCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6" aria-hidden>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center 2xl:flex-col 2xl:items-start">
        <Skeleton className="size-16 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 2xl:w-full" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
