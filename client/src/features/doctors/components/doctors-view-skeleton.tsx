import { TableSkeletonRows, ToolbarSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody } from "@/components/ui/table";

const COLUMNS = [
  { width: "w-36", variant: "avatar" as const },
  { width: "w-24", variant: "badge" as const, className: "hidden sm:table-cell" },
  { width: "w-36", className: "hidden md:table-cell" },
  { width: "w-10" },
  { width: "w-8", variant: "action" as const },
];

export function DoctorsViewSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading doctors">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-4">
          <ToolbarSkeleton />
        </div>
        <div className="border-b px-4 py-3.5">
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-3">
          <TableBody>
            <TableSkeletonRows columns={COLUMNS} rows={10} />
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-4">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
    </div>
  );
}
