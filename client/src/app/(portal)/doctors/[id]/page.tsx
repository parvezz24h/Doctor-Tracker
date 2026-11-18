import { Suspense } from "react";
import type { Metadata } from "next";

import { DoctorDetailSkeleton, DoctorDetailView } from "@/features/doctors/components/doctor-detail-view";

export const metadata: Metadata = { title: "Doctor" };

export default function DoctorPage() {
  return (
    <Suspense fallback={<DoctorDetailSkeleton />}>
      <DoctorDetailView />
    </Suspense>
  );
}
