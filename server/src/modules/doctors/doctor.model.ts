import { Schema, model, type InferSchemaType } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    specialization: { type: String, required: true, trim: true, maxlength: 80 },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    // Storage key of the profile photo; never sent to clients (they get `photoUrl`).
    photoKey: { type: String, default: null },
    // Lowercase words of the searchable fields; see utils/search.ts.
    searchTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true, versionKey: false },
);

doctorSchema.index({ email: 1 }, { unique: true });
// Every list sorts by a field plus `_id` as a tiebreaker (stable pagination), so the
// tiebreaker is part of each index — otherwise MongoDB has to sort in memory.

// Default listing and date-range filter.
doctorSchema.index({ createdAt: -1, _id: -1 });
// Equality filter first, then the sort keys, so filtered lists need no in-memory sort.
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
// Prefix search.
doctorSchema.index({ searchTokens: 1 });
// Alphabetical sort.
doctorSchema.index({ name: 1, _id: 1 });

export type Doctor = InferSchemaType<typeof doctorSchema>;
export const DoctorModel = model("Doctor", doctorSchema);
