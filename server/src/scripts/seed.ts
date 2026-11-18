/**
 * Seeds the database with an admin account and realistic sample data.
 *
 *   pnpm seed                 → 200 doctors, 10,000 patients (replaces existing data)
 *   pnpm seed -- --doctors=50 --patients=500
 *   pnpm seed -- --admin-only → only make sure the admin account exists
 */
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { createAuth } from "../lib/auth.js";
import { DoctorModel } from "../modules/doctors/doctor.model.js";
import { CONDITIONS, GENDERS, PatientModel } from "../modules/patients/patient.model.js";
import { buildSearchTokens } from "../utils/search.js";

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Oncology",
  "Gynecology",
  "Psychiatry",
  "Endocrinology",
  "Gastroenterology",
  "Nephrology",
  "General Medicine",
];

const HOSPITALS = [
  "City General Hospital",
  "Green Valley Medical Center",
  "Riverside Clinic",
  "St. Mary's Hospital",
  "Central Care Hospital",
  "Lakeside Medical College",
  "Sunrise Specialized Hospital",
  "Unity Health Center",
];

// Weighted so the dashboard shows a realistic spread.
const CONDITION_WEIGHTS = [
  { value: CONDITIONS[0], weight: 50 },
  { value: CONDITIONS[1], weight: 10 },
  { value: CONDITIONS[2], weight: 25 },
  { value: CONDITIONS[3], weight: 15 },
];

function readNumberFlag(name: string, fallback: number) {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = flag ? Number(flag.split("=")[1]) : fallback;
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

async function seedAdmin() {
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  }

  const users = mongoose.connection.getClient().db().collection("user");
  if (await users.findOne({ email: email.toLowerCase() })) {
    console.log(`Admin ${email} already exists`);
    return;
  }

  // Public sign-up is disabled on the server, so the seed uses its own instance.
  await createAuth({ allowSignUp: true }).api.signUpEmail({ body: { name, email, password } });
  console.log(`Created admin ${email}`);
}

async function seedData(doctorCount: number, patientCount: number) {
  faker.seed(20261117);

  await Promise.all([DoctorModel.deleteMany({}), PatientModel.deleteMany({})]);

  const now = Date.now();
  const doctors = Array.from({ length: doctorCount }, (_, index) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `Dr. ${firstName} ${lastName}`;
    const specialization = faker.helpers.arrayElement(SPECIALIZATIONS);
    const hospital = faker.helpers.arrayElement(HOSPITALS);
    const email = `${firstName}.${lastName}.${index + 1}@example.com`.toLowerCase();
    const createdAt = faker.date.between({ from: now - 365 * 86_400_000, to: now });
    return {
      name,
      specialization,
      hospital,
      phone: faker.helpers.fromRegExp("+8801[3-9][0-9]{8}"),
      email,
      searchTokens: buildSearchTokens(name, specialization, hospital, email),
      createdAt,
      updatedAt: createdAt,
    };
  });

  const insertedDoctors = await DoctorModel.insertMany(doctors, { timestamps: false });
  console.log(`Inserted ${insertedDoctors.length} doctors`);
  if (insertedDoctors.length === 0) return;

  const batchSize = 2000;
  for (let offset = 0; offset < patientCount; offset += batchSize) {
    const size = Math.min(batchSize, patientCount - offset);
    const patients = Array.from({ length: size }, () => {
      // Skew toward a few busy doctors so "patients per doctor" is interesting.
      const doctorIndex = Math.floor(Math.pow(faker.number.float(), 1.35) * insertedDoctors.length);
      const doctor = insertedDoctors[doctorIndex]!;
      const name = faker.person.fullName();
      const phone = faker.helpers.fromRegExp("+8801[3-9][0-9]{8}");
      // Admitted some time after the doctor was added, leaning toward recent dates.
      const earliest = doctor.createdAt.getTime();
      const admittedAt = new Date(
        earliest + (now - earliest) * (1 - Math.pow(faker.number.float(), 1.4)),
      );
      return {
        doctor: doctor._id,
        name,
        age: faker.number.int({ min: 1, max: 92 }),
        gender: faker.helpers.weightedArrayElement([
          { value: GENDERS[0], weight: 49 },
          { value: GENDERS[1], weight: 49 },
          { value: GENDERS[2], weight: 2 },
        ]),
        phone,
        condition: faker.helpers.weightedArrayElement(CONDITION_WEIGHTS),
        admittedAt,
        searchTokens: buildSearchTokens(name, phone.replace(/\D/g, ""), phone),
        createdAt: admittedAt,
        updatedAt: admittedAt,
      };
    });
    await PatientModel.insertMany(patients, { timestamps: false, ordered: false });
  }
  console.log(`Inserted ${patientCount} patients`);
}

async function main() {
  await connectDatabase();
  // Create missing indexes and drop ones no longer declared on the models.
  await Promise.all([DoctorModel.syncIndexes(), PatientModel.syncIndexes()]);
  await seedAdmin();

  if (!process.argv.includes("--admin-only")) {
    await seedData(readNumberFlag("doctors", 200), readNumberFlag("patients", 10_000));
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
