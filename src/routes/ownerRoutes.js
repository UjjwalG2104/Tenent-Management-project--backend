import express from "express";
import { authRequired, requireRoles } from "../middleware/authMiddleware.js";
import {
  createAgreement,
  createProperty,
  deleteProperty,
  listOwnerAgreements,
  listOwnerProperties,
  ownerRentSummary,
  searchProperties,
  uploadPropertyImages,
  deletePropertyImage,
  getOwnerAnalytics,
} from "../controllers/ownerController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(authRequired, requireRoles("owner"));

router.post("/properties", createProperty);
router.get("/properties", listOwnerProperties);
router.get("/properties/search", searchProperties);
router.delete("/properties/:id", deleteProperty);
router.post("/properties/:id/images", upload.array('images', 10), uploadPropertyImages);
router.delete("/properties/:id/images/:imageId", deletePropertyImage);

router.post("/agreements", createAgreement);
router.get("/agreements", listOwnerAgreements);

router.get("/rent/summary", ownerRentSummary);
router.get("/analytics", getOwnerAnalytics);

export default router;

