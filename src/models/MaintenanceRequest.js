import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['plumbing', 'electrical', 'hvac', 'appliances', 'structural', 'pest_control', 'cleaning', 'landscaping', 'other'],
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'emergency'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    images: [{ type: String }], // URLs to uploaded images
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    estimatedCost: { type: Number },
    actualCost: { type: Number },
    completedAt: { type: Date },
    comments: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
