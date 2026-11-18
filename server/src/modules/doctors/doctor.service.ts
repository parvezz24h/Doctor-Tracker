import type { SortOrder } from "mongoose";
import { Types } from "mongoose";

import { toProfilePhoto } from "../../lib/image.js";
import { createObjectKey, deleteObject, getDownloadUrl, isStorageEnabled, putObject } from "../../lib/storage.js";
import { ApiError } from "../../utils/api-error.js";
import { buildMeta } from "../../utils/response.js";
import { buildSearchConditions, buildSearchTokens } from "../../utils/search.js";
import { buildDateRange } from "../../utils/validation.js";
import { PatientModel } from "../patients/patient.model.js";
import { DoctorModel } from "./doctor.model.js";
import { CONDITIONS } from "../patients/patient.model.js";
import type { DoctorFilters, DoctorInput, DoctorUpdateInput, ListDoctorsQuery } from "./doctor.validation.js";

const LIST_FIELDS = "name specialization hospital phone email photoKey createdAt";

/**
 * Replaces the internal storage key with a URL the client can use. The URL changes
 * whenever the photo changes, so browsers can cache each version indefinitely.
 */
function toDoctorDto<T extends { _id: Types.ObjectId; photoKey?: string | null }>(doctor: T) {
  const { photoKey, ...rest } = doctor;
  const version = photoKey?.split("/").pop()?.split(".")[0];
  return {
    ...rest,
    photoUrl: photoKey ? `/api/v1/doctors/${doctor._id.toString()}/photo?v=${version}` : null,
  };
}

/**
 * Each sort ends with `_id` so pages are stable, and matches an index exactly
 * (or its reverse), so MongoDB never has to sort in memory.
 */
export function buildDoctorSort({
  sortBy,
  order,
}: Pick<DoctorFilters, "sortBy" | "order">): Record<string, SortOrder> {
  const dir: SortOrder = order === "asc" ? 1 : -1;
  const reverse: SortOrder = dir === 1 ? -1 : 1;
  switch (sortBy) {
    case "name":
      return { name: dir, _id: dir };
    case "specialization":
      return { specialization: dir, createdAt: reverse, _id: reverse };
    case "hospital":
      return { hospital: dir, createdAt: reverse, _id: reverse };
    default:
      return { createdAt: dir, _id: dir };
  }
}

export function buildDoctorFilter({ search, specialization, hospital, from, to }: DoctorFilters) {
  const filter: Record<string, unknown> = {};
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;
  const createdAt = buildDateRange(from, to);
  if (createdAt) filter.createdAt = createdAt;
  const searchConditions = buildSearchConditions(search);
  if (searchConditions.length > 0) filter.$and = searchConditions;
  return filter;
}

function doctorTokens(doctor: Pick<DoctorInput, "name" | "specialization" | "hospital" | "email">) {
  return buildSearchTokens(doctor.name, doctor.specialization, doctor.hospital, doctor.email);
}

/** Patient counts for one page of doctors, in a single index-backed aggregation. */
async function countPatientsByDoctor(doctorIds: Types.ObjectId[]) {
  if (doctorIds.length === 0) return new Map<string, number>();
  const rows = await PatientModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { doctor: { $in: doctorIds } } },
    { $group: { _id: "$doctor", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

export async function listDoctors(query: ListDoctorsQuery) {
  const { page, limit } = query;
  const filter = buildDoctorFilter(query);
  const isUnfiltered = Object.keys(filter).length === 0;

  const [doctors, total] = await Promise.all([
    DoctorModel.find(filter)
      .select(LIST_FIELDS)
      .sort(buildDoctorSort(query))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    // The collection metadata already knows the unfiltered total.
    isUnfiltered ? DoctorModel.estimatedDocumentCount() : DoctorModel.countDocuments(filter),
  ]);

  const counts = await countPatientsByDoctor(doctors.map((doctor) => doctor._id));

  return {
    data: doctors.map((doctor) => ({
      ...toDoctorDto(doctor),
      patientCount: counts.get(doctor._id.toString()) ?? 0,
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function getDoctorFilterOptions() {
  const [specializations, hospitals] = await Promise.all([
    DoctorModel.distinct("specialization"),
    DoctorModel.distinct("hospital"),
  ]);
  return {
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
  };
}

export async function getDoctorById(id: string) {
  const [doctor, patientCount] = await Promise.all([
    DoctorModel.findById(id).select(`${LIST_FIELDS} updatedAt`).lean(),
    PatientModel.countDocuments({ doctor: id }),
  ]);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return { ...toDoctorDto(doctor), patientCount };
}

export async function assertDoctorExists(id: string) {
  const exists = await DoctorModel.exists({ _id: id });
  if (!exists) throw ApiError.notFound("Doctor not found");
}

export async function createDoctor(input: DoctorInput) {
  const doctor = await DoctorModel.create({ ...input, searchTokens: doctorTokens(input) });
  return getDoctorById(doctor._id.toString());
}

export async function updateDoctor(id: string, input: DoctorUpdateInput) {
  const current = await DoctorModel.findById(id).select(LIST_FIELDS).lean();
  if (!current) throw ApiError.notFound("Doctor not found");

  const next = { ...current, ...input };
  await DoctorModel.updateOne(
    { _id: id },
    { $set: { ...input, searchTokens: doctorTokens(next) } },
    { runValidators: true },
  );
  return getDoctorById(id);
}

export async function deleteDoctor(id: string) {
  const hasPatients = await PatientModel.exists({ doctor: id });
  if (hasPatients) {
    throw ApiError.conflict("This doctor still has patients. Remove or reassign them first.");
  }
  const doctor = await DoctorModel.findOneAndDelete({ _id: id }).select("photoKey").lean();
  if (!doctor) throw ApiError.notFound("Doctor not found");
  if (doctor.photoKey) await deleteObject(doctor.photoKey);
}

function assertStorageEnabled() {
  if (!isStorageEnabled) {
    throw new ApiError(503, "Photo uploads are not configured on this server");
  }
}

export async function setDoctorPhoto(id: string, file: Express.Multer.File | undefined) {
  assertStorageEnabled();
  if (!file) {
    throw ApiError.badRequest("No photo was uploaded", [{ field: "photo", message: "Choose an image" }]);
  }

  const current = await DoctorModel.findById(id).select("photoKey").lean();
  if (!current) throw ApiError.notFound("Doctor not found");

  const photo = await toProfilePhoto(file.buffer);
  const key = createObjectKey(`doctors/${id}`, "webp");
  await putObject(key, photo, "image/webp");

  // Only point the doctor at the new photo once it is safely stored.
  const updated = await DoctorModel.updateOne({ _id: id }, { $set: { photoKey: key } });
  if (updated.matchedCount === 0) {
    await deleteObject(key);
    throw ApiError.notFound("Doctor not found");
  }
  if (current.photoKey) await deleteObject(current.photoKey);

  return getDoctorById(id);
}

export async function removeDoctorPhoto(id: string) {
  const previous = await DoctorModel.findOneAndUpdate({ _id: id }, { $set: { photoKey: null } })
    .select("photoKey")
    .lean();
  if (!previous) throw ApiError.notFound("Doctor not found");
  if (previous.photoKey) await deleteObject(previous.photoKey);
  return getDoctorById(id);
}

export async function getDoctorPhotoUrl(id: string) {
  const doctor = await DoctorModel.findById(id).select("photoKey").lean();
  if (!doctor?.photoKey || !isStorageEnabled) throw ApiError.notFound("This doctor has no photo");
  return getDownloadUrl(doctor.photoKey);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Small per-doctor summary for the doctor page; every stage starts on the doctor index. */
export async function getDoctorStats(id: string, days = 30) {
  await assertDoctorExists(id);
  const doctor = new Types.ObjectId(id);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const rangeStart = new Date(today.getTime() - (days - 1) * DAY_MS);

  const [conditionRows, dailyRows, summaryRows] = await Promise.all([
    PatientModel.aggregate<{ _id: string; count: number }>([
      { $match: { doctor } },
      { $group: { _id: "$condition", count: { $sum: 1 } } },
    ]),
    PatientModel.aggregate<{ _id: Date; count: number }>([
      { $match: { doctor, admittedAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$admittedAt", unit: "day", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
    PatientModel.aggregate<{ averageAge: number; lastAdmission: Date }>([
      { $match: { doctor } },
      { $group: { _id: null, averageAge: { $avg: "$age" }, lastAdmission: { $max: "$admittedAt" } } },
    ]),
  ]);

  const conditions = new Map(conditionRows.map((row) => [row._id, row.count]));
  const daily = new Map(dailyRows.map((row) => [row._id.toISOString().slice(0, 10), row.count]));
  const summary = summaryRows[0];

  return {
    patientsByCondition: CONDITIONS.map((condition) => ({ condition, count: conditions.get(condition) ?? 0 })),
    admissionsByDay: Array.from({ length: days }, (_, index) => {
      const date = new Date(rangeStart.getTime() + index * DAY_MS).toISOString().slice(0, 10);
      return { date, count: daily.get(date) ?? 0 };
    }),
    admissionsInRange: dailyRows.reduce((sum, row) => sum + row.count, 0),
    averageAge: summary ? Math.round(summary.averageAge) : null,
    lastAdmission: summary?.lastAdmission ?? null,
  };
}

/** Rows for the CSV export, streamed from a cursor so memory use stays flat. */
export async function* exportDoctorRows(filters: DoctorFilters, maxRows: number) {
  const counts = new Map(
    (
      await PatientModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $group: { _id: "$doctor", count: { $sum: 1 } } },
      ])
    ).map((row) => [row._id.toString(), row.count]),
  );
  const cursor = DoctorModel.find(buildDoctorFilter(filters))
    .select("name specialization hospital phone email createdAt")
    .sort(buildDoctorSort(filters))
    .limit(maxRows)
    .lean()
    .cursor({ batchSize: 500 });
  for await (const doctor of cursor) {
    yield [
      doctor.name,
      doctor.specialization,
      doctor.hospital,
      doctor.phone,
      doctor.email,
      counts.get(doctor._id.toString()) ?? 0,
      doctor.createdAt.toISOString().slice(0, 10),
    ];
  }
}
