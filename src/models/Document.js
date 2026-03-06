import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    agreement: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    type: {
      type: String,
      enum: ['agreement', 'id-proof', 'address-proof', 'police-verification', 'maintenance', 'other'],
      default: 'other'
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
