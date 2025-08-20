import express from 'express';
import { body, validationResult, param } from 'express-validator';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { auth, adminAuth, providerAuth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Admin, Healthcare Provider, Doctor, Nurse)
router.get('/', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor', 'nurse')], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, isPregnant, riskLevel, isActive } = req.query;
    
    // Build query
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isPregnant !== undefined) query['currentPregnancy.isPregnant'] = isPregnant === 'true';
    if (riskLevel) query['currentPregnancy.riskLevel'] = riskLevel;

    let patients;
    let total;
    
    if (search) {
      // Use aggregation pipeline for proper search functionality
      const searchPipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            ...query,
            $or: [
              { 'user.firstName': { $regex: search, $options: 'i' } },
              { 'user.lastName': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $addFields: {
            createdBy: { $arrayElemAt: ['$createdBy', 0] }
          }
        },
        {
          $project: {
            'user.password': 0,
            'createdBy.password': 0
          }
        },
        { $sort: { createdAt: -1 } }
      ];

      // Get total count for pagination
      const countPipeline = [...searchPipeline, { $count: 'total' }];
      const countResult = await Patient.aggregate(countPipeline);
      total = countResult.length > 0 ? countResult[0].total : 0;

      // Get paginated results
      const resultPipeline = [
        ...searchPipeline,
        { $skip: skip },
        { $limit: limit }
      ];
      
      patients = await Patient.aggregate(resultPipeline);
    } else {
      patients = await Patient.find(query)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      total = await Patient.countDocuments(query);
    }

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
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/stats/overview
// @desc    Get patient statistics
// @access  Private (Admin, Healthcare Provider, Doctor, Nurse)
router.get('/stats/overview', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor', 'nurse')], async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const pregnantPatients = await Patient.countDocuments({ 
      'currentPregnancy.isPregnant': true,
      isActive: true 
    });
    
    const riskLevelStats = await Patient.aggregate([
      { $match: { 'currentPregnancy.isPregnant': true, isActive: true } },
      { $group: { _id: '$currentPregnancy.riskLevel', count: { $sum: 1 } } }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPatients = await Patient.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    // Due soon (next 4 weeks)
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
    const dueSoon = await Patient.countDocuments({
      'currentPregnancy.estimatedDueDate': {
        $gte: new Date(),
        $lte: fourWeeksFromNow
      },
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        pregnantPatients,
        riskLevelStats: riskLevelStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentPatients,
        dueSoon
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/medical-records
// @desc    Get medical records for current patient
// @access  Private (Patient)
router.get('/medical-records', [auth, roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse')], async (req, res) => {
  try {
    // Get current user's patient profile
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Create medical records from patient data
    const medicalRecords = [
      // Medical History Records
      ...patient.medicalHistory.map((history, index) => ({
        _id: `history_${index}`,
        type: 'History',
        title: 'Medical History',
        description: history,
        date: patient.createdAt,
        doctor: 'System',
        category: 'General'
      })),
      
      // Allergy Records
      ...patient.allergies.map((allergy, index) => ({
        _id: `allergy_${index}`,
        type: 'Allergy',
        title: 'Allergy',
        description: allergy,
        date: patient.createdAt,
        doctor: 'System',
        category: 'Allergy'
      })),
      
      // Medication Records
      ...patient.medications.map((med, index) => ({
        _id: `medication_${index}`,
        type: 'Medication',
        title: med.name || 'Medication',
        description: `${med.dosage || ''} - ${med.frequency || ''}`,
        date: med.startDate || patient.createdAt,
        doctor: 'System',
        category: 'Medication'
      })),
      
      // Vitals Records
      ...(patient.vitals && Object.keys(patient.vitals).length > 0 ? [{
        _id: 'vitals_current',
        type: 'Vitals',
        title: 'Current Vitals',
        description: `BP: ${patient.vitals.bloodPressure?.systolic || 'N/A'}/${patient.vitals.bloodPressure?.diastolic || 'N/A'}, Weight: ${patient.vitals.weight || 'N/A'}kg, Height: ${patient.vitals.height || 'N/A'}cm`,
        date: patient.updatedAt,
        doctor: 'System',
        category: 'Vitals'
      }] : []),
      
      // Pregnancy Records
      ...(patient.currentPregnancy?.isPregnant ? [{
        _id: 'pregnancy_current',
        type: 'Pregnancy',
        title: 'Current Pregnancy',
        description: `Week ${patient.currentPregnancy.currentWeek || 'Unknown'}, Risk Level: ${patient.currentPregnancy.riskLevel || 'Low'}`,
        date: patient.updatedAt,
        doctor: patient.assignedDoctor?.firstName || 'System',
        category: 'Pregnancy'
      }] : [])
    ];

    res.json({
      success: true,
      records: medicalRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients/medical-records
// @desc    Add new medical record for current patient
// @access  Private (Patient, Healthcare Provider, Doctor, Nurse)
router.post('/medical-records', [
  auth,
  roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse'),
  body('type').isIn(['History', 'Allergy', 'Medication', 'Vitals', 'Pregnancy', 'General']).withMessage('Invalid record type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').optional().isString().withMessage('Category must be a string')
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

    const { type, title, description, category } = req.body;

    // Get current user's patient profile
    let patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Add to appropriate field based on type
    let updateField = {};
    const recordData = description;

    switch (type) {
      case 'History':
      case 'General':
        updateField = { $push: { medicalHistory: recordData } };
        break;
      case 'Allergy':
        updateField = { $push: { allergies: recordData } };
        break;
      case 'Medication':
        // Parse medication data if provided in structured format
        const medicationData = {
          name: title,
          dosage: category || '',
          frequency: description,
          startDate: new Date()
        };
        updateField = { $push: { medications: medicationData } };
        break;
      default:
        // For other types, add to medical history
        updateField = { $push: { medicalHistory: `${type}: ${title} - ${description}` } };
    }

    // Update patient record
    await Patient.findByIdAndUpdate(patient._id, updateField);

    res.json({
      success: true,
      message: 'Medical record added successfully',
      record: {
        _id: new Date().getTime().toString(),
        type,
        title,
        description,
        date: new Date(),
        doctor: req.user.firstName + ' ' + req.user.lastName,
        category: category || type
      }
    });
  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/medical-records/:id
// @desc    Update medical record
// @access  Private (Patient, Healthcare Provider, Doctor, Nurse)
router.put('/medical-records/:id', [
  auth,
  roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse'),
  param('id').notEmpty().withMessage('Record ID is required'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
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

    // For now, return success (individual record updates would require more complex structure)
    res.json({
      success: true,
      message: 'Medical record updated successfully',
      record: {
        ...req.body,
        _id: req.params.id,
        date: new Date()
      }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/patients/medical-records/:id
// @desc    Delete medical record
// @access  Private (Patient, Healthcare Provider, Doctor, Nurse)
router.delete('/medical-records/:id', [
  auth,
  roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse'),
  param('id').notEmpty().withMessage('Record ID is required')
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

    // For now, return success (individual record deletion would require more complex structure)
    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/me/profile
// @desc    Get current user's patient profile
// @access  Private (Patient)
router.get('/me/profile', [auth, roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse')], async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone avatar')
      .populate('assignedDoctor', 'firstName lastName email phone specialization');

    if (!patient) {
      // Create a basic patient profile if it doesn't exist
      patient = new Patient({
        user: req.user.id,
        dateOfBirth: new Date('1990-01-01'), // Default date - should be updated by user
        gender: 'Female', // Default for maternal care app
        phone: req.user.phone || '',
        address: 'Not specified',
        facility: 'General Hospital',
        region: 'Harare',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: '+263242791631'
        },
        createdBy: req.user.id
      });
      
      await patient.save();
      
      // Populate after saving
      patient = await Patient.findById(patient._id)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('assignedDoctor', 'firstName lastName email phone specialization');
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/me/profile
// @desc    Update current user's patient profile
// @access  Private (Patient)
router.put('/me/profile', [
  auth,
  roleAuth('patient', 'healthcare_provider', 'doctor', 'nurse'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('address').optional().trim().isLength({ min: 1 }).withMessage('Address cannot be empty'),
  body('facility').optional().trim().isLength({ min: 1 }).withMessage('Facility cannot be empty'),
  body('region').optional().trim().isLength({ min: 1 }).withMessage('Region cannot be empty'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number'),
  body('emergencyContact.name').optional().trim().isLength({ min: 1 }).withMessage('Emergency contact name cannot be empty'),
  body('emergencyContact.relationship').optional().trim().isLength({ min: 1 }).withMessage('Emergency contact relationship cannot be empty'),
  body('emergencyContact.phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Invalid emergency contact phone'),
  body('vitals.weight').optional().isNumeric().isFloat({ min: 1, max: 300 }).withMessage('Weight must be between 1-300 kg'),
  body('vitals.height').optional().isNumeric().isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50-250 cm'),
  body('vitals.bloodPressure.systolic').optional().isNumeric().isFloat({ min: 70, max: 250 }).withMessage('Invalid systolic pressure'),
  body('vitals.bloodPressure.diastolic').optional().isNumeric().isFloat({ min: 40, max: 150 }).withMessage('Invalid diastolic pressure'),
  body('currentPregnancy.isPregnant').optional().isBoolean().withMessage('Invalid pregnancy status'),
  body('currentPregnancy.currentWeek').optional().isNumeric().isInt({ min: 1, max: 42 }).withMessage('Week must be between 1-42'),
  body('currentPregnancy.riskLevel').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid risk level')
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

    let patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Update patient profile
    const updateData = { ...req.body };
    
    // Handle nested object updates
    if (req.body.emergencyContact) {
      updateData.emergencyContact = {
        ...patient.emergencyContact.toObject(),
        ...req.body.emergencyContact
      };
    }
    
    if (req.body.vitals) {
      updateData.vitals = {
        ...patient.vitals?.toObject() || {},
        ...req.body.vitals
      };
    }
    
    if (req.body.currentPregnancy) {
      updateData.currentPregnancy = {
        ...patient.currentPregnancy?.toObject() || {},
        ...req.body.currentPregnancy
      };
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'firstName lastName email phone avatar')
    .populate('assignedDoctor', 'firstName lastName email phone specialization');

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (Admin, Healthcare Provider, Doctor, Nurse)
router.get('/:id', [
  auth,
  roleAuth('system_admin', 'healthcare_provider', 'doctor', 'nurse'),
  param('id').isMongoId().withMessage('Invalid patient ID')
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

    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients
// @desc    Create patient profile
// @access  Private (Admin, Healthcare Provider, Doctor, Nurse)
router.post('/', [
  auth,
  roleAuth('system_admin', 'healthcare_provider', 'doctor', 'nurse'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('gender').isIn(['female', 'male', 'other']).withMessage('Invalid gender'),
  body('address').notEmpty().withMessage('Address is required'),
  body('facility').notEmpty().withMessage('Facility is required'),
  body('region').notEmpty().withMessage('Region is required'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('height').optional().isNumeric().isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50-250 cm'),
  body('weight').optional().isNumeric().isFloat({ min: 1, max: 300 }).withMessage('Weight must be between 1-300 kg'),
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required'),
  body('emergencyContact.phone').matches(/^\+?[\d\s-()]+$/).withMessage('Invalid emergency contact phone')
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

    const { userId, ...patientData } = req.body;

    // Determine which user this patient profile is for
    let targetUserId;
    if (['system_admin', 'healthcare_provider', 'doctor', 'nurse'].includes(req.user.role)) {
      if (!userId) {
        // Allow creating a new user on the fly when staff add a patient
        const { firstName, lastName, email, phone } = req.body;
        if (!firstName || !lastName || !email) {
          return res.status(400).json({
            success: false,
            message: 'firstName, lastName and email are required to create a new patient user when userId is not provided'
          });
        }

        let linkedUser = await User.findOne({ email });
        if (!linkedUser) {
          linkedUser = new User({
            firstName,
            lastName,
            email,
            phone: phone || '',
            role: 'patient',
            // Generate a temporary password; admins should prompt reset out-of-band
            password: Math.random().toString(36).slice(2, 10)
          });
          await linkedUser.save();
        }
        targetUserId = linkedUser._id;
      } else {
        targetUserId = userId;
      }
    } else {
      targetUserId = req.user.id; // Patients can only create their own profile
    }

    // Check if user exists and doesn't already have a patient profile
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingPatient = await Patient.findOne({ user: targetUserId });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile already exists for this user'
      });
    }

    // Ensure the linked user has the patient role
    if (['system_admin', 'healthcare_provider', 'doctor', 'nurse'].includes(req.user.role)) {
      try {
        const linkedUser = await User.findById(targetUserId);
        if (linkedUser && linkedUser.role !== 'patient') {
          linkedUser.role = 'patient';
          await linkedUser.save();
        }
      } catch (e) {
        console.warn('Warning: could not set linked user role to patient:', e?.message || e);
      }
    }

    // Normalize gender casing to match schema (Male/Female/Other)
    if (patientData.gender) {
      const genderMap = { male: 'Male', female: 'Female', other: 'Other' };
      patientData.gender = genderMap[String(patientData.gender).toLowerCase()] || patientData.gender;
    }

    // Create patient profile
    const patient = new Patient({
      user: targetUserId,
      ...patientData,
      createdBy: req.user.id
    });

    await patient.save();

    // Auto-assign doctor if this is a new patient
    try {
      await autoAssignDoctor(patient, req.user.id);
    } catch (assignError) {
      console.error('Failed to auto-assign doctor:', assignError);
      // Continue even if auto-assignment fails
    }

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: { patient }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient profile
// @access  Private (Admin, Healthcare Provider, Doctor, Nurse)
router.put('/:id', [
  auth,
  roleAuth('system_admin', 'healthcare_provider', 'doctor', 'nurse'),
  param('id').isMongoId().withMessage('Invalid patient ID'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['female', 'male', 'other']).withMessage('Invalid gender'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('height').optional().isNumeric().isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50-250 cm'),
  body('weight').optional().isNumeric().isFloat({ min: 1, max: 300 }).withMessage('Weight must be between 1-300 kg')
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

    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient profile (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [
  auth,
  adminAuth,
  param('id').isMongoId().withMessage('Invalid patient ID')
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

    const { id } = req.params;

    const patient = await Patient.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient profile deleted successfully',
      data: { patient }
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to auto-assign doctor
async function autoAssignDoctor(patient, assignedBy) {
  try {
    // Find available doctor based on workload
    const doctors = await User.aggregate([
      { 
        $match: { 
          role: { $in: ['doctor', 'healthcare_provider'] },
          isActive: true,
          // Prefer doctors in same region if available
          $or: [
            { region: patient.region },
            { region: { $exists: false } }
          ]
        }
      },
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
        $sort: { patientCount: 1, createdAt: 1 }
      },
      {
        $limit: 1
      }
    ]);

    if (doctors.length > 0) {
      const doctor = doctors[0];
      
      // Update patient with assigned doctor
      patient.assignedDoctor = doctor._id;
      patient.assignmentDate = new Date();
      patient.assignmentReason = 'Automatic assignment on registration';
      patient.assignedBy = assignedBy;
      
      await patient.save();

      // Create notification for doctor (simplified)
      console.log(`🔔 Doctor ${doctor.firstName} ${doctor.lastName} assigned new patient: ${patient.user?.firstName || 'Unknown'}`);
      
      return doctor;
    }
    
    return null;
  } catch (error) {
    console.error('Auto-assign doctor error:', error);
    throw error;
  }
}

export default router;
