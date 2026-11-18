import { z } from "zod";

export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  specialization: z.string().trim().min(2, "Enter a specialization").max(80, "Specialization is too long"),
  hospital: z.string().trim().min(2, "Enter a hospital").max(120, "Hospital name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address").max(160, "Email is too long"),
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;
