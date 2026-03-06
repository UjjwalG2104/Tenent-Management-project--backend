import express from "express";
import { authRequired, requireRoles } from "../middleware/authMiddleware.js";
import {
  downloadAgreementPdf,
  markPaymentPaid,
  myAgreements,
  myNotifications,
  myPayments,
} from "../controllers/tenantController.js";

const router = express.Router();

router.use(authRequired, requireRoles("tenant"));

router.get("/agreements", myAgreements);
router.get("/agreements/:id/pdf", downloadAgreementPdf);

router.get("/payments", myPayments);
router.post("/payments/:id/mark-paid", markPaymentPaid);

router.get("/notifications", myNotifications);

export default router;

