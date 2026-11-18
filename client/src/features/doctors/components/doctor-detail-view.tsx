"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2Icon,
  CalendarIcon,
  MailIcon,
  MoreVerticalIcon,
  PencilIcon,
  PhoneIcon,
  Trash2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailCardSkeleton } from "@/components/shared/skeletons";
import { ErrorState } from "@/components/shared/states";
import { Tag } from "@/components/shared/tag";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientsPanel } from "@/features/patients/components/patients-panel";
import { PatientsPanelSkeleton } from "@/features/patients/components/patients-panel-skeleton";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { formatDate, formatNumber } from "@/lib/format";

import { useDeleteDoctor, useDoctor } from "../api";
import { DoctorAvatar } from "./doctor-avatar";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { DoctorStats, DoctorStatsSkeleton } from "./doctor-stats";

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" className="-ml-2 text-muted-foreground">
      <Link href="/doctors">
        <ArrowLeftIcon /> All doctors
      </Link>
    </Button>
  );
}

export function DoctorDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: doctor, error, isPending, isError, refetch } = useDoctor(id);
  const deleteDoctor = useDeleteDoctor();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isPending) return <DoctorDetailSkeleton />;

  if (isError) {
    const notFound =
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400);
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border bg-card">
          <ErrorState
            message={
              notFound
                ? "This doctor does not exist or has been deleted."
                : getErrorMessage(error)
            }
            onRetry={notFound ? undefined : () => void refetch()}
          />
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteDoctor.mutate(doctor._id, {
      onSuccess: () => {
        toast.success(`${doctor.name} was deleted`);
        router.replace("/doctors");
      },
      onError: (deleteError) => {
        toast.error(`Could not delete ${doctor.name}`, {
          description: getErrorMessage(deleteError),
        });
        setConfirmingDelete(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Wide screens: profile in a sticky left column, patients use the remaining width. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:items-start">
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-1">
        <section className="animate-content-in rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center 2xl:flex-col 2xl:items-start">
            <DoctorAvatar
              name={doctor.name}
              photoUrl={doctor.photoUrl}
              shape="rounded"
              className="size-16"
              fallbackClassName="text-xl"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {doctor.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Tag>{doctor.specialization}</Tag>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  {formatNumber(doctor.patientCount)}{" "}
                  {doctor.patientCount === 1 ? "patient" : "patients"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 2xl:w-full">
              <Button variant="outline" size="lg" className="2xl:flex-1" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit
              </Button>
              {/* Delete sits behind a menu so it is never one stray click away. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-lg" aria-label="More actions">
                    <MoreVerticalIcon className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingDelete(true)}>
                    <Trash2Icon /> Delete doctor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <dl className="mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2 2xl:grid-cols-1">
            <InfoItem icon={Building2Icon} label="Hospital">
              {doctor.hospital}
            </InfoItem>
            <InfoItem icon={PhoneIcon} label="Phone">
              <a href={`tel:${doctor.phone}`} className="hover:text-primary">
                {doctor.phone}
              </a>
            </InfoItem>
            <InfoItem icon={MailIcon} label="Email">
              <a href={`mailto:${doctor.email}`} className="hover:text-primary">
                {doctor.email}
              </a>
            </InfoItem>
            <InfoItem icon={CalendarIcon} label="Added">
              {formatDate(doctor.createdAt)}
            </InfoItem>
          </dl>
        </section>
        <DoctorStats doctorId={doctor._id} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Patients</h2>
          <PatientsPanel doctor={{ id: doctor._id, name: doctor.name }} />
        </div>
      </div>

      <DoctorFormDialog
        state={editing ? { mode: "edit", doctor } : null}
        onClose={() => setEditing(false)}
      />
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={(open) =>
          !deleteDoctor.isPending && setConfirmingDelete(open)
        }
        title="Delete this doctor?"
        pending={deleteDoctor.isPending}
        description={
          doctor.patientCount > 0 ? (
            <>
              <span className="font-medium text-foreground">{doctor.name}</span>{" "}
              still has {formatNumber(doctor.patientCount)}{" "}
              {doctor.patientCount === 1 ? "patient" : "patients"}. Remove them
              first — a doctor with patients cannot be deleted.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{doctor.name}</span>{" "}
              will be permanently removed. This cannot be undone.
            </>
          )
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

export function DoctorDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading doctor">
      <div className="h-8" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:items-start">
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-1">
          <DetailCardSkeleton />
          <DoctorStatsSkeleton />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <PatientsPanelSkeleton />
        </div>
      </div>
    </div>
  );
}
