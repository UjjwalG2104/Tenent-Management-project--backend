import Agreement from "../models/Agreement.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import fs from "fs";

export const myAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find({ tenant: req.user.id })
      .populate("owner", "name email")
      .populate("property", "title address city state pincode")
      .sort("-createdAt");

    res.json({ agreements });
  } catch (err) {
    console.error("Tenant agreements error", err);
    res.status(500).json({ message: "Failed to load agreements" });
  }
};

export const downloadAgreementPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const agreement = await Agreement.findOne({ _id: id, tenant: req.user.id });
    if (!agreement || !agreement.pdfPath) {
      return res.status(404).json({ message: "Agreement PDF not found" });
    }

    if (!fs.existsSync(agreement.pdfPath)) {
      return res.status(404).json({ message: "PDF file missing on server" });
    }

    res.download(agreement.pdfPath);
  } catch (err) {
    console.error("Download PDF error", err);
    res.status(500).json({ message: "Failed to download agreement" });
  }
};

export const myPayments = async (req, res) => {
  try {
    const agreements = await Agreement.find({ tenant: req.user.id }).select("_id");
    const agreementIds = agreements.map((a) => a._id);

    const payments = await Payment.find({ agreement: { $in: agreementIds } }).sort("-dueDate");
    res.json({ payments });
  } catch (err) {
    console.error("Tenant payments error", err);
    res.status(500).json({ message: "Failed to load payments" });
  }
};

export const markPaymentPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate({
      path: "agreement",
      populate: { path: "tenant", select: "_id" },
    });

    if (!payment || String(payment.agreement.tenant._id) !== req.user.id) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "paid") {
      return res.status(400).json({ message: "Payment already marked as paid" });
    }

    const now = new Date();
    payment.paidDate = now;

    if (now > payment.dueDate) {
      const diffDays = Math.ceil((now - payment.dueDate) / (1000 * 60 * 60 * 24));
      payment.lateFee = diffDays * 50;
      payment.status = "late";
    } else {
      payment.status = "paid";
    }

    await payment.save();

    res.json({ payment });
  } catch (err) {
    console.error("Mark payment paid error", err);
    res.status(500).json({ message: "Failed to mark payment as paid" });
  }
};

export const myNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort("-createdAt");
    res.json({ notifications });
  } catch (err) {
    console.error("Tenant notifications error", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

