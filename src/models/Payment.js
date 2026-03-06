import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    agreement: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement", required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "paid", "late"],
      default: "pending",
    },
    lateFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

