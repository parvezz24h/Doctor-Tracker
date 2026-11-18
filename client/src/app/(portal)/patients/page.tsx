import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { PatientsPanel } from "@/features/patients/components/patients-panel";
import { PatientsPanelSkeleton } from "@/features/patients/components/patients-panel-skeleton";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Every patient across all doctors. Edit details or remove records." />
      <Suspense fallback={<PatientsPanelSkeleton />}>
        <PatientsPanel />
      </Suspense>
    </div>
  );
}
