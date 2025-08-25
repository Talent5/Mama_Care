import express from 'express';
import { body, validationResult, param } from 'express-validator';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { auth, roleAuth } from '../middleware/auth.js';
import { createPatientAssignmentNotification } from './notifications.js';

const router = express.Router();

// Test route to check current user
router.get('/test-user', auth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    }
  });
});

// @route   POST /api/patients/:patientId/assign-doctor
// @desc    Assign a doctor to a patient
// @access  Private (Admin, Healthcare Provider)
router.post('/:patientId/assign-doctor', [
  auth,
  roleAuth('system_admin', 'healthcare_provider'),
  param('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId } = req.params;
    const { doctorId, reason } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId).populate('user', 'firstName lastName email');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify doctor exists and has correct role
    const doctor = await User.findById(doctorId);
    if (!doctor || !['doctor', 'healthcare_provider'].includes(doctor.role)) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or invalid role'
      });
    }

    // Check if patient is already assigned to this doctor
    if (patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already assigned to this doctor'
      });
    }

    // Update patient with assigned doctor
    patient.assignedDoctor = doctorId;
    patient.assignmentDate = new Date();
    patient.assignmentReason = reason || 'Administrative assignment';
    patient.assignedBy = req.user.id;

    await patient.save();

    // Create notification for the doctor
    createPatientAssignmentNotification(doctorId, patient);

    // Populate the assigned doctor info for response
    await patient.populate('assignedDoctor', 'firstName lastName email specialization');

    res.json({
      success: true,
      message: 'Doctor assigned to patient successfully',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.user.firstName} ${patient.user.lastName}`,
          email: patient.user.email,
          assignedDoctor: {
            id: patient.assignedDoctor._id,
            name: `${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}`,
            email: patient.assignedDoctor.email,
            specialization: patient.assignedDoctor.specialization
          },
          assignmentDate: patient.assignmentDate,
          assignmentReason: patient.assignmentReason
        }
      }
    });

  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/assignment/my-patients
// @desc    Get patients assigned to the current doctor (or all patients for system admin)
// @access  Private (Doctor, Healthcare Provider, System Admin)
router.get('/my-patients', [
  auth,
  roleAuth('doctor', 'healthcare_provider', 'system_admin')
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, riskLevel, isActive } = req.query;
    
    // Build query for patients
    let query = {};
    
    // If user is not system admin, only show patients assigned to them
    if (req.user.role !== 'system_admin') {
      query.assignedDoctor = req.user.id;
    }
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (riskLevel) query['currentPregnancy.riskLevel'] = riskLevel;

    let patients;
    if (search) {
      // Search in populated user fields
      patients = await Patient.find(query)
        .populate({
          path: 'user',
          match: {
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          },
          select: 'firstName lastName email phone avatar'
        })
        .populate('assignedDoctor', 'firstName lastName email specialization')
        .populate('createdBy', 'firstName lastName')
        .sort({ assignmentDate: -1 })
        .skip(skip)
        .limit(limit);
      
      // Filter out patients where user didn't match the search
      patients = patients.filter(patient => patient.user);
    } else {
      patients = await Patient.find(query)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('assignedDoctor', 'firstName lastName email specialization')
        .populate('createdBy', 'firstName lastName')
        .sort({ assignmentDate: -1 })
        .skip(skip)
        .limit(limit);
    }

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get my patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/patients/all-app-users
// @desc    Get all mobile app users (for system admin)
// @access  Private (System Admin only)
router.get('/all-app-users', [
  auth,
  roleAuth('system_admin')
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, hasPatientProfile, isActive } = req.query;
    
    // Build query for mobile app users (patients)
    let userQuery = { role: 'patient' };
    if (isActive !== undefined) userQuery.isActive = isActive === 'true';
    
    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users
    const users = await User.find(userQuery)
      .select('firstName lastName email phone avatar isActive createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get patient profiles for these users
    const userIds = users.map(user => user._id);
    const patients = await Patient.find({ user: { $in: userIds } })
      .populate('assignedDoctor', 'firstName lastName email specialization')
      .select('user assignedDoctor currentPregnancy assignmentDate isActive createdAt');

    // Create a map of user ID to patient data
    const patientMap = new Map();
    patients.forEach(patient => {
      // patient.user is populated, so we need to get the _id from the populated object
      const userId = patient.user._id ? patient.user._id.toString() : patient.user.toString();
      patientMap.set(userId, patient);
    });

    // Combine user and patient data
    const appUsers = users.map(user => {
      const patient = patientMap.get(user._id.toString());
      return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        hasPatientProfile: !!patient,
        patientInfo: patient ? {
          id: patient._id,
          isPregnant: patient.currentPregnancy?.isPregnant || false,
          currentWeek: patient.currentPregnancy?.currentWeek || null,
          riskLevel: patient.currentPregnancy?.riskLevel || 'low',
          assignedDoctor: patient.assignedDoctor ? {
            id: patient.assignedDoctor._id,
            name: `${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}`,
            email: patient.assignedDoctor.email,
            specialization: patient.assignedDoctor.specialization
          } : null,
          assignmentDate: patient.assignmentDate
        } : null
      };
    });

    // Filter by hasPatientProfile if specified
    const filteredUsers = hasPatientProfile !== undefined 
      ? appUsers.filter(user => user.hasPatientProfile === (hasPatientProfile === 'true'))
      : appUsers;

    const total = await User.countDocuments(userQuery);

    res.json({
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        },
        summary: {
          totalAppUsers: total,
          usersWithPatientProfiles: patients.length,
          usersWithAssignedDoctors: patients.filter(p => p.assignedDoctor).length
        }
      }
    });

  } catch (error) {
    console.error('Get all app users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients/auto-assign-doctor
// @desc    Auto-assign doctor to new patient based on workload
// @access  Private (System function - called during patient registration)
router.post('/auto-assign-doctor', [
  auth,
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('region').optional().isString().withMessage('Region must be a string'),
  body('specialization').optional().isString().withMessage('Specialization must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId, region, specialization } = req.body;

    // Get patient
    const patient = await Patient.findById(patientId).populate('user', 'firstName lastName email');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Find suitable doctor
    const doctor = await findBestDoctorForPatient(patient, region, specialization);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No available doctor found for assignment'
      });
    }

    // Assign doctor
    patient.assignedDoctor = doctor._id;
    patient.assignmentDate = new Date();
    patient.assignmentReason = 'Automatic assignment on registration';
    patient.assignedBy = req.user.id;

    await patient.save();

    // Create notification for the doctor
    createPatientAssignmentNotification(doctor._id, patient);

    // Populate doctor info
    await patient.populate('assignedDoctor', 'firstName lastName email specialization');

    res.json({
      success: true,
      message: 'Doctor automatically assigned to patient',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.user.firstName} ${patient.user.lastName}`,
          assignedDoctor: {
            id: doctor._id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            email: doctor.email,
            specialization: doctor.specialization
          }
        }
      }
    });

  } catch (error) {
    console.error('Auto assign doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to find the best doctor for a patient
async function findBestDoctorForPatient(patient, preferredRegion, preferredSpecialization) {
  try {
    // Build query for available doctors
    let doctorQuery = {
      role: { $in: ['doctor', 'healthcare_provider'] },
      isActive: true
    };

    // Prefer doctors in the same region
    if (preferredRegion) {
      doctorQuery.region = preferredRegion;
    }

    // Prefer doctors with specific specialization
    if (preferredSpecialization) {
      doctorQuery.specialization = preferredSpecialization;
    }

    // Get doctors with their current patient count
    const doctors = await User.aggregate([
      { $match: doctorQuery },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'assignedDoctor',
          as: 'assignedPatients'
        }
      },
      {
        $addFields: {
          patientCount: { $size: '$assignedPatients' }
        }
      },
      {
        $sort: { patientCount: 1, createdAt: 1 } // Sort by lowest patient count, then by seniority
      },
      {
        $limit: 1
      }
    ]);

    return doctors.length > 0 ? doctors[0] : null;

  } catch (error) {
    console.error('Error finding best doctor:', error);
    return null;
  }
}

// Helper function to create notification for doctor
async function createDoctorNotification(doctorId, patient, type) {
  try {
    // This is a simplified notification - in production, you might use a proper notification service
    console.log(`🔔 Notification: Doctor ${doctorId} assigned new patient ${patient.user.firstName} ${patient.user.lastName}`);
    
    // Here you could:
    // 1. Send email notification
    // 2. Create in-app notification
    // 3. Send push notification
    // 4. Log to notification database
    
    return true;
  } catch (error) {
    console.error('Error creating doctor notification:', error);
    return false;
  }
}

export default router;
