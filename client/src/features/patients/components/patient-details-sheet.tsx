"use client";

import Link from "next/link";
import { CalendarIcon, PencilIcon, PhoneIcon, StethoscopeIcon, Trash2Icon, UserIcon, type LucideIcon } from "lucide-react";

import { NameAvatar } from "@/components/shared/name-avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";

import type { Patient } from "../api";
import { GENDER_LABELS } from "../constants";
import { ConditionMenu } from "./condition-menu";

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** Read-only patient details beside the list, with edit and delete. */
export function PatientDetailsSheet({
  patient,
  onClose,
  onEdit,
  onDelete,
}: {
  patient: Patient | null;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return (
    <Sheet open={patient !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {patient ? (
          <>
            <SheetHeader className="border-b pb-5">
              <div className="flex items-center gap-4">
                <NameAvatar name={patient.name} className="size-14" fallbackClassName="text-lg" />
                <div className="min-w-0 space-y-1.5">
                  <SheetTitle className="truncate text-lg">{patient.name}</SheetTitle>
                  <SheetDescription asChild>
                    <div>
                      <ConditionMenu patient={patient} />
                    </div>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <dl className="flex-1 divide-y overflow-y-auto px-4">
              <Detail icon={UserIcon} label="Age and gender">
                {patient.age} years · {GENDER_LABELS[patient.gender]}
              </Detail>
              <Detail icon={PhoneIcon} label="Phone">
                <a href={`tel:${patient.phone}`} className="hover:text-primary">
                  {patient.phone}
                </a>
              </Detail>
              <Detail icon={StethoscopeIcon} label="Doctor">
                {patient.doctor ? (
                  <Link href={`/doctors/${patient.doctor._id}`} onClick={onClose} className="hover:text-primary hover:underline">
                    {patient.doctor.name}
                    <span className="block text-xs font-normal text-muted-foreground">{patient.doctor.specialization}</span>
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail icon={CalendarIcon} label="Admitted">
                {formatDate(patient.admittedAt)}
              </Detail>
            </dl>

            <SheetFooter className="flex-row border-t">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => onEdit(patient)}>
                <PencilIcon /> Edit
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={() => onDelete(patient)}>
                <Trash2Icon /> Delete
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
