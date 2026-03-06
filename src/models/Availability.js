import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { 
      type: String, 
      enum: ['available', 'unavailable', 'maintenance', 'booked'], 
      default: 'available' 
    },
    notes: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Compound index for property and date
availabilitySchema.index({ property: 1, date: 1 }, { unique: true });

export default mongoose.model("Availability", availabilitySchema);
