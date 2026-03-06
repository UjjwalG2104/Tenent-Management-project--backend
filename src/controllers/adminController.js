import User from "../models/User.js";
import Agreement from "../models/Agreement.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort("-createdAt");
    res.json({ users });
  } catch (err) {
    console.error("List users error", err);
    res.status(500).json({ message: "Failed to load users" });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    console.error("Toggle user status error", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

export const activeAgreements = async (req, res) => {
  try {
    console.log('Fetching active agreements...');
    console.log('User making request:', req.user?.email, req.user?.role);
    
    const agreements = await Agreement.find({ status: "active" })
      .populate("owner", "name email")
      .populate("tenant", "name email")
      .populate("property", "title")
      .sort("-createdAt");

    // Get payment counts for each agreement
    const Payment = (await import("../models/Payment.js")).default;
    
    for (let agreement of agreements) {
      const pendingPayments = await Payment.countDocuments({
        agreement: agreement._id,
        status: { $in: ["pending", "late"] }
      });
      agreement.payments = [{ count: pendingPayments }];
    }

    console.log('Found active agreements:', agreements.length);
    agreements.forEach((a, index) => {
      console.log(`Active Agreement ${index + 1}:`, {
        id: a._id,
        property: a.property?.title,
        owner: a.owner?.name,
        tenant: a.tenant?.name,
        monthlyRent: a.monthlyRent,
        pendingPayments: a.payments?.[0]?.count || 0
      });
    });

    res.json({ agreements });
  } catch (err) {
    console.error("Active agreements error", err);
    res.status(500).json({ message: "Failed to load active agreements" });
  }
};

export const pendingAgreements = async (req, res) => {
  try {
    console.log('Fetching pending agreements...');
    console.log('User making request:', req.user?.email, req.user?.role);
    
    const agreements = await Agreement.find({ status: "pending_approval" })
      .populate("owner", "name email")
      .populate("tenant", "name email")
      .populate("property", "title")
      .sort("-createdAt");

    console.log('Found agreements:', agreements.length);
    agreements.forEach((a, index) => {
      console.log(`Agreement ${index + 1}:`, {
        id: a._id,
        property: a.property?.title,
        owner: a.owner?.name,
        tenant: a.tenant?.name,
        status: a.status
      });
    });

    res.json({ agreements });
  } catch (err) {
    console.error("Pending agreements error", err);
    res.status(500).json({ message: "Failed to load pending agreements" });
  }
};

export const approveAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Approving agreement:', id);
    
    const agreement = await Agreement.findById(id);
    if (!agreement || agreement.status !== "pending_approval") {
      return res.status(404).json({ message: "Agreement not found or already processed" });
    }
    
    agreement.status = "active";
    agreement.approvedAt = new Date();
    agreement.approvedBy = req.user._id;
    await agreement.save();

    const monthlyAmount = agreement.monthlyRent;
    const dueDate = new Date(agreement.startDate);
    const payment = await Payment.create({
      agreement: agreement._id,
      amount: monthlyAmount,
      dueDate,
    });

    // Create notification for tenant
    await Notification.create({
      user: agreement.tenant,
      type: "system",
      message: `Your rental agreement has been approved and activated. First payment due: ${dueDate.toLocaleDateString()}.`,
    });

    // Create notification for owner
    await Notification.create({
      user: agreement.owner,
      type: "system",
      message: `Your rental agreement request has been approved by admin. Agreement is now active.`,
    });

    console.log('Agreement approved successfully:', agreement._id);
    res.json({ 
      agreement, 
      firstPayment: payment,
      message: "Agreement approved successfully"
    });
  } catch (err) {
    console.error("Approve agreement error", err);
    res.status(500).json({ message: "Failed to approve agreement" });
  }
};

export const rejectAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('Rejecting agreement:', id, 'Reason:', reason);
    
    const agreement = await Agreement.findById(id);
    if (!agreement || agreement.status !== "pending_approval") {
      return res.status(404).json({ message: "Agreement not found or already processed" });
    }
    
    agreement.status = "rejected";
    agreement.rejectionReason = reason || "No reason provided";
    agreement.rejectedAt = new Date();
    agreement.rejectedBy = req.user._id; // Track who rejected
    await agreement.save();

    // Create notification for tenant
    await Notification.create({
      user: agreement.tenant,
      type: "system",
      message: `Your rental agreement request has been rejected.${reason ? ' Reason: ' + reason : ''}`,
    });

    // Create notification for owner
    await Notification.create({
      user: agreement.owner,
      type: "system",
      message: `Your rental agreement request has been rejected by admin.${reason ? ' Reason: ' + reason : ''}`,
    });

    console.log('Agreement rejected successfully:', agreement._id);
    res.json({ 
      agreement, 
      message: "Agreement rejected successfully",
      rejectionReason: reason,
      rejectedBy: req.user._id
    });
  } catch (err) {
    console.error("Reject agreement error", err);
    res.status(500).json({ message: "Failed to reject agreement" });
  }
};

export const analyticsOverview = async (req, res) => {
  try {
    const activeAgreements = await Agreement.countDocuments({ status: "active" });
    const pendingAgreements = await Agreement.countDocuments({ status: "pending_approval" });

    const payments = await Payment.find();
    const totalIncome = payments
      .filter((p) => p.status === "paid" || p.status === "late")
      .reduce((sum, p) => sum + p.amount + p.lateFee, 0);

    res.json({
      activeAgreements,
      pendingAgreements,
      totalIncome,
    });
  } catch (err) {
    console.error("Analytics overview error", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

