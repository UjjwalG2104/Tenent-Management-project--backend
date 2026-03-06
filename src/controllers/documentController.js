import Document from "../models/Document.js";
import Property from "../models/Property.js";
import Agreement from "../models/Agreement.js";
import path from 'path';
import fs from 'fs';

export const uploadDocuments = async (req, res) => {
  try {
    const { propertyId, agreementId, type, description } = req.body;
    
    // Verify ownership/permissions
    if (propertyId) {
      const property = await Property.findOne({ 
        _id: propertyId, 
        owner: req.user.id 
      });
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
    }
    
    if (agreementId) {
      const agreement = await Agreement.findOne({ 
        _id: agreementId, 
        owner: req.user.id 
      });
      if (!agreement) {
        return res.status(404).json({ message: "Agreement not found" });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    const documents = req.files.map(file => ({
      property: propertyId || null,
      agreement: agreementId || null,
      uploadedBy: req.user.id,
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/documents/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      type: type || 'other',
      description: description || ''
    }));

    const savedDocuments = await Document.insertMany(documents);

    res.json({ 
      message: "Documents uploaded successfully",
      documents: savedDocuments
    });
  } catch (err) {
    console.error("Upload documents error", err);
    res.status(500).json({ message: "Failed to upload documents" });
  }
};

export const getPropertyDocuments = async (req, res) => {
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

    const documents = await Document.find({ 
      property: propertyId, 
      isActive: true 
    }).populate('uploadedBy', 'name email')
      .sort('-uploadedAt');

    res.json({ documents });
  } catch (err) {
    console.error("Get property documents error", err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

export const getAgreementDocuments = async (req, res) => {
  try {
    const { agreementId } = req.params;
    
    // Verify ownership or tenancy
    const agreement = await Agreement.findOne({ 
      _id: agreementId,
      $or: [
        { owner: req.user.id },
        { tenant: req.user.id }
      ]
    });
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    const documents = await Document.find({ 
      agreement: agreementId, 
      isActive: true 
    }).populate('uploadedBy', 'name email')
      .sort('-uploadedAt');

    res.json({ documents });
  } catch (err) {
    console.error("Get agreement documents error", err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check permissions (owner, admin, or uploader)
    const hasPermission = 
      req.user.role === 'admin' ||
      document.uploadedBy.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Remove file from filesystem
    const filePath = path.join(process.cwd(), document.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Delete document error", err);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
