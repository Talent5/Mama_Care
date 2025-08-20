import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare';

async function backfillPatientsForUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

  // Find active users with role=patient and with no patient profile
  const users = await User.find({ isActive: true, role: 'patient' }).select('_id firstName lastName email role phone');

    let created = 0;
    let already = 0;
  let skippedNonPatients = 0;

    for (const u of users) {
      const existing = await Patient.findOne({ user: u._id }).select('_id');
      if (existing) {
        already += 1;
        continue;
      }

      // Safety check: only proceed for patient role
      if (u.role !== 'patient') {
        skippedNonPatients += 1;
        continue;
      }

      // Create minimal, valid patient document
      const patientDoc = new Patient({
        user: u._id,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        phone: u.phone || '',
        address: 'To be updated',
        facility: 'General Hospital',
        region: 'Harare',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: '+263242791631'
        },
        createdBy: u._id,
        isActive: true,
      });

      await patientDoc.save();
      created += 1;
      console.log(`✅ Created patient profile for user ${u.email || u._id}`);
    }

    console.log('-------------------------------------');
    console.log(`Patients created: ${created}`);
    console.log(`Users already had patients: ${already}`);
  console.log(`Skipped (non-patient roles): ${skippedNonPatients}`);
  } catch (err) {
    console.error('Error during backfill:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

backfillPatientsForUsers();
