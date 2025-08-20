import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@mamacare.zw' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      
      // Update password if needed
      existingAdmin.password = 'Admin123!';
      await existingAdmin.save();
      console.log('Updated admin password to: Admin123!');
      
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@mamacare.zw',
      password: 'Admin123!',
      role: 'system_admin',
      facility: 'Ministry of Health',
      region: 'Harare',
      specialization: 'System Administration',
      isActive: true,
      emailVerified: true,
      permissions: [
        'manage_users',
        'manage_patients',
        'manage_appointments',
        'view_analytics',
        'manage_system_settings',
        'view_all_data'
      ]
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@mamacare.zw');
    console.log('Password: Admin123!');
    
    // Also create a doctor user for testing
    const doctorExists = await User.findOne({ email: 'doctor@mamacare.zw' });
    if (!doctorExists) {
      const doctorUser = new User({
        firstName: 'Dr. Mary',
        lastName: 'Chigwedere',
        email: 'doctor@mamacare.zw',
        password: 'Doctor123!',
        role: 'doctor',
        facility: 'Harare Central Hospital',
        region: 'Harare',
        specialization: 'Obstetrics and Gynecology',
        licenseNumber: 'MD-2025-001',
        isActive: true,
        emailVerified: true,
        permissions: [
          'view_patients',
          'manage_assigned_patients',
          'manage_appointments',
          'view_medical_records'
        ]
      });
      
      await doctorUser.save();
      console.log('✅ Doctor user created successfully!');
      console.log('Email: doctor@mamacare.zw');
      console.log('Password: Doctor123!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
