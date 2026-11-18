import { Schema, model, type InferSchemaType } from "mongoose";

export const GENDERS = ["male", "female", "other"] as const;
export const CONDITIONS = ["stable", "critical", "recovering", "under_observation"] as const;

const patientSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    condition: { type: String, enum: CONDITIONS, required: true, default: "stable" },
    admittedAt: { type: Date, required: true, default: Date.now },
    // Lowercase words of the searchable fields; see utils/search.ts.
    searchTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true, versionKey: false },
);

// Every list sorts by `admittedAt` plus `_id` as a tiebreaker (stable pagination), so the
// tiebreaker is part of each index — otherwise MongoDB has to sort in memory.

// A doctor's patient list, newest first; also serves "patients per doctor" grouping.
patientSchema.index({ doctor: 1, admittedAt: -1, _id: -1 });
// Condition / gender filter + date sort and range.
patientSchema.index({ condition: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ gender: 1, admittedAt: -1, _id: -1 });
// Default listing, date-range filter and date-based dashboard statistics.
patientSchema.index({ admittedAt: -1, _id: -1 });
// Prefix search.
patientSchema.index({ searchTokens: 1 });
// Column sorting by name or age.
patientSchema.index({ name: 1, _id: 1 });
patientSchema.index({ age: 1, _id: 1 });

export type Patient = InferSchemaType<typeof patientSchema>;
export const PatientModel = model("Patient", patientSchema);
