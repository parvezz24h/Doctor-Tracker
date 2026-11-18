"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, DownloadIcon, FilterXIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { ActiveFilters, type ActiveFilter } from "@/components/shared/active-filters";
import { DataTable, nextSort, type DataTableColumn, type SortState } from "@/components/shared/data-table";
import { DateRangePicker, formatRange } from "@/components/shared/date-range-picker";
import { ExportButton } from "@/components/shared/export-button";
import { FilterSelect } from "@/components/shared/filter-select";
import { NameAvatar } from "@/components/shared/name-avatar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/hooks/use-hotkey";
import { parsePage, useQueryParams } from "@/hooks/use-query-params";
import { useRowHighlight } from "@/hooks/use-row-highlight";
import { getErrorMessage } from "@/lib/api-client";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";

import {
  patientListOptions,
  UNDO_WINDOW_MS,
  undoDeletePatient,
  useDeletePatient,
  usePatients,
  type Patient,
  type PatientListParams,
} from "../api";
import { CONDITION_LABELS, CONDITION_OPTIONS, GENDER_LABELS, GENDER_OPTIONS, type Condition, type Gender } from "../constants";
import { usePendingDeletes } from "../pending-deletes";
import { ConditionBadge } from "./condition-badge";
import { ConditionMenu } from "./condition-menu";
import { PatientDetailsSheet } from "./patient-details-sheet";
import { PatientFormDialog, type PatientDialogState } from "./patient-form-dialog";
import { PatientRowActions } from "./patient-row-actions";

const FILTER_KEYS = ["q", "condition", "gender", "from", "to"] as const;
const NO_SELECTION: ReadonlySet<string> = new Set();
const SORT_KEYS = ["admittedAt", "name", "age"];
const DEFAULT_SORT: SortState = { by: "admittedAt", order: "desc" };
// Names and ages read naturally A→Z / youngest first; dates newest first.
const defaultOrder = (key: string) => (key === "admittedAt" ? "desc" : "asc");

function PatientCard({ patient, showDoctor }: { patient: Patient; showDoctor: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <NameAvatar name={patient.name} className="size-10" fallbackClassName="text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{patient.name}</p>
          <ConditionBadge condition={patient.condition} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {patient.age} · {GENDER_LABELS[patient.gender]}
          {showDoctor && patient.doctor ? ` · ${patient.doctor.name}` : ""} · {formatDate(patient.admittedAt)}
        </p>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

/**
 * Patient list with search, filters, sorting and pagination. Used on the Patients page
 * (all patients) and on a doctor's page (scoped to that doctor, with "Add patient").
 */
export function PatientsPanel({ doctor }: { doctor?: { id: string; name: string } }) {
  const { get, setParams } = useQueryParams();
  const queryClient = useQueryClient();
  const deletePatient = useDeletePatient();
  const pendingDeletes = usePendingDeletes();
  const { highlightedId, highlight } = useRowHighlight();

  const [dialog, setDialog] = useState<PatientDialogState | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);
  // Checked rows, tied to the exact list they were picked from: changing page or filters clears them.
  const [selection, setSelection] = useState<{ key: string; ids: Set<string> }>({ key: "", ids: new Set() });

  const page = parsePage(get("page"));
  const limit = [10, 20, 50].includes(Number(get("limit"))) ? Number(get("limit")) : 10;
  const search = get("q");
  const condition = get("condition");
  const gender = get("gender");
  const from = get("from");
  const to = get("to");
  const sortBy = SORT_KEYS.includes(get("sortBy") ?? "") ? get("sortBy")! : DEFAULT_SORT.by;
  const order = get("order") === "asc" || get("order") === "desc" ? (get("order") as "asc" | "desc") : defaultOrder(sortBy);
  const sort = useMemo<SortState>(() => ({ by: sortBy, order }), [sortBy, order]);
  const doctorId = doctor?.id;

  const params = useMemo<PatientListParams>(
    () => ({ page, limit, search, condition, gender, from, to, sortBy, order, doctor: doctorId }),
    [page, limit, search, condition, gender, from, to, sortBy, order, doctorId],
  );

  const { data, error, isPending, isPlaceholderData, isError, refetch } = usePatients(params);
  const selectionKey = JSON.stringify(params);
  // Patients waiting out their undo window are hidden everywhere.
  const rows = useMemo(
    () => (data?.data ?? []).filter((patient) => !pendingDeletes.has(patient._id)),
    [data, pendingDeletes],
  );
  // Read the open patient from the list so in-place changes (like condition) show in the panel.
  const selectedPatient = selected ? (rows.find((patient) => patient._id === selected._id) ?? selected) : null;
  const selectedIds = useMemo<ReadonlySet<string>>(
    () =>
      selection.key === selectionKey
        ? new Set([...selection.ids].filter((id) => !pendingDeletes.has(id)))
        : NO_SELECTION,
    [selection, selectionKey, pendingDeletes],
  );
  const hiddenCount = (data?.data.length ?? 0) - rows.length;
  const meta = data?.meta && { ...data.meta, total: Math.max(0, data.meta.total - hiddenCount) };
  const loading = isPending || isPlaceholderData;
  const hasFilters = FILTER_KEYS.some((key) => get(key));

  // Warm the cache for the next page so "Next" feels instant.
  useEffect(() => {
    if (data?.meta && !isPlaceholderData && data.meta.page < data.meta.totalPages) {
      void queryClient.prefetchQuery(patientListOptions({ ...params, page: data.meta.page + 1 }));
    }
  }, [data, isPlaceholderData, params, queryClient]);

  // Deleting the last row of the last page would leave an empty page behind.
  useEffect(() => {
    if (data?.meta && !isPlaceholderData && data.data.length === 0 && data.meta.page > 1) {
      setParams({ page: Math.min(data.meta.page - 1, data.meta.totalPages) }, { history: "replace" });
    }
  }, [data, isPlaceholderData, setParams]);

  const clearFilters = useCallback(
    () => setParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]))),
    [setParams],
  );

  const openCreate = useCallback(
    () => setDialog({ mode: "create", doctor: doctor && { id: doctor.id, name: doctor.name } }),
    [doctor],
  );
  useHotkey("n", openCreate);

  // `?new=1` (used by the command menu) opens the "Add patient" dialog.
  const wantsNew = get("new") === "1";
  const dialogState: PatientDialogState | null = dialog ?? (wantsNew ? { mode: "create" } : null);
  const closeDialog = useCallback(() => {
    setDialog(null);
    if (wantsNew) setParams({ new: undefined }, { history: "replace" });
  }, [wantsNew, setParams]);

  const openEdit = useCallback((patient: Patient) => {
    setSelected(null);
    setDialog({ mode: "edit", patient });
  }, []);

  const removePatient = useCallback(
    (patient: Patient) => {
      setSelected(null);
      deletePatient(patient, {
        onError: (deleteError) =>
          toast.error(`Could not delete ${patient.name}`, { description: getErrorMessage(deleteError) }),
      });
      toast(`${patient.name} was deleted`, {
        duration: UNDO_WINDOW_MS,
        action: {
          label: "Undo",
          onClick: () => {
            if (undoDeletePatient(patient._id)) {
              highlight(patient._id);
              toast.success(`${patient.name} was restored`);
            }
          },
        },
      });
    },
    [deletePatient, highlight],
  );

  const clearSelection = () => setSelection({ key: selectionKey, ids: new Set() });

  const exportSelected = () => {
    const chosen = rows.filter((patient) => selectedIds.has(patient._id));
    downloadCsv(
      `patients-selected-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Age", "Gender", "Phone", "Condition", "Doctor", "Specialization", "Admitted"],
      chosen.map((patient) => [
        patient.name,
        patient.age,
        patient.gender,
        patient.phone,
        patient.condition,
        patient.doctor?.name,
        patient.doctor?.specialization,
        patient.admittedAt.slice(0, 10),
      ]),
    );
    toast.success(`Exported ${chosen.length} ${chosen.length === 1 ? "patient" : "patients"}`);
  };

  const removeSelected = () => {
    const targets = rows.filter((patient) => selectedIds.has(patient._id));
    for (const patient of targets) {
      deletePatient(patient, {
        onError: (deleteError) =>
          toast.error(`Could not delete ${patient.name}`, { description: getErrorMessage(deleteError) }),
      });
    }
    clearSelection();
    const label = `${targets.length} ${targets.length === 1 ? "patient" : "patients"}`;
    toast(`${label} deleted`, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          const restored = targets.filter((patient) => undoDeletePatient(patient._id));
          if (restored.length > 0) toast.success(`${restored.length} restored`);
        },
      },
    });
  };

  const changeSort = useCallback(
    (key: string) => {
      const next = nextSort(sort, key, defaultOrder);
      const isDefault = next.by === DEFAULT_SORT.by && next.order === DEFAULT_SORT.order;
      setParams({ sortBy: isDefault ? undefined : next.by, order: isDefault ? undefined : next.order });
    },
    [sort, setParams],
  );

  const activeFilters: ActiveFilter[] = [
    search && { key: "q", label: "Search", value: `“${search}”`, onRemove: () => setParams({ q: undefined }) },
    condition && {
      key: "condition",
      label: "Condition",
      value: CONDITION_LABELS[condition as Condition] ?? condition,
      onRemove: () => setParams({ condition: undefined }),
    },
    gender && {
      key: "gender",
      label: "Gender",
      value: GENDER_LABELS[gender as Gender] ?? gender,
      onRemove: () => setParams({ gender: undefined }),
    },
    (from || to) && {
      key: "dates",
      label: "Admitted",
      value: formatRange({ from, to }) ?? "",
      onRemove: () => setParams({ from: undefined, to: undefined }),
    },
  ].filter((filter): filter is ActiveFilter => Boolean(filter));

  const exportHref = useMemo(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ search, condition, gender, from, to, doctor: doctorId, sortBy, order })) {
      if (value) query.set(key, value);
    }
    return `/api/v1/patients/export?${query.toString()}`;
  }, [search, condition, gender, from, to, doctorId, sortBy, order]);

  const columns = useMemo<DataTableColumn<Patient>[]>(() => {
    const all: Array<DataTableColumn<Patient> | false> = [
      {
        key: "patient",
        header: "Patient",
        sortKey: "name",
        skeleton: { width: "w-32", variant: "avatar" },
        cell: (patient) => (
          <div className="flex items-center gap-3">
            <NameAvatar name={patient.name} className="size-9" fallbackClassName="text-xs" />
            <div className="max-w-[11rem] min-w-0 xl:max-w-none">
              <p className="truncate font-medium">{patient.name}</p>
              <p className="truncate text-xs text-muted-foreground">{patient.phone}</p>
            </div>
          </div>
        ),
      },
      {
        key: "demographics",
        header: "Age / Gender",
        sortKey: "age",
        skeleton: { width: "w-20" },
        cell: (patient) => (
          <span className="whitespace-nowrap text-muted-foreground">
            <span className="text-foreground">{patient.age}</span> · {GENDER_LABELS[patient.gender]}
          </span>
        ),
      },
      {
        key: "condition",
        header: "Condition",
        skeleton: { width: "w-24", variant: "badge" },
        cell: (patient) => (
          <div onClick={(event) => event.stopPropagation()}>
            <ConditionMenu patient={patient} />
          </div>
        ),
      },
      !doctorId && {
        key: "doctor",
        header: "Doctor",
        className: "hidden xl:table-cell",
        skeleton: { width: "w-32" },
        cell: (patient) =>
          patient.doctor ? (
            <Link
              href={`/doctors/${patient.doctor._id}`}
              onClick={(event) => event.stopPropagation()}
              className="group inline-block rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="font-medium underline-offset-4 transition-colors group-hover:text-primary group-hover:underline">
                {patient.doctor.name}
              </span>
              <span className="block text-xs text-muted-foreground">{patient.doctor.specialization}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "admitted",
        header: "Admitted",
        sortKey: "admittedAt",
        className: "hidden lg:table-cell",
        skeleton: { width: "w-24" },
        cell: (patient) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(patient.admittedAt)}</span>,
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        skeleton: { width: "w-8", variant: "action" },
        cell: (patient) => (
          // Keep menu clicks from also opening the details panel.
          <div onClick={(event) => event.stopPropagation()}>
            <PatientRowActions patient={patient} onEdit={openEdit} onDelete={removePatient} />
          </div>
        ),
      },
    ];
    return all.filter((column): column is DataTableColumn<Patient> => Boolean(column));
  }, [doctorId, openEdit, removePatient]);

  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Patients">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center">
        <SearchInput
          value={search ?? ""}
          onChange={(value) => setParams({ q: value }, { history: "replace" })}
          placeholder="Search by name or phone"
          className="w-full sm:max-w-sm lg:max-w-md lg:min-w-64 lg:flex-1"
        />
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
          <ResponsiveFilters
            activeCount={[condition, gender, from || to].filter(Boolean).length}
            onClear={() => setParams({ condition: undefined, gender: undefined, from: undefined, to: undefined })}
            render={(placement) => (
              <>
                <FilterSelect
                  label="Condition"
                  allLabel="All conditions"
                  value={condition}
                  options={CONDITION_OPTIONS}
                  onChange={(value) => setParams({ condition: value })}
                  className={placement === "sheet" ? "sm:w-full" : "sm:w-44"}
                />
                <FilterSelect
                  label="Gender"
                  allLabel="All genders"
                  value={gender}
                  options={GENDER_OPTIONS}
                  onChange={(value) => setParams({ gender: value })}
                  className={placement === "sheet" ? "sm:w-full" : "sm:w-36"}
                />
                <DateRangePicker
                  label="Admitted"
                  from={from}
                  to={to}
                  onChange={(range) => setParams(range)}
                  fullWidth={placement === "sheet"}
                />
              </>
            )}
          />
          <ExportButton href={exportHref} />
          <Button size="lg" onClick={openCreate}>
            <PlusIcon /> Add patient
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="animate-content-in hidden items-center gap-2 border-b bg-primary/5 px-4 py-2 md:flex"
        >
          <span className="text-sm font-semibold">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportSelected}>
              <DownloadIcon /> Export selected
            </Button>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              <Trash2Icon /> Delete selected
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <ActiveFilters filters={activeFilters} onClearAll={clearFilters} />

      {isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <DataTable
            caption={doctor ? `Patients of ${doctor.name}` : "All patients"}
            columns={columns}
            rows={rows}
            getRowId={(patient) => patient._id}
            loading={loading}
            skeletonRows={limit}
            highlightedId={highlightedId}
            onRowClick={setSelected}
            sort={sort}
            onSortChange={changeSort}
            renderCard={(patient) => <PatientCard patient={patient} showDoctor={!doctorId} />}
            selection={{ selectedIds, onChange: (ids) => setSelection({ key: selectionKey, ids }) }}
            emptyState={
              hasFilters ? (
                <EmptyState
                  icon={UsersIcon}
                  title="No patients match these filters"
                  description="Try a different search term or remove some filters."
                  action={
                    <Button variant="outline" size="lg" onClick={clearFilters}>
                      <FilterXIcon /> Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={UsersIcon}
                  title="No patients yet"
                  description={doctor ? `Add the first patient for ${doctor.name}.` : "Add a patient and choose their doctor."}
                  action={
                    <Button size="lg" onClick={openCreate}>
                      <PlusIcon /> Add patient
                    </Button>
                  }
                />
              )
            }
          />
          <PaginationBar
            meta={meta}
            itemLabel="patients"
            onPageChange={(nextPage) => setParams({ page: nextPage === 1 ? undefined : nextPage })}
            onLimitChange={(nextLimit) => setParams({ limit: nextLimit === 10 ? undefined : nextLimit })}
          />
        </>
      )}

      <PatientDetailsSheet patient={selectedPatient} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={removePatient} />
      <PatientFormDialog state={dialogState} onClose={closeDialog} onSaved={highlight} />
    </section>
  );
}
