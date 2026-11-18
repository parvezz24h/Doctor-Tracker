import { Router } from "express";

import { photoUpload } from "../../middlewares/upload.js";
import { EXPORT_MAX_ROWS, exportFilename, sendCsv } from "../../utils/csv.js";
import { sendSuccess } from "../../utils/response.js";
import { idParams } from "../../utils/validation.js";
import * as patientService from "../patients/patient.service.js";
import { listPatientsQuery, patientBody } from "../patients/patient.validation.js";
import * as doctorService from "./doctor.service.js";
import { doctorBody, doctorUpdateBody, exportDoctorsQuery, listDoctorsQuery } from "./doctor.validation.js";

export const doctorRouter = Router();

doctorRouter.get("/", async (req, res) => {
  const { data, meta } = await doctorService.listDoctors(listDoctorsQuery.parse(req.query));
  sendSuccess(res, data, { meta });
});

doctorRouter.post("/", async (req, res) => {
  const doctor = await doctorService.createDoctor(doctorBody.parse(req.body));
  sendSuccess(res, doctor, { status: 201, message: "Doctor created" });
});

// Declared before "/:id" so they are not treated as ids.
doctorRouter.get("/filters", async (_req, res) => {
  sendSuccess(res, await doctorService.getDoctorFilterOptions());
});

doctorRouter.get("/export", async (req, res) => {
  const filters = exportDoctorsQuery.parse(req.query);
  await sendCsv(
    res,
    exportFilename("doctors"),
    ["Name", "Specialization", "Hospital", "Phone", "Email", "Patients", "Added"],
    doctorService.exportDoctorRows(filters, EXPORT_MAX_ROWS),
  );
});

doctorRouter.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  sendSuccess(res, await doctorService.getDoctorById(id));
});

doctorRouter.get("/:id/stats", async (req, res) => {
  const { id } = idParams.parse(req.params);
  sendSuccess(res, await doctorService.getDoctorStats(id));
});

doctorRouter.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const doctor = await doctorService.updateDoctor(id, doctorUpdateBody.parse(req.body));
  sendSuccess(res, doctor, { message: "Doctor updated" });
});

doctorRouter.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  await doctorService.deleteDoctor(id);
  sendSuccess(res, null, { message: "Doctor deleted" });
});

// Redirects to a short-lived signed link in the private bucket, so image bytes are
// served by the storage provider instead of passing through this server.
doctorRouter.get("/:id/photo", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const url = await doctorService.getDoctorPhotoUrl(id);
  // The signed link stays valid for at least an hour; let the browser reuse the redirect.
  res.set("Cache-Control", "private, max-age=1800");
  res.redirect(302, url);
});

doctorRouter.put("/:id/photo", photoUpload, async (req, res) => {
  const { id } = idParams.parse(req.params);
  const doctor = await doctorService.setDoctorPhoto(id, req.file);
  sendSuccess(res, doctor, { message: "Photo updated" });
});

doctorRouter.delete("/:id/photo", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const doctor = await doctorService.removeDoctorPhoto(id);
  sendSuccess(res, doctor, { message: "Photo removed" });
});

doctorRouter.get("/:id/patients", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const query = listPatientsQuery.parse({ ...req.query, doctor: id });
  await doctorService.assertDoctorExists(id);
  const { data, meta } = await patientService.listPatients(query);
  sendSuccess(res, data, { meta });
});

doctorRouter.post("/:id/patients", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const patient = await patientService.createPatient(id, patientBody.parse(req.body));
  sendSuccess(res, patient, { status: 201, message: "Patient added" });
});
