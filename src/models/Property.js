import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    description: { type: String, trim: true },
    images: [{
      url: { type: String, required: true },
      filename: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    amenities: [{
      type: String,
      trim: true
    }],
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    area: { type: Number }, // in square feet
    furnished: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);

