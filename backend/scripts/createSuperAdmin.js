import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createSystemAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare');
    console.log('Connected to MongoDB');

    // Check if system admin already exists
    const existingAdmin = await User.findOne({ role: 'system_admin' });
    if (existingAdmin) {
      console.log('System admin already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log('You can use this account to log in.');
      process.exit(0);
    }

    // Create system admin user
    const systemAdmin = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@mamacare.zw',
      password: 'Admin123!',
      role: 'system_admin',
      phone: '+263771000000',
      isActive: true,
      emailVerified: true
    });

    await systemAdmin.save();
    
    console.log('✅ System administrator created successfully!');
    console.log('==========================================');
    console.log('Login Credentials:');
    console.log('Email: admin@mamacare.zw');
    console.log('Password: Admin123!');
    console.log('Role: system_admin');
    console.log('==========================================');
    console.log('Please change the password after first login for security.');
    console.log('You can now log in and create accounts for other users.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating system admin:', error);
    process.exit(1);
  }
};

// Run the script
createSystemAdmin();
