import { Router } from "express";

import { EXPORT_MAX_ROWS, exportFilename, sendCsv } from "../../utils/csv.js";
import { sendSuccess } from "../../utils/response.js";
import { idParams } from "../../utils/validation.js";
import * as patientService from "./patient.service.js";
import { exportPatientsQuery, listPatientsQuery, patientUpdateBody } from "./patient.validation.js";

export const patientRouter = Router();

patientRouter.get("/", async (req, res) => {
  const { data, meta } = await patientService.listPatients(listPatientsQuery.parse(req.query));
  sendSuccess(res, data, { meta });
});

patientRouter.get("/export", async (req, res) => {
  const filters = exportPatientsQuery.parse(req.query);
  await sendCsv(
    res,
    exportFilename("patients"),
    ["Name", "Age", "Gender", "Phone", "Condition", "Doctor", "Specialization", "Admitted"],
    patientService.exportPatientRows(filters, EXPORT_MAX_ROWS),
  );
});

patientRouter.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const patient = await patientService.updatePatient(id, patientUpdateBody.parse(req.body));
  sendSuccess(res, patient, { message: "Patient updated" });
});

patientRouter.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  await patientService.deletePatient(id);
  sendSuccess(res, null, { message: "Patient deleted" });
});
