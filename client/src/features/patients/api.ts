import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { apiGetPage, apiRequest, type Paginated } from "@/lib/api-client";
import { fromDateInputValue } from "@/lib/format";

import { cancelDelete, scheduleDelete } from "./pending-deletes";

import type { Condition, Gender } from "./constants";
import type { PatientFormValues } from "./schema";

export type Patient = {
  _id: string;
  doctor: { _id: string; name: string; specialization: string } | null;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: Condition;
  admittedAt: string;
  createdAt: string;
};

export type PatientListParams = {
  page: number;
  limit: number;
  search?: string;
  condition?: string;
  gender?: string;
  doctor?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  order?: string;
};

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
};

export function patientListOptions(params: PatientListParams) {
  return queryOptions({
    queryKey: patientKeys.list(params),
    queryFn: ({ signal }) => apiGetPage<Patient>("/patients", params, signal),
    // Keep the previous page's totals on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function usePatients(params: PatientListParams) {
  return useQuery(patientListOptions(params));
}

const toPayload = (values: PatientFormValues) => ({
  ...values,
  admittedAt: fromDateInputValue(values.admittedAt),
});

/** Patient changes also affect doctor patient counts and every dashboard statistic. */
function invalidatePatientData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: patientKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["doctors"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

type ListSnapshot = Array<[readonly unknown[], Paginated<Patient> | undefined]>;

/** Applies an optimistic change to every cached patient list and returns a snapshot for rollback. */
async function updateCachedLists(
  queryClient: QueryClient,
  update: (list: Paginated<Patient>) => Paginated<Patient>,
): Promise<ListSnapshot> {
  await queryClient.cancelQueries({ queryKey: patientKeys.lists() });
  const snapshot = queryClient.getQueriesData<Paginated<Patient>>({ queryKey: patientKeys.lists() });
  queryClient.setQueriesData<Paginated<Patient>>({ queryKey: patientKeys.lists() }, (list) =>
    list ? update(list) : list,
  );
  return snapshot;
}

function restoreLists(queryClient: QueryClient, snapshot: ListSnapshot | undefined) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, values }: { doctorId: string; values: PatientFormValues }) =>
      apiRequest<Patient>(`/doctors/${doctorId}/patients`, { method: "POST", body: toPayload(values) }),
    onSuccess: () => invalidatePatientData(queryClient),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PatientFormValues }) =>
      apiRequest<Patient>(`/patients/${id}`, { method: "PATCH", body: toPayload(values) }),
    onMutate: ({ id, values }) =>
      updateCachedLists(queryClient, (list) => ({
        ...list,
        data: list.data.map((patient) =>
          patient._id === id ? { ...patient, ...toPayload(values) } : patient,
        ),
      })),
    onError: (_error, _variables, snapshot) => restoreLists(queryClient, snapshot),
    onSettled: () => invalidatePatientData(queryClient),
  });
}

/** Quick condition change from the list, shown immediately and rolled back on failure. */
export function useUpdatePatientCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: Condition }) =>
      apiRequest<Patient>(`/patients/${id}`, { method: "PATCH", body: { condition } }),
    onMutate: ({ id, condition }) =>
      updateCachedLists(queryClient, (list) => ({
        ...list,
        data: list.data.map((patient) => (patient._id === id ? { ...patient, condition } : patient)),
      })),
    onError: (_error, _variables, snapshot) => restoreLists(queryClient, snapshot),
    onSettled: () => invalidatePatientData(queryClient),
  });
}

const UNDO_WINDOW_MS = 5000;

/**
 * Hides the patient immediately and deletes it on the server after a short undo window.
 * Returns the function to call; the caller shows the toast with the Undo action.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return (
    patient: Pick<Patient, "_id" | "name">,
    callbacks: { onError: (error: unknown) => void },
  ) => {
    scheduleDelete(patient._id, UNDO_WINDOW_MS, ({ keepalive }) => {
      apiRequest<null>(`/patients/${patient._id}`, { method: "DELETE", keepalive })
        .catch(callbacks.onError)
        .finally(() => void invalidatePatientData(queryClient));
    });
  };
}

export { cancelDelete as undoDeletePatient, UNDO_WINDOW_MS };
