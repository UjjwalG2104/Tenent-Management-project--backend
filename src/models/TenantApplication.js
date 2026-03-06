import mongoose from "mongoose";

const screeningCriteriaSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    minCreditScore: { type: Number, default: 600 },
    minIncome: { type: Number, default: 30000 },
    maxDebtToIncome: { type: Number, default: 0.4 },
    requiredReferences: { type: Number, default: 2 },
    backgroundCheck: { type: Boolean, default: true },
    customCriteria: { type: Map, of: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

const tenantApplicationSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    currentAddress: { type: String, required: true },
    employer: { type: String, trim: true },
    position: { type: String, trim: true },
    income: { type: Number },
    creditScore: { type: Number },
    references: [{
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      relationship: { type: String, required: true }
    }],
    documents: [{ type: String }], // URLs to uploaded documents
    screeningScore: { type: Number },
    backgroundCheckPassed: { type: Boolean },
    status: { 
      type: String, 
      enum: ['pending', 'under_review', 'approved', 'rejected'], 
      default: 'pending' 
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String },
    decisionDate: { type: Date }
  },
  { timestamps: true }
);

export const ScreeningCriteria = mongoose.model("ScreeningCriteria", screeningCriteriaSchema);
export const TenantApplication = mongoose.model("TenantApplication", tenantApplicationSchema);
