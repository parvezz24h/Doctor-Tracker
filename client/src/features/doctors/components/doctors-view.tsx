"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  EyeIcon,
  FilterXIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  StethoscopeIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ActiveFilters, type ActiveFilter } from "@/components/shared/active-filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, nextSort, type DataTableColumn, type SortState } from "@/components/shared/data-table";
import { DateRangePicker, formatRange } from "@/components/shared/date-range-picker";
import { ExportButton } from "@/components/shared/export-button";
import { FilterSelect } from "@/components/shared/filter-select";
import { Kbd } from "@/components/shared/kbd";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
import { SearchInput } from "@/components/shared/search-input";
import { Tag } from "@/components/shared/tag";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHotkey } from "@/hooks/use-hotkey";
import { parsePage, useQueryParams } from "@/hooks/use-query-params";
import { useRowHighlight } from "@/hooks/use-row-highlight";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatNumber } from "@/lib/format";

import { doctorListOptions, useDeleteDoctor, useDoctorFilterOptions, useDoctors, type Doctor, type DoctorListParams } from "../api";
import { DoctorAvatar } from "./doctor-avatar";
import { DoctorFormDialog, type DoctorDialogState } from "./doctor-form-dialog";

const FILTER_KEYS = ["q", "specialization", "hospital", "from", "to"] as const;
const SORT_KEYS = ["createdAt", "name", "specialization", "hospital"];
const DEFAULT_SORT: SortState = { by: "createdAt", order: "desc" };
const defaultOrder = (key: string) => (key === "createdAt" ? "desc" : "asc");

const toOptions = (values: string[] | undefined) => (values ?? []).map((value) => ({ value, label: value }));

function DoctorRowActions({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}) {
  return (
    // Keep clicks inside the menu from also triggering the row's navigation.
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${doctor.name}`}>
            <MoreVerticalIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/doctors/${doctor._id}`}>
              <EyeIcon /> View patients
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(doctor)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(doctor)}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex items-center gap-3">
      <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} className="size-10" fallbackClassName="text-xs" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doctor.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {doctor.specialization} · {doctor.hospital}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground tabular-nums">
        <UsersIcon className="size-3.5" />
        {formatNumber(doctor.patientCount)}
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

export function DoctorsView() {
  const router = useRouter();
  const { get, setParams } = useQueryParams();
  const queryClient = useQueryClient();
  const deleteDoctor = useDeleteDoctor();
  const { data: filterOptions } = useDoctorFilterOptions();
  const { highlightedId, highlight } = useRowHighlight();

  const [dialog, setDialog] = useState<DoctorDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  const page = parsePage(get("page"));
  const limit = [10, 20, 50].includes(Number(get("limit"))) ? Number(get("limit")) : 10;
  const search = get("q");
  const specialization = get("specialization");
  const hospital = get("hospital");
  const from = get("from");
  const to = get("to");
  const sortBy = SORT_KEYS.includes(get("sortBy") ?? "") ? get("sortBy")! : DEFAULT_SORT.by;
  const order = get("order") === "asc" || get("order") === "desc" ? (get("order") as "asc" | "desc") : defaultOrder(sortBy);
  const sort = useMemo<SortState>(() => ({ by: sortBy, order }), [sortBy, order]);

  const params = useMemo<DoctorListParams>(
    () => ({ page, limit, search, specialization, hospital, from, to, sortBy, order }),
    [page, limit, search, specialization, hospital, from, to, sortBy, order],
  );

  const { data, error, isPending, isPlaceholderData, isError, refetch } = useDoctors(params);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const loading = isPending || isPlaceholderData;
  const hasFilters = FILTER_KEYS.some((key) => get(key));

  useEffect(() => {
    if (meta && !isPlaceholderData && meta.page < meta.totalPages) {
      void queryClient.prefetchQuery(doctorListOptions({ ...params, page: meta.page + 1 }));
    }
  }, [meta, isPlaceholderData, params, queryClient]);

  useEffect(() => {
    if (meta && !isPlaceholderData && rows.length === 0 && meta.page > 1) {
      setParams({ page: Math.min(meta.page - 1, meta.totalPages) }, { history: "replace" });
    }
  }, [meta, isPlaceholderData, rows.length, setParams]);

  // `?new=1` (used by the command menu) opens the "Add doctor" dialog.
  const wantsNew = get("new") === "1";
  const dialogState: DoctorDialogState | null = dialog ?? (wantsNew ? { mode: "create" } : null);
  const closeDialog = () => {
    setDialog(null);
    if (wantsNew) setParams({ new: undefined }, { history: "replace" });
  };

  const openCreate = useCallback(() => setDialog({ mode: "create" }), []);
  useHotkey("n", openCreate);

  const clearFilters = useCallback(
    () => setParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]))),
    [setParams],
  );
  const openEdit = useCallback((doctor: Doctor) => setDialog({ mode: "edit", doctor }), []);
  const openDoctor = useCallback((doctor: Doctor) => router.push(`/doctors/${doctor._id}`), [router]);

  const changeSort = useCallback(
    (key: string) => {
      const next = nextSort(sort, key, defaultOrder);
      const isDefault = next.by === DEFAULT_SORT.by && next.order === DEFAULT_SORT.order;
      setParams({ sortBy: isDefault ? undefined : next.by, order: isDefault ? undefined : next.order });
    },
    [sort, setParams],
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { _id, name } = deleteTarget;
    deleteDoctor.mutate(_id, {
      onSuccess: () => {
        toast.success(`${name} was deleted`);
        setDeleteTarget(null);
      },
      onError: (deleteError) => {
        toast.error(`Could not delete ${name}`, { description: getErrorMessage(deleteError) });
        setDeleteTarget(null);
      },
    });
  };

  const activeFilters: ActiveFilter[] = [
    search && { key: "q", label: "Search", value: `“${search}”`, onRemove: () => setParams({ q: undefined }) },
    specialization && {
      key: "specialization",
      label: "Specialization",
      value: specialization,
      onRemove: () => setParams({ specialization: undefined }),
    },
    hospital && { key: "hospital", label: "Hospital", value: hospital, onRemove: () => setParams({ hospital: undefined }) },
    (from || to) && {
      key: "dates",
      label: "Added",
      value: formatRange({ from, to }) ?? "",
      onRemove: () => setParams({ from: undefined, to: undefined }),
    },
  ].filter((filter): filter is ActiveFilter => Boolean(filter));

  const exportHref = useMemo(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ search, specialization, hospital, from, to, sortBy, order })) {
      if (value) query.set(key, value);
    }
    return `/api/v1/doctors/export?${query.toString()}`;
  }, [search, specialization, hospital, from, to, sortBy, order]);

  const columns = useMemo<DataTableColumn<Doctor>[]>(
    () => [
      {
        key: "doctor",
        header: "Doctor",
        sortKey: "name",
        skeleton: { width: "w-36", variant: "avatar" },
        cell: (doctor) => (
          <div className="flex items-center gap-3">
            <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} className="size-9" fallbackClassName="text-xs" />
            <div className="max-w-[15rem] min-w-0 2xl:max-w-none">
              <Link
                href={`/doctors/${doctor._id}`}
                onClick={(event) => event.stopPropagation()}
                className="block truncate rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {doctor.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{doctor.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "specialization",
        header: "Specialization",
        sortKey: "specialization",
        skeleton: { width: "w-24", variant: "badge" },
        cell: (doctor) => (
          <Tag>{doctor.specialization}</Tag>
        ),
      },
      {
        key: "hospital",
        header: "Hospital",
        sortKey: "hospital",
        className: "hidden lg:table-cell",
        skeleton: { width: "w-36" },
        cell: (doctor) => <span className="text-muted-foreground">{doctor.hospital}</span>,
      },
      {
        key: "phone",
        header: "Phone",
        // Only on very wide screens; the number is on the doctor page and in the export.
        className: "hidden 2xl:table-cell",
        skeleton: { width: "w-28" },
        cell: (doctor) => <span className="whitespace-nowrap text-muted-foreground">{doctor.phone}</span>,
      },
      {
        key: "patients",
        header: "Patients",
        className: "text-right",
        skeleton: { width: "ml-auto w-10" },
        cell: (doctor) => <span className="font-medium tabular-nums">{formatNumber(doctor.patientCount)}</span>,
      },
      {
        key: "added",
        header: "Added",
        sortKey: "createdAt",
        // Shown from 1280px; on tablets the table would overflow (the date is on the doctor page).
        className: "hidden xl:table-cell",
        skeleton: { width: "w-24" },
        cell: (doctor) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(doctor.createdAt)}</span>,
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        skeleton: { width: "w-8", variant: "action" },
        cell: (doctor) => <DoctorRowActions doctor={doctor} onEdit={openEdit} onDelete={setDeleteTarget} />,
      },
    ],
    [openEdit],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Doctors" description="Manage doctors and open one to see their patients.">
        <Button size="lg" onClick={openCreate}>
          <PlusIcon /> Add doctor <Kbd className="ml-1 hidden border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground sm:inline-flex">N</Kbd>
        </Button>
      </PageHeader>

      <section className="overflow-hidden rounded-xl border bg-card" aria-label="Doctors">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput
            value={search ?? ""}
            onChange={(value) => setParams({ q: value }, { history: "replace" })}
            placeholder="Search name, specialization, hospital"
            className="w-full sm:max-w-sm lg:max-w-md lg:min-w-64 lg:flex-1"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
            <ResponsiveFilters
              activeCount={[specialization, hospital, from || to].filter(Boolean).length}
              onClear={() => setParams({ specialization: undefined, hospital: undefined, from: undefined, to: undefined })}
              render={(placement) => (
                <>
                  <FilterSelect
                    label="Specialization"
                    allLabel="All specializations"
                    value={specialization}
                    options={toOptions(filterOptions?.specializations)}
                    onChange={(value) => setParams({ specialization: value })}
                    className={placement === "sheet" ? "sm:w-full" : "sm:w-48"}
                  />
                  <FilterSelect
                    label="Hospital"
                    allLabel="All hospitals"
                    value={hospital}
                    options={toOptions(filterOptions?.hospitals)}
                    onChange={(value) => setParams({ hospital: value })}
                    className={placement === "sheet" ? "sm:w-full" : "sm:w-48"}
                  />
                  <DateRangePicker
                    label="Added"
                    from={from}
                    to={to}
                    onChange={(range) => setParams(range)}
                    fullWidth={placement === "sheet"}
                  />
                </>
              )}
            />
            <ExportButton href={exportHref} />
          </div>
        </div>

        <ActiveFilters filters={activeFilters} onClearAll={clearFilters} />

        {isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <>
            <DataTable
              caption="Doctors"
              columns={columns}
              rows={rows}
              getRowId={(doctor) => doctor._id}
              loading={loading}
              skeletonRows={limit}
              highlightedId={highlightedId}
              onRowClick={openDoctor}
              sort={sort}
              onSortChange={changeSort}
              renderCard={(doctor) => <DoctorCard doctor={doctor} />}
              emptyState={
                hasFilters ? (
                  <EmptyState
                    icon={StethoscopeIcon}
                    title="No doctors match these filters"
                    description="Try a different search term or remove some filters."
                    action={
                      <Button variant="outline" size="lg" onClick={clearFilters}>
                        <FilterXIcon /> Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={StethoscopeIcon}
                    title="No doctors yet"
                    description="Add your first doctor to start tracking their patients."
                    action={
                      <Button size="lg" onClick={openCreate}>
                        <PlusIcon /> Add doctor
                      </Button>
                    }
                  />
                )
              }
            />
            <PaginationBar
              meta={meta}
              itemLabel="doctors"
              onPageChange={(nextPage) => setParams({ page: nextPage === 1 ? undefined : nextPage })}
              onLimitChange={(nextLimit) => setParams({ limit: nextLimit === 10 ? undefined : nextLimit })}
            />
          </>
        )}
      </section>

      <DoctorFormDialog state={dialogState} onClose={closeDialog} onSaved={highlight} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !deleteDoctor.isPending && setDeleteTarget(null)}
        title="Delete this doctor?"
        pending={deleteDoctor.isPending}
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> will be permanently removed.
            A doctor who still has patients cannot be deleted.
          </>
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
