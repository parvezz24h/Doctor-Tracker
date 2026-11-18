"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { toDateInputValue } from "@/lib/format";

import { DoctorPicker, type PickedDoctor } from "@/features/doctors/components/doctor-picker";

import { useCreatePatient, useUpdatePatient, type Patient } from "../api";
import { CONDITION_OPTIONS, GENDER_OPTIONS } from "../constants";
import { patientFormSchema, type PatientFormValues } from "../schema";

export type PatientDialogState =
  /** Without `doctor`, the form asks which doctor the patient belongs to. */
  | { mode: "create"; doctor?: { id: string; name: string } }
  | { mode: "edit"; patient: Patient };

const today = () => toDateInputValue(new Date());

function PatientForm({
  state,
  onClose,
  onSaved,
}: {
  state: PatientDialogState;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const isEdit = state.mode === "edit";
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const presetDoctor = state.mode === "create" ? state.doctor : undefined;
  const needsDoctor = state.mode === "create" && !presetDoctor;
  const [pickedDoctor, setPickedDoctor] = useState<PickedDoctor | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: isEdit
      ? {
          name: state.patient.name,
          age: state.patient.age,
          gender: state.patient.gender,
          phone: state.patient.phone,
          condition: state.patient.condition,
          admittedAt: toDateInputValue(state.patient.admittedAt),
        }
      : { name: "", phone: "", condition: "stable", admittedAt: today() },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        // The table already shows the change (optimistic update), so close right away.
        onClose();
        onSaved?.(state.patient._id);
        await updatePatient.mutateAsync({ id: state.patient._id, values });
        toast.success("Patient updated");
      } else {
        const doctor = presetDoctor ?? (pickedDoctor && { id: pickedDoctor._id, name: pickedDoctor.name });
        if (!doctor) {
          setDoctorError("Choose the doctor this patient belongs to");
          return;
        }
        const { data } = await createPatient.mutateAsync({ doctorId: doctor.id, values });
        toast.success(`${data.name} added to ${doctor.name}`);
        onSaved?.(data._id);
        onClose();
      }
    } catch (error) {
      if (!isEdit && error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof PatientFormValues, { message });
        }
      }
      toast.error(isEdit ? "Could not update the patient" : "Could not add the patient", {
        description: getErrorMessage(error),
      });
    }
  });

  return (
    <form
      onSubmit={(event) => {
        // Check the doctor alongside the other fields, so all errors show at once.
        if (needsDoctor && !pickedDoctor) setDoctorError("Choose the doctor this patient belongs to");
        void onSubmit(event);
      }}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      {needsDoctor ? (
        <FormField id="patient-doctor" label="Doctor" error={doctorError ?? undefined} className="sm:col-span-2">
          <DoctorPicker
            id="patient-doctor"
            value={pickedDoctor}
            invalid={Boolean(doctorError)}
            disabled={isSubmitting}
            onChange={(doctor) => {
              setPickedDoctor(doctor);
              setDoctorError(null);
            }}
          />
        </FormField>
      ) : null}

      <FormField id="patient-name" label="Full name" error={errors.name?.message} className="sm:col-span-2">
        <Input id="patient-name" autoFocus={!isEdit} placeholder="e.g. Jane Cooper" aria-invalid={Boolean(errors.name)} className="h-9" {...register("name")} />
      </FormField>

      <FormField id="patient-age" label="Age" error={errors.age?.message}>
        <Input id="patient-age" type="number" inputMode="numeric" min={0} max={130} placeholder="e.g. 42" aria-invalid={Boolean(errors.age)} className="h-9" {...register("age", { valueAsNumber: true })} />
      </FormField>

      <FormField id="patient-gender" label="Gender" error={errors.gender?.message}>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="patient-gender" aria-invalid={Boolean(errors.gender)} className="w-full data-[size=default]:h-9">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField id="patient-phone" label="Phone" error={errors.phone?.message}>
        <Input id="patient-phone" type="tel" placeholder="e.g. +880 1712 345678" aria-invalid={Boolean(errors.phone)} className="h-9" {...register("phone")} />
      </FormField>

      <FormField id="patient-condition" label="Condition" error={errors.condition?.message}>
        <Controller
          control={control}
          name="condition"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="patient-condition" aria-invalid={Boolean(errors.condition)} className="w-full data-[size=default]:h-9">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField id="patient-admitted" label="Admission date" error={errors.admittedAt?.message} className="sm:col-span-2">
        <Input id="patient-admitted" type="date" max={today()} aria-invalid={Boolean(errors.admittedAt)} className="h-9" {...register("admittedAt")} />
      </FormField>

      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <SubmitButton pending={isSubmitting} size="lg" disabled={isEdit && !isDirty}>
          {isEdit ? "Save changes" : "Add patient"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function PatientFormDialog({
  state,
  onClose,
  onSaved,
}: {
  state: PatientDialogState | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {state ? (
          <>
            <DialogHeader>
              <DialogTitle>{state.mode === "edit" ? "Edit patient" : "Add patient"}</DialogTitle>
              <DialogDescription>
                {state.mode === "edit"
                  ? `Update the details for ${state.patient.name}.`
                  : state.doctor
                    ? `The patient will be added under ${state.doctor.name}.`
                    : "Choose the doctor and enter the patient's details."}
              </DialogDescription>
            </DialogHeader>
            {/* Keyed so the form resets whenever a different record is opened. */}
            <PatientForm
              key={state.mode === "edit" ? state.patient._id : (state.doctor?.id ?? "new")}
              state={state}
              onClose={onClose}
              onSaved={onSaved}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
