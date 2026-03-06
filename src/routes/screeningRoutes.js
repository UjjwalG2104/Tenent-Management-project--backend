import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getScreeningCriteria,
  updateScreeningCriteria,
  submitTenantApplication,
  getPropertyApplications,
  processTenantApplication,
  getTenantApplications,
  calculateScreeningScore
} from "../controllers/screeningController.js";

const router = express.Router();

router.use(authRequired);

router.get("/property/:propertyId/criteria", getScreeningCriteria);
router.put("/property/:propertyId/criteria", updateScreeningCriteria);
router.post("/applications", submitTenantApplication);
router.get("/property/:propertyId/applications", getPropertyApplications);
router.post("/applications/:applicationId/process", processTenantApplication);
router.get("/tenant/applications", getTenantApplications);
router.get("/applications/:applicationId/score", calculateScreeningScore);

export default router;
