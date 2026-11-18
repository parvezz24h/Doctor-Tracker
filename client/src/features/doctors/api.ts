import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { Condition } from "@/features/patients/constants";
import { apiGet, apiGetPage, apiRequest } from "@/lib/api-client";

import type { DoctorFormValues } from "./schema";

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  /** Same-origin URL of the profile photo, or null when there is none. */
  photoUrl: string | null;
  createdAt: string;
  patientCount: number;
};

export type DoctorFilterOptions = { specializations: string[]; hospitals: string[] };

export type DoctorListParams = {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  order?: string;
};

export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (params: DoctorListParams) => [...doctorKeys.lists(), params] as const,
  filters: () => [...doctorKeys.all, "filters"] as const,
  detail: (id: string) => [...doctorKeys.all, "detail", id] as const,
};

export function doctorListOptions(params: DoctorListParams) {
  return queryOptions({
    queryKey: doctorKeys.list(params),
    queryFn: ({ signal }) => apiGetPage<Doctor>("/doctors", params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDoctors(params: DoctorListParams) {
  return useQuery(doctorListOptions(params));
}

export function useDoctorFilterOptions() {
  return useQuery({
    queryKey: doctorKeys.filters(),
    queryFn: ({ signal }) => apiGet<DoctorFilterOptions>("/doctors/filters", undefined, signal),
    // The set of specializations and hospitals changes rarely.
    staleTime: 5 * 60_000,
  });
}

export type DoctorStats = {
  patientsByCondition: Array<{ condition: Condition; count: number }>;
  admissionsByDay: Array<{ date: string; count: number }>;
  admissionsInRange: number;
  averageAge: number | null;
  lastAdmission: string | null;
};

export function useDoctorStats(id: string) {
  return useQuery({
    queryKey: [...doctorKeys.detail(id), "stats"],
    queryFn: ({ signal }) => apiGet<DoctorStats>(`/doctors/${id}/stats`, undefined, signal),
  });
}

export function useDoctor(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: ({ signal }) => apiGet<Doctor>(`/doctors/${id}`, undefined, signal),
    enabled: options.enabled,
  });
}

function invalidateDoctorData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: doctorKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    // Patient rows embed their doctor's name and specialization.
    queryClient.invalidateQueries({ queryKey: ["patients"] }),
  ]);
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DoctorFormValues) => apiRequest<Doctor>("/doctors", { method: "POST", body: values }),
    onSuccess: () => invalidateDoctorData(queryClient),
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DoctorFormValues }) =>
      apiRequest<Doctor>(`/doctors/${id}`, { method: "PATCH", body: values }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(doctorKeys.detail(data._id), data);
      return invalidateDoctorData(queryClient);
    },
  });
}

/** Uploads a new photo (File) or removes the current one (null). */
export function useDoctorPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photo }: { id: string; photo: File | null }) => {
      if (!photo) return apiRequest<Doctor>(`/doctors/${id}/photo`, { method: "DELETE" });
      const body = new FormData();
      body.append("photo", photo);
      return apiRequest<Doctor>(`/doctors/${id}/photo`, { method: "PUT", body });
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(doctorKeys.detail(data._id), data);
      return invalidateDoctorData(queryClient);
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<null>(`/doctors/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: doctorKeys.detail(id) });
      return invalidateDoctorData(queryClient);
    },
  });
}
