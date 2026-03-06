import Availability from "../models/Availability.js";
import Property from "../models/Property.js";

export const getPropertyAvailability = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Get availability for the specified month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const availability = await Availability.find({
      property: propertyId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Format as object with date as key
    const availabilityMap = {};
    availability.forEach(item => {
      availabilityMap[item.date] = item.status;
    });

    res.json({ availability: availabilityMap });
  } catch (err) {
    console.error("Get availability error", err);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
};

export const updatePropertyAvailability = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { date, status, notes } = req.body;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Update or create availability record
    const availability = await Availability.findOneAndUpdate(
      { property: propertyId, date },
      { 
        status, 
        notes, 
        updatedBy: req.user.id 
      },
      { upsert: true, new: true }
    );

    res.json({ availability });
  } catch (err) {
    console.error("Update availability error", err);
    res.status(500).json({ message: "Failed to update availability" });
  }
};

export const getAvailabilityCalendar = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;

    // Verify ownership
    const property = await Property.findOne({ 
      _id: propertyId, 
      owner: req.user.id 
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Get full calendar data
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const availability = await Availability.find({
      property: propertyId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('updatedBy', 'name');

    res.json({ availability });
  } catch (err) {
    console.error("Get calendar error", err);
    res.status(500).json({ message: "Failed to fetch calendar" });
  }
};
