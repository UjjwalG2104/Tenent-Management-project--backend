import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  uploadDocuments as uploadDocumentsController,
  getPropertyDocuments,
  getAgreementDocuments,
  deleteDocument,
} from "../controllers/documentController.js";
import uploadDocuments from "../middleware/documentUpload.js";

const router = express.Router();

router.use(authRequired);

router.post("/upload", uploadDocuments.array('documents', 20), uploadDocumentsController);
router.get("/property/:propertyId", getPropertyDocuments);
router.get("/agreement/:agreementId", getAgreementDocuments);
router.delete("/:documentId", deleteDocument);

export default router;
