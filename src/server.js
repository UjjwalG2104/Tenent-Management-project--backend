import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from 'path';
import { checkPort, killProcessOnPort } from './utils/portCheck.js';

import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import screeningRoutes from "./routes/screeningRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/rental_system";

async function startServer() {
  // Check if port is in use and kill process if needed
  const portInUse = await checkPort(PORT);
  if (portInUse) {
    console.log(`Port ${PORT} is in use, killing existing process...`);
    await killProcessOnPort(PORT);
    // Wait a moment for the process to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }

  // Start server
  try {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`API available at: http://localhost:${PORT}`);
      console.log(`Frontend should connect to: http://localhost:3000`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Rental Agreement API running",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/screening", screeningRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    timestamp: new Date().toISOString()
  });
});

// Start the server
startServer();

