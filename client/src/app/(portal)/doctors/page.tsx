import { Suspense } from "react";
import type { Metadata } from "next";

import { DoctorsView } from "@/features/doctors/components/doctors-view";
import { DoctorsViewSkeleton } from "@/features/doctors/components/doctors-view-skeleton";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <Suspense fallback={<DoctorsViewSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
