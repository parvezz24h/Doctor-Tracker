import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { Condition } from "@/features/patients/constants";

export type DashboardStats = {
  range: { days: number; from: string; to: string };
  totals: {
    doctors: number;
    patients: number;
    newDoctors: number;
    admissions: number;
    /** Percent change versus the previous period; null when there is nothing to compare with. */
    admissionsChange: number | null;
    critical: number;
    averagePatientsPerDoctor: number;
  };
  admissionsByDay: Array<{ date: string; count: number }>;
  patientsByCondition: Array<{ condition: Condition; count: number }>;
  patientsPerDoctor: Array<{ doctorId: string; name: string; specialization: string; count: number }>;
  doctorsBySpecialization: Array<{ specialization: string; count: number }>;
};

export function useDashboardStats(days: number) {
  return useQuery({
    queryKey: ["dashboard", "stats", days],
    queryFn: ({ signal }) => apiGet<DashboardStats>("/dashboard/stats", { days }, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
