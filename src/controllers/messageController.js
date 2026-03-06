import { Conversation, Message } from "../models/Message.js";
import User from "../models/User.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'name email role')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount.get(req.user.id.toString()) || 0
    }));

    res.json({ conversations: conversationsWithUnread });
  } catch (err) {
    console.error("Get conversations error", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error("Get messages error", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content
    });

    await message.save();

    // Update conversation last message
    conversation.lastMessage = {
      content,
      sender: req.user.id,
      createdAt: new Date()
    };

    // Update unread counts for all participants except sender
    const unreadUpdates = {};
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id.toString()) {
        unreadUpdates[participantId.toString()] = (conversation.unreadCount.get(participantId.toString()) || 0) + 1;
      }
    });
    
    conversation.unreadCount = new Map([...conversation.unreadCount, ...Object.entries(unreadUpdates)]);
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate and return message
    await message.populate('sender', 'name email role');

    res.json({ message });
  } catch (err) {
    console.error("Send message error", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (recipientId === req.user.id) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId], $size: 2 }
    });

    if (existingConversation) {
      return res.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user.id, recipientId],
      unreadCount: new Map([[recipientId, 0]])
    });

    await conversation.save();
    await conversation.populate('participants', 'name email role');

    res.json({ conversation });
  } catch (err) {
    console.error("Create conversation error", err);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

export const getUsersForMessaging = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('name email role')
      .sort('name');

    res.json({ users });
  } catch (err) {
    console.error("Get users error", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
      },
      { $push: { readBy: req.user.id } }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save();

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Mark messages as read error", err);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};
