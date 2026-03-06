import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getUsersForMessaging,
  markMessagesAsRead
} from "../controllers/messageController.js";

const router = express.Router();

router.use(authRequired);

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/messages/send", sendMessage);
router.post("/conversations/:conversationId/read", markMessagesAsRead);
router.get("/users", getUsersForMessaging);

export default router;
