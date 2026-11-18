import { TableSkeletonRows, ToolbarSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody } from "@/components/ui/table";

const COLUMNS = [
  { width: "w-32", variant: "avatar" as const },
  { width: "w-20", className: "hidden sm:table-cell" },
  { width: "w-24", variant: "badge" as const },
  { width: "w-24", className: "hidden lg:table-cell" },
  { width: "w-8", variant: "action" as const },
];

/** Placeholder with the same outline as PatientsPanel, shown before the client reads the URL. */
export function PatientsPanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card" aria-busy aria-label="Loading patients">
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
  );
}
