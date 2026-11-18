"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, getErrorMessage } from "@/lib/api-client";

import { useServerFeatures } from "@/hooks/use-server-features";

import { useCreateDoctor, useDoctorFilterOptions, useDoctorPhoto, useUpdateDoctor, type Doctor } from "../api";
import { PhotoField, type PhotoChange } from "./photo-field";
import { doctorFormSchema, type DoctorFormValues } from "../schema";

export type DoctorDialogState = { mode: "create" } | { mode: "edit"; doctor: Doctor };

function DoctorForm({
  state,
  onClose,
  onSaved,
}: {
  state: DoctorDialogState;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const isEdit = state.mode === "edit";
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const saveDoctorPhoto = useDoctorPhoto();
  const { data: options } = useDoctorFilterOptions();
  const { data: features } = useServerFeatures();
  const [photo, setPhoto] = useState<PhotoChange>({ kind: "keep" });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: isEdit
      ? {
          name: state.doctor.name,
          specialization: state.doctor.specialization,
          hospital: state.doctor.hospital,
          phone: state.doctor.phone,
          email: state.doctor.email,
        }
      : { name: "", specialization: "", hospital: "", phone: "", email: "" },
  });

  // Live name for the photo placeholder initials.
  const name = useWatch({ control, name: "name" });

  const onSubmit = handleSubmit(async (values) => {
    let saved: Doctor;
    try {
      if (!isEdit) saved = (await createDoctor.mutateAsync(values)).data;
      else if (isDirty) saved = (await updateDoctor.mutateAsync({ id: state.doctor._id, values })).data;
      else saved = state.doctor;
    } catch (error) {
      // Show server-side validation (for example a duplicate email) next to the field.
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof DoctorFormValues, { message }, { shouldFocus: true });
        }
      }
      toast.error(isEdit ? "Could not update the doctor" : "Could not add the doctor", {
        description: getErrorMessage(error),
      });
      return;
    }

    // The doctor is saved; the photo is a separate upload so a failure here never loses the details.
    let photoFailed: unknown = null;
    if (photo.kind !== "keep") {
      try {
        await saveDoctorPhoto.mutateAsync({ id: saved._id, photo: photo.kind === "set" ? photo.file : null });
      } catch (error) {
        photoFailed = error;
      }
    }

    if (photoFailed) {
      toast.warning(`${saved.name} was saved, but the photo was not`, {
        description: getErrorMessage(photoFailed),
      });
    } else {
      toast.success(isEdit ? `${saved.name} was updated` : `${saved.name} was added`);
    }
    onSaved?.(saved._id);
    onClose();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {features?.photoUploads ? (
        <div className="sm:col-span-2">
          <PhotoField
            name={name}
            currentUrl={isEdit ? state.doctor.photoUrl : null}
            value={photo}
            onChange={setPhoto}
            disabled={isSubmitting}
          />
        </div>
      ) : null}

      <FormField id="doctor-name" label="Full name" error={errors.name?.message} className="sm:col-span-2">
        <Input id="doctor-name" autoFocus={!isEdit} placeholder="e.g. Dr. Sarah Ahmed" aria-invalid={Boolean(errors.name)} className="h-9" {...register("name")} />
      </FormField>

      <FormField id="doctor-specialization" label="Specialization" error={errors.specialization?.message}>
        <Input id="doctor-specialization" list="specialization-options" placeholder="e.g. Cardiology" aria-invalid={Boolean(errors.specialization)} className="h-9" {...register("specialization")} />
        <datalist id="specialization-options">
          {options?.specializations.map((value) => <option key={value} value={value} />)}
        </datalist>
      </FormField>

      <FormField id="doctor-hospital" label="Hospital" error={errors.hospital?.message}>
        <Input id="doctor-hospital" list="hospital-options" placeholder="e.g. City General Hospital" aria-invalid={Boolean(errors.hospital)} className="h-9" {...register("hospital")} />
        <datalist id="hospital-options">
          {options?.hospitals.map((value) => <option key={value} value={value} />)}
        </datalist>
      </FormField>

      <FormField id="doctor-phone" label="Phone" error={errors.phone?.message}>
        <Input id="doctor-phone" type="tel" placeholder="e.g. +880 1712 345678" aria-invalid={Boolean(errors.phone)} className="h-9" {...register("phone")} />
      </FormField>

      <FormField id="doctor-email" label="Email" error={errors.email?.message}>
        <Input id="doctor-email" type="email" placeholder="e.g. doctor@hospital.com" aria-invalid={Boolean(errors.email)} className="h-9" {...register("email")} />
      </FormField>

      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <SubmitButton pending={isSubmitting} size="lg" disabled={isEdit && !isDirty && photo.kind === "keep"}>
          {isEdit ? "Save changes" : "Add doctor"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function DoctorFormDialog({
  state,
  onClose,
  onSaved,
}: {
  state: DoctorDialogState | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {state ? (
          <>
            <DialogHeader>
              <DialogTitle>{state.mode === "edit" ? "Edit doctor" : "Add doctor"}</DialogTitle>
              <DialogDescription>
                {state.mode === "edit"
                  ? `Update the details for ${state.doctor.name}.`
                  : "Enter the doctor's details. You can add patients afterwards."}
              </DialogDescription>
            </DialogHeader>
            <DoctorForm
              key={state.mode === "edit" ? state.doctor._id : "create"}
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
