import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getPropertyAvailability,
  updatePropertyAvailability,
  getAvailabilityCalendar
} from "../controllers/availabilityController.js";

const router = express.Router();

router.use(authRequired);

router.get("/properties/:propertyId/availability", getPropertyAvailability);
router.get("/properties/:propertyId/calendar", getAvailabilityCalendar);
router.post("/properties/:propertyId/availability", updatePropertyAvailability);

export default router;
