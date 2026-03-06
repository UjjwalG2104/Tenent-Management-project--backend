import mongoose from 'mongoose';
import Agreement from './src/models/Agreement.js';

async function migrateAgreementSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/rental_system');
    console.log('Connected to MongoDB for migration');

    // Find all agreements that don't have the new fields
    const agreements = await Agreement.find({
      $or: [
        { rejectionReason: { $exists: false } },
        { rejectedAt: { $exists: false } },
        { approvedAt: { $exists: false } },
        { approvedBy: { $exists: false } },
        { rejectedBy: { $exists: false } }
      ]
    });

    console.log(`Found ${agreements.length} agreements to migrate`);

    // Update each agreement with default values for new fields
    for (const agreement of agreements) {
      const updateData = {
        $set: {
          rejectionReason: agreement.rejectionReason || null,
          rejectedAt: agreement.rejectedAt || null,
          approvedAt: agreement.approvedAt || null,
          approvedBy: agreement.approvedBy || null,
          rejectedBy: agreement.rejectedBy || null
        }
      };

      await Agreement.updateOne({ _id: agreement._id }, updateData);
      console.log(`Migrated agreement: ${agreement._id}`);
    }

    console.log('Migration completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAgreementSchema();
