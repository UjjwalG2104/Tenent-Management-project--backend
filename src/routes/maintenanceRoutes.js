import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  createMaintenanceRequest,
  getPropertyMaintenanceRequests,
  updateMaintenanceRequest,
  addMaintenanceComment,
  getTenantMaintenanceRequests,
  getOwnerMaintenanceRequests
} from "../controllers/maintenanceController.js";

const router = express.Router();

router.use(authRequired);

router.post("/requests", createMaintenanceRequest);
router.get("/property/:propertyId", getPropertyMaintenanceRequests);
router.patch("/requests/:requestId", updateMaintenanceRequest);
router.post("/requests/:requestId/comments", addMaintenanceComment);
router.get("/tenant/requests", getTenantMaintenanceRequests);
router.get("/owner/requests", getOwnerMaintenanceRequests);

export default router;
