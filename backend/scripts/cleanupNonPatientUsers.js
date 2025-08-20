import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare';
const DRY_RUN = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';

// Known non-patient accounts and their intended roles
const roleByEmail = {
  'admin@mamacare.zw': 'system_admin',
  'doctor@mamacare.zw': 'doctor',
  'nurse@mamacare.zw': 'nurse',
  'ministry@mamacare.zw': 'ministry_official',
  'provider@mamacare.zw': 'healthcare_provider',
  'john@mamacare.zw': 'nurse',
};

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`DRY_RUN: ${DRY_RUN}`);

    let updatedRoles = 0;
    let deletedPatients = 0;
    let notFound = 0;

    for (const [email, intendedRole] of Object.entries(roleByEmail)) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`- User not found: ${email}`);
        notFound++;
        continue;
      }

      // Fix role if needed
      if (user.role !== intendedRole) {
        console.log(`~ Role change: ${email} ${user.role} -> ${intendedRole}`);
        if (!DRY_RUN) {
          user.role = intendedRole;
          await user.save();
        }
        updatedRoles++;
      } else {
        console.log(`= Role OK: ${email} (${user.role})`);
      }

      // Remove any Patient doc linked to this user
      const patient = await Patient.findOne({ user: user._id }).select('_id');
      if (patient) {
        console.log(`~ Delete Patient doc for ${email} (patientId=${patient._id})`);
        if (!DRY_RUN) {
          await Patient.deleteOne({ _id: patient._id });
        }
        deletedPatients++;
      } else {
        console.log(`= No Patient doc for ${email}`);
      }
    }

    console.log('-------------------------------------');
    console.log(`Users processed: ${Object.keys(roleByEmail).length}`);
    console.log(`Roles updated: ${updatedRoles}`);
    console.log(`Patient docs deleted: ${deletedPatients}`);
    console.log(`Users not found: ${notFound}`);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanup();
