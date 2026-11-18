import { z } from "zod";

import { CONDITIONS, GENDERS } from "./constants";

export const patientFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  age: z
    .number("Enter the patient's age")
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(130, "Enter a realistic age"),
  gender: z.enum(GENDERS, "Select a gender"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  condition: z.enum(CONDITIONS, "Select a condition"),
  admittedAt: z.iso.date("Pick the admission date"),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
