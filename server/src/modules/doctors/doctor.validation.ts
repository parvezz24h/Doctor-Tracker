import { z } from "zod";

import { optionalQuery, paginationQuery, sortOrder } from "../../utils/validation.js";

export const doctorBody = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  specialization: z.string().trim().min(2, "Specialization is required").max(80),
  hospital: z.string().trim().min(2, "Hospital is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address").trim().toLowerCase().max(160),
});

export const doctorUpdateBody = doctorBody.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update",
});

export const DOCTOR_SORT_FIELDS = ["createdAt", "name", "specialization", "hospital"] as const;

export const listDoctorsQuery = z.object({
  ...paginationQuery,
  specialization: optionalQuery(z.string().trim().max(80)),
  hospital: optionalQuery(z.string().trim().max(120)),
  sortBy: z.enum(DOCTOR_SORT_FIELDS).default("createdAt"),
  order: sortOrder,
});

/** Same filters as the list, without paging (used by the CSV export). */
export const exportDoctorsQuery = listDoctorsQuery.omit({ page: true, limit: true });

export type DoctorInput = z.infer<typeof doctorBody>;
export type DoctorUpdateInput = z.infer<typeof doctorUpdateBody>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuery>;
export type DoctorFilters = z.infer<typeof exportDoctorsQuery>;
