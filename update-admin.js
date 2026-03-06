import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

async function updateAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-agreement');
    console.log('Connected to MongoDB');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@rental.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      await mongoose.connection.close();
      return;
    }
    
    console.log('Found admin user:', adminUser.email);
    console.log('Current role:', adminUser.role);
    console.log('Current isActive:', adminUser.isActive);
    
    // Update password
    const newPasswordHash = await bcrypt.hash('admin123', 10);
    adminUser.passwordHash = newPasswordHash;
    adminUser.isActive = true;
    await adminUser.save();
    
    console.log('✅ Admin password updated successfully!');
    console.log('Email: admin@rental.com');
    console.log('Password: admin123');
    
    // Test password comparison
    const isValid = await bcrypt.compare('admin123', adminUser.passwordHash);
    console.log('Password verification test:', isValid);
    
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
