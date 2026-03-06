import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "owner", "tenant"],
      default: "tenant",
    },
    phone: { type: String },
    avatar: { type: String }, // Profile picture URL
    isOnline: { type: Boolean, default: false }, // For messaging
    lastSeen: { type: Date },
    // For tenants, optional reference to their current property/agreement can be derived via queries
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

