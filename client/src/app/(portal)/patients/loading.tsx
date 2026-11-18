import { PatientsPanelSkeleton } from "@/features/patients/components/patients-panel-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <PatientsPanelSkeleton />
    </div>
  );
}
