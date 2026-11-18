import { z } from "zod";

import { objectId, optionalQuery, paginationQuery, sortOrder } from "../../utils/validation.js";
import { CONDITIONS, GENDERS } from "./patient.model.js";

export const patientBody = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  age: z.coerce.number("Age is required").int("Age must be a whole number").min(0).max(130),
  gender: z.enum(GENDERS, "Select a gender"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  condition: z.enum(CONDITIONS, "Select a condition"),
  admittedAt: z.coerce
    .date("Enter a valid date")
    .max(new Date(Date.now() + 24 * 60 * 60 * 1000), "Admission date cannot be in the future")
    .optional(),
});

export const patientUpdateBody = patientBody.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update",
});

export const PATIENT_SORT_FIELDS = ["admittedAt", "name", "age"] as const;

export const listPatientsQuery = z.object({
  ...paginationQuery,
  condition: optionalQuery(z.enum(CONDITIONS)),
  gender: optionalQuery(z.enum(GENDERS)),
  doctor: optionalQuery(objectId),
  sortBy: z.enum(PATIENT_SORT_FIELDS).default("admittedAt"),
  order: sortOrder,
});

export const exportPatientsQuery = listPatientsQuery.omit({ page: true, limit: true });

export type PatientInput = z.infer<typeof patientBody>;
export type PatientUpdateInput = z.infer<typeof patientUpdateBody>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuery>;
export type PatientFilters = z.infer<typeof exportPatientsQuery>;
