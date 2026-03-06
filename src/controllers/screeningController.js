import { ScreeningCriteria, TenantApplication } from "../models/TenantApplication.js";
import Property from "../models/Property.js";

export const getScreeningCriteria = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    let criteria = await ScreeningCriteria.findOne({ property: propertyId });
    if (!criteria) {
      // Create default criteria
      criteria = new ScreeningCriteria({ property: propertyId });
      await criteria.save();
    }

    res.json({ criteria });
  } catch (err) {
    console.error("Get screening criteria error", err);
    res.status(500).json({ message: "Failed to fetch screening criteria" });
  }
};

export const updateScreeningCriteria = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const criteria = await ScreeningCriteria.findOneAndUpdate(
      { property: propertyId },
      req.body,
      { upsert: true, new: true }
    );

    res.json({ criteria });
  } catch (err) {
    console.error("Update screening criteria error", err);
    res.status(500).json({ message: "Failed to update screening criteria" });
  }
};

export const submitTenantApplication = async (req, res) => {
  try {
    const { propertyId, ...applicationData } = req.body;

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Create application
    const application = new TenantApplication({
      property: propertyId,
      applicant: req.user.id,
      ...applicationData
    });

    await application.save();
    await application.populate(['property', 'applicant']);

    res.json({ application });
  } catch (err) {
    console.error("Submit tenant application error", err);
    res.status(500).json({ message: "Failed to submit application" });
  }
};

export const getPropertyApplications = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const applications = await TenantApplication.find({ property: propertyId })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    console.error("Get property applications error", err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const processTenantApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { decision, notes } = req.body;

    const application = await TenantApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify ownership
    const property = await Property.findById(application.property);
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Update application
    application.status = decision;
    application.reviewedBy = req.user.id;
    application.reviewNotes = notes;
    application.decisionDate = new Date();

    await application.save();
    await application.populate(['property', 'applicant', 'reviewedBy']);

    res.json({ application });
  } catch (err) {
    console.error("Process tenant application error", err);
    res.status(500).json({ message: "Failed to process application" });
  }
};

export const getTenantApplications = async (req, res) => {
  try {
    const applications = await TenantApplication.find({ applicant: req.user.id })
      .populate('property', 'title address')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    console.error("Get tenant applications error", err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const calculateScreeningScore = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await TenantApplication.findById(applicationId).populate('property');
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const criteria = await ScreeningCriteria.findOne({ property: application.property._id });
    if (!criteria) {
      return res.status(404).json({ message: "Screening criteria not found" });
    }

    // Calculate score
    let score = 0;
    const maxScore = 100;

    // Credit Score (40%)
    if (application.creditScore >= criteria.minCreditScore) {
      score += 40;
    } else {
      score += (application.creditScore / criteria.minCreditScore) * 40;
    }

    // Income (30%)
    if (application.income >= criteria.minIncome) {
      score += 30;
    } else {
      score += (application.income / criteria.minIncome) * 30;
    }

    // References (20%)
    if (application.references.length >= criteria.requiredReferences) {
      score += 20;
    } else {
      score += (application.references.length / criteria.requiredReferences) * 20;
    }

    // Background Check (10%)
    if (application.backgroundCheckPassed) {
      score += 10;
    }

    const finalScore = Math.round(score);

    // Update application with score
    application.screeningScore = finalScore;
    await application.save();

    res.json({ score: finalScore, breakdown: {
      creditScore: Math.min(40, (application.creditScore / criteria.minCreditScore) * 40),
      income: Math.min(30, (application.income / criteria.minIncome) * 30),
      references: Math.min(20, (application.references.length / criteria.requiredReferences) * 20),
      backgroundCheck: application.backgroundCheckPassed ? 10 : 0
    }});
  } catch (err) {
    console.error("Calculate screening score error", err);
    res.status(500).json({ message: "Failed to calculate screening score" });
  }
};
