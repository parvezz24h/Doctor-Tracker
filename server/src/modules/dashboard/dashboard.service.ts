import type { Types } from "mongoose";

import { DoctorModel } from "../doctors/doctor.model.js";
import { CONDITIONS, PatientModel } from "../patients/patient.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Each statistic is its own small pipeline, run in parallel. A single `$facet`
 * would be one round trip, but its sub-pipelines cannot use indexes and would
 * scan the whole collection; separate pipelines each start with an indexed stage.
 */
export async function getDashboardStats(days: number) {
  const today = startOfUtcDay(new Date());
  const rangeStart = new Date(today.getTime() - (days - 1) * DAY_MS);
  const previousStart = new Date(rangeStart.getTime() - days * DAY_MS);

  const [
    totalDoctors,
    totalPatients,
    admissionsInRange,
    admissionsInPreviousRange,
    doctorsInRange,
    conditionRows,
    dailyRows,
    topDoctorRows,
    specializationRows,
  ] = await Promise.all([
    DoctorModel.estimatedDocumentCount(),
    PatientModel.estimatedDocumentCount(),
    PatientModel.countDocuments({ admittedAt: { $gte: rangeStart } }),
    PatientModel.countDocuments({ admittedAt: { $gte: previousStart, $lt: rangeStart } }),
    DoctorModel.countDocuments({ createdAt: { $gte: rangeStart } }),

    PatientModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$condition", count: { $sum: 1 } } },
    ]),

    PatientModel.aggregate<{ _id: Date; count: number }>([
      { $match: { admittedAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$admittedAt", unit: "day", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Group on the indexed key, keep only the top rows, then join just those doctors.
    PatientModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
      doctor: { name: string; specialization: string };
    }>([
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: DoctorModel.collection.name,
          localField: "_id",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 0, name: 1, specialization: 1 } }],
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
    ]),

    DoctorModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 6 },
    ]),
  ]);

  // Fill days without admissions so the chart has a continuous axis.
  const dailyMap = new Map(dailyRows.map((row) => [row._id.toISOString().slice(0, 10), row.count]));
  const admissionsByDay = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    return { date, count: dailyMap.get(date) ?? 0 };
  });

  const conditionMap = new Map(conditionRows.map((row) => [row._id, row.count]));

  return {
    range: { days, from: rangeStart.toISOString(), to: today.toISOString() },
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      newDoctors: doctorsInRange,
      admissions: admissionsInRange,
      admissionsChange: percentChange(admissionsInRange, admissionsInPreviousRange),
      critical: conditionMap.get("critical") ?? 0,
      averagePatientsPerDoctor:
        totalDoctors === 0 ? 0 : Math.round((totalPatients / totalDoctors) * 10) / 10,
    },
    admissionsByDay,
    patientsByCondition: CONDITIONS.map((condition) => ({
      condition,
      count: conditionMap.get(condition) ?? 0,
    })),
    patientsPerDoctor: topDoctorRows.map((row) => ({
      doctorId: row._id,
      name: row.doctor.name,
      specialization: row.doctor.specialization,
      count: row.count,
    })),
    doctorsBySpecialization: specializationRows.map((row) => ({
      specialization: row._id,
      count: row.count,
    })),
  };
}
