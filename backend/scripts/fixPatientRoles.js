import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare';

async function fixPatientRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all patient profiles
    const patients = await Patient.find({}).select('user');
    console.log(`Found ${patients.length} patient profiles`);

    let updated = 0;
    for (const p of patients) {
      const user = await User.findById(p.user).select('role');
      if (!user) continue;
      if (user.role !== 'patient') {
        console.log(`Updating user ${user._id} role ${user.role} -> patient`);
        user.role = 'patient';
        await user.save();
        updated += 1;
      }
    }

    console.log(`Updated ${updated} users to role 'patient'`);
  } catch (err) {
    console.error('Error fixing patient roles:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixPatientRoles();


