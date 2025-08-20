import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare';

async function auditPatientRoleConsistency() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const patients = await Patient.find({}).select('user');
    const userIdsWithPatient = new Set(
      patients.map(p => {
        const uid = p.user && p.user._id ? p.user._id : p.user;
        return String(uid);
      })
    );

    const users = await User.find({ isActive: true }).select('_id email role');

    const nonPatientUsersWithPatient = [];
    const patientRoleWithoutPatient = [];

    for (const u of users) {
      const hasPatient = userIdsWithPatient.has(String(u._id));
      if (hasPatient && u.role !== 'patient') {
        nonPatientUsersWithPatient.push({ email: u.email, role: u.role, id: u._id });
      }
      if (!hasPatient && u.role === 'patient') {
        patientRoleWithoutPatient.push({ email: u.email, id: u._id });
      }
    }

    console.log('--- Audit Results ---');
    console.log(`Non-patient users WITH Patient doc: ${nonPatientUsersWithPatient.length}`);
    nonPatientUsersWithPatient.slice(0, 50).forEach(u => console.log(`  - ${u.email} (${u.role})`));

    console.log(`Patient-role users WITHOUT Patient doc: ${patientRoleWithoutPatient.length}`);
    patientRoleWithoutPatient.slice(0, 50).forEach(u => console.log(`  - ${u.email}`));

    console.log('Summary:');
    console.log({
      nonPatientUsersWithPatient: nonPatientUsersWithPatient.length,
      patientRoleWithoutPatient: patientRoleWithoutPatient.length,
    });
  } catch (err) {
    console.error('Audit error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

auditPatientRoleConsistency();
