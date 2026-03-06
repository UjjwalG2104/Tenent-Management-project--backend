import MaintenanceRequest from "../models/MaintenanceRequest.js";
import Property from "../models/Property.js";

export const createMaintenanceRequest = async (req, res) => {
  try {
    const { propertyId, title, description, category, priority } = req.body;

    // Verify tenant has active agreement for this property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const request = new MaintenanceRequest({
      property: propertyId,
      requestedBy: req.user.id,
      title,
      description,
      category,
      priority
    });

    await request.save();
    await request.populate(['property', 'requestedBy']);

    res.json({ request });
  } catch (err) {
    console.error("Create maintenance request error", err);
    res.status(500).json({ message: "Failed to create maintenance request" });
  }
};

export const getPropertyMaintenanceRequests = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Verify ownership or tenancy
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const requests = await MaintenanceRequest.find({ property: propertyId })
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Get maintenance requests error", err);
    res.status(500).json({ message: "Failed to fetch maintenance requests" });
  }
};

export const updateMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, assignedTo, estimatedCost, actualCost } = req.body;

    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    // Verify ownership/permission
    const property = await Property.findById(request.property);
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Update request
    if (status) request.status = status;
    if (assignedTo) request.assignedTo = assignedTo;
    if (estimatedCost) request.estimatedCost = estimatedCost;
    if (actualCost) request.actualCost = actualCost;
    if (status === 'completed') request.completedAt = new Date();

    await request.save();
    await request.populate(['property', 'requestedBy', 'assignedTo']);

    res.json({ request });
  } catch (err) {
    console.error("Update maintenance request error", err);
    res.status(500).json({ message: "Failed to update maintenance request" });
  }
};

export const addMaintenanceComment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;

    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    // Verify permission (owner, tenant, or admin)
    const property = await Property.findById(request.property);
    const hasPermission = 
      property.owner.toString() === req.user.id ||
      request.requestedBy.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Add comment
    request.comments.push({
      author: req.user.id,
      text: comment,
      createdAt: new Date()
    });

    await request.save();
    await request.populate('comments.author', 'name email');

    res.json({ request });
  } catch (err) {
    console.error("Add maintenance comment error", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

export const getTenantMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ requestedBy: req.user.id })
      .populate('property', 'title address')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Get tenant maintenance requests error", err);
    res.status(500).json({ message: "Failed to fetch maintenance requests" });
  }
};

export const getOwnerMaintenanceRequests = async (req, res) => {
  try {
    // Get all properties owned by user
    const properties = await Property.find({ owner: req.user.id });
    const propertyIds = properties.map(p => p._id);

    const requests = await MaintenanceRequest.find({ 
      property: { $in: propertyIds }
    })
      .populate('property', 'title address')
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Get owner maintenance requests error", err);
    res.status(500).json({ message: "Failed to fetch maintenance requests" });
  }
};
