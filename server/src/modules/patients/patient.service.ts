import type { SortOrder } from "mongoose";

import { ApiError } from "../../utils/api-error.js";
import { buildMeta } from "../../utils/response.js";
import { buildSearchConditions, buildSearchTokens } from "../../utils/search.js";
import { buildDateRange } from "../../utils/validation.js";
import { assertDoctorExists } from "../doctors/doctor.service.js";
import { PatientModel } from "./patient.model.js";
import type { ListPatientsQuery, PatientFilters, PatientInput, PatientUpdateInput } from "./patient.validation.js";

const LIST_FIELDS = "doctor name age gender phone condition admittedAt createdAt";
const DOCTOR_FIELDS = "name specialization";

function patientTokens(patient: Pick<PatientInput, "name" | "phone">) {
  return buildSearchTokens(patient.name, patient.phone.replace(/\D/g, ""), patient.phone);
}

function buildPatientSort({
  sortBy,
  order,
}: Pick<PatientFilters, "sortBy" | "order">): Record<string, SortOrder> {
  const dir: SortOrder = order === "asc" ? 1 : -1;
  if (sortBy === "name") return { name: dir, _id: dir };
  if (sortBy === "age") return { age: dir, _id: dir };
  return { admittedAt: dir, _id: dir };
}

function buildPatientFilter({ search, condition, gender, doctor, from, to }: PatientFilters) {
  const filter: Record<string, unknown> = {};
  if (doctor) filter.doctor = doctor;
  if (condition) filter.condition = condition;
  if (gender) filter.gender = gender;
  const admittedAt = buildDateRange(from, to);
  if (admittedAt) filter.admittedAt = admittedAt;
  const searchConditions = buildSearchConditions(search);
  if (searchConditions.length > 0) filter.$and = searchConditions;
  return filter;
}

export async function listPatients(query: ListPatientsQuery) {
  const { page, limit } = query;
  const filter = buildPatientFilter(query);
  const isUnfiltered = Object.keys(filter).length === 0;

  const [patients, total] = await Promise.all([
    PatientModel.find(filter)
      .select(LIST_FIELDS)
      .sort(buildPatientSort(query))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctor", DOCTOR_FIELDS)
      .lean(),
    isUnfiltered ? PatientModel.estimatedDocumentCount() : PatientModel.countDocuments(filter),
  ]);

  return { data: patients, meta: buildMeta(page, limit, total) };
}

async function getPatientById(id: string) {
  const patient = await PatientModel.findById(id)
    .select(LIST_FIELDS)
    .populate("doctor", DOCTOR_FIELDS)
    .lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

export async function createPatient(doctorId: string, input: PatientInput) {
  await assertDoctorExists(doctorId);
  const patient = await PatientModel.create({
    ...input,
    doctor: doctorId,
    searchTokens: patientTokens(input),
  });
  return getPatientById(patient._id.toString());
}

export async function updatePatient(id: string, input: PatientUpdateInput) {
  const current = await PatientModel.findById(id).select("name phone").lean();
  if (!current) throw ApiError.notFound("Patient not found");

  await PatientModel.updateOne(
    { _id: id },
    { $set: { ...input, searchTokens: patientTokens({ ...current, ...input }) } },
    { runValidators: true },
  );
  return getPatientById(id);
}

export async function deletePatient(id: string) {
  const result = await PatientModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw ApiError.notFound("Patient not found");
}

export async function* exportPatientRows(filters: PatientFilters, maxRows: number) {
  const cursor = PatientModel.find(buildPatientFilter(filters))
    .select(LIST_FIELDS)
    .sort(buildPatientSort(filters))
    .limit(maxRows)
    .populate<{ doctor: { name: string; specialization: string } | null }>("doctor", DOCTOR_FIELDS)
    .lean()
    .cursor({ batchSize: 500 });
  for await (const patient of cursor) {
    yield [
      patient.name,
      patient.age,
      patient.gender,
      patient.phone,
      patient.condition,
      patient.doctor?.name ?? "",
      patient.doctor?.specialization ?? "",
      patient.admittedAt.toISOString().slice(0, 10),
    ];
  }
}
