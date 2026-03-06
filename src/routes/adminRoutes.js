import express from "express";
import { authRequired, requireRoles } from "../middleware/authMiddleware.js";
import {
  analyticsOverview,
  approveAgreement,
  listUsers,
  pendingAgreements,
  activeAgreements,
  rejectAgreement,
  toggleUserStatus,
} from "../controllers/adminController.js";

const router = express.Router();

// Test endpoints without authentication (must come before auth middleware)
router.get("/test/pending", async (req, res) => {
  try {
    const Agreement = (await import("../models/Agreement.js")).default;
    const agreements = await Agreement.find({ status: "pending_approval" })
      .populate("owner", "name email")
      .populate("tenant", "name email")
      .populate("property", "title")
      .sort("-createdAt");
    
    console.log('Test endpoint found agreements:', agreements.length);
    res.json({ agreements });
  } catch (err) {
    console.error("Test endpoint error:", err);
    res.status(500).json({ message: "Test endpoint failed" });
  }
});

router.get("/test/users", async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const users = await User.find().select("-passwordHash").sort("-createdAt");
    console.log('Test endpoint found users:', users.length);
    res.json({ users });
  } catch (err) {
    console.error("Test users endpoint error:", err);
    res.status(500).json({ message: "Test users endpoint failed" });
  }
});

// Apply authentication middleware to all other routes
router.use(authRequired, requireRoles("admin"));

router.get("/users", listUsers);
router.patch("/users/:id/toggle", toggleUserStatus);

router.get("/agreements/pending", pendingAgreements);
router.get("/agreements/active", activeAgreements);
router.post("/agreements/:id/approve", approveAgreement);
router.post("/agreements/:id/reject", rejectAgreement);

router.get("/analytics/overview", analyticsOverview);

export default router;

