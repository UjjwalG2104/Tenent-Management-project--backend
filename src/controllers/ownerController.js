import Property from "../models/Property.js";
import Agreement from "../models/Agreement.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { generateAgreementPdf } from "../services/agreementPdfService.js";
import upload from "../middleware/upload.js";
import path from 'path';
import fs from 'fs';

export const uploadPropertyImages = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property belongs to the owner
    const property = await Property.findOne({ _id: propertyId, owner: req.user.id });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Add images to property
    const imageUrls = req.files.map(file => ({
      url: `/uploads/properties/${file.filename}`,
      filename: file.filename
    }));

    property.images.push(...imageUrls);
    await property.save();

    res.json({ 
      message: "Images uploaded successfully",
      images: imageUrls,
      property: property
    });
  } catch (err) {
    console.error("Upload images error", err);
    res.status(500).json({ message: "Failed to upload images" });
  }
};

export const deletePropertyImage = async (req, res) => {
  try {
    const { propertyId, imageId } = req.params;
    
    const property = await Property.findOne({ _id: propertyId, owner: req.user.id });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const imageIndex = property.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Remove file from filesystem
    const imagePath = path.join(process.cwd(), property.images[imageIndex].url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove from database
    property.images.splice(imageIndex, 1);
    await property.save();

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete image error", err);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

export const createProperty = async (req, res) => {
  try {
    const { title, address, city, state, pincode, monthlyRent, securityDeposit } = req.body;

    const property = await Property.create({
      owner: req.user.id,
      title,
      address,
      city,
      state,
      pincode,
      monthlyRent,
      securityDeposit,
    });

    res.status(201).json({ property });
  } catch (err) {
    console.error("Create property error", err);
    res.status(500).json({ message: "Failed to create property" });
  }
};

export const searchProperties = async (req, res) => {
  try {
    const { query, city, state, minRent, maxRent, sortBy, page = 1, limit = 10 } = req.query;
    
    // Build search filter
    const filter = { owner: req.user.id, isActive: true };
    
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };
    if (minRent || maxRent) {
      filter.monthlyRent = {};
      if (minRent) filter.monthlyRent.$gte = Number(minRent);
      if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
    }
    
    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'rent-low':
        sort = { monthlyRent: 1 };
        break;
      case 'rent-high':
        sort = { monthlyRent: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
    
    const skip = (page - 1) * limit;
    
    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Property.countDocuments(filter)
    ]);
    
    res.json({
      properties,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalProperties: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Search properties error", err);
    res.status(500).json({ message: "Failed to search properties" });
  }
};

export const listOwnerProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id, isActive: true }).sort("-createdAt");
    res.json({ properties });
  } catch (err) {
    console.error("List properties error", err);
    res.status(500).json({ message: "Failed to load properties" });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({ _id: id, owner: req.user.id, isActive: true });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.isActive = false;
    await property.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete property error", err);
    res.status(500).json({ message: "Failed to delete property" });
  }
};

export const createAgreement = async (req, res) => {
  try {
    const { propertyId, tenantEmail, startDate, endDate, monthlyRent, securityDeposit } = req.body;

    const property = await Property.findOne({ _id: propertyId, owner: req.user.id });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const tenant = await User.findOne({ email: tenantEmail, role: "tenant" });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant user not found" });
    }

    const agreement = await Agreement.create({
      property: property._id,
      owner: req.user.id,
      tenant: tenant._id,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
    });

    const pdfPath = await generateAgreementPdf({
      agreement,
      owner: await User.findById(req.user.id),
      tenant,
      property,
    });

    agreement.pdfPath = pdfPath;
    await agreement.save();

    await Notification.create({
      user: tenant._id,
      type: "system",
      message: "A new rental agreement has been created for you and is pending admin approval.",
    });

    res.status(201).json({ agreement });
  } catch (err) {
    console.error("Create agreement error", err);
    res.status(500).json({ message: "Failed to create agreement" });
  }
};

export const listOwnerAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find({ owner: req.user.id })
      .populate("tenant", "name email")
      .populate("property", "title address city state pincode")
      .sort("-createdAt");

    res.json({ agreements });
  } catch (err) {
    console.error("List agreements error", err);
    res.status(500).json({ message: "Failed to load agreements" });
  }
};

export const getOwnerAnalytics = async (req, res) => {
  try {
    const { range = '6months' } = req.query;
    const owner = req.user.id;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (range) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }

    // Get owner's properties and agreements
    const properties = await Property.find({ owner, isActive: true });
    const agreements = await Agreement.find({ owner, status: 'active' }).populate('tenant');
    const payments = await Payment.find({
      agreement: { $in: agreements.map(a => a._id) },
      createdAt: { $gte: startDate }
    });

    // Calculate metrics
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);

    const pendingPayments = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const activeProperties = properties.length;
    const occupancyRate = properties.length > 0 ? (agreements.length / properties.length) * 100 : 0;

    // Revenue by month
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate.getMonth() === monthDate.getMonth() &&
                 paymentDate.getFullYear() === monthDate.getFullYear() &&
                 p.status === 'paid';
        })
        .reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);
      
      revenueByMonth.push({ month: monthName, revenue: monthRevenue });
    }

    // Top performing properties
    const propertyRevenue = {};
    agreements.forEach(agreement => {
      const propertyId = agreement.property.toString();
      if (!propertyRevenue[propertyId]) {
        propertyRevenue[propertyId] = { 
          propertyId, 
          revenue: 0, 
          title: properties.find(p => p._id.toString() === propertyId)?.title || 'Unknown'
        };
      }
      const propertyPayments = payments.filter(p => 
        p.agreement.toString() === agreement._id.toString() && p.status === 'paid'
      );
      propertyRevenue[propertyId].revenue += propertyPayments.reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);
    });

    const topProperties = Object.values(propertyRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payments by status
    const paymentsByStatus = [
      { status: 'Paid', count: payments.filter(p => p.status === 'paid').length },
      { status: 'Pending', count: payments.filter(p => p.status === 'pending').length },
      { status: 'Late', count: payments.filter(p => p.status === 'late').length }
    ];

    // New tenants by month
    const newTenantsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthTenants = agreements.filter(agreement => {
        const agreementDate = new Date(agreement.createdAt);
        return agreementDate.getMonth() === monthDate.getMonth() &&
               agreementDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      newTenantsByMonth.push({ month: monthName, count: monthTenants });
    }

    res.json({
      totalRevenue,
      activeProperties,
      occupancyRate,
      pendingPayments,
      revenueByMonth,
      topProperties,
      paymentsByStatus,
      newTenantsByMonth
    });
  } catch (err) {
    console.error("Get owner analytics error", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export const ownerRentSummary = async (req, res) => {
  try {
    const agreements = await Agreement.find({ owner: req.user.id, status: "active" }).select("_id");
    const agreementIds = agreements.map((a) => a._id);

    const payments = await Payment.find({ agreement: { $in: agreementIds } });

    const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalReceived = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount + p.lateFee, 0);
    const totalPending = totalExpected - totalReceived;

    res.json({
      totalExpected,
      totalReceived,
      totalPending,
    });
  } catch (err) {
    console.error("Owner rent summary error", err);
    res.status(500).json({ message: "Failed to load rent summary" });
  }
};

