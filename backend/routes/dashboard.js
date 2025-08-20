import express from 'express';
import { body, validationResult } from 'express-validator';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { auth } from '../middleware/auth.js';
import HealthMetric from '../models/HealthMetric.js';
import SymptomLog from '../models/SymptomLog.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard data for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId).select('firstName lastName email phone avatar');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get patient data
    const patient = await Patient.findOne({ user: userId });
    
    // Default dashboard data structure
    let dashboardData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar
      },
      pregnancy: {
        isPregnant: false,
        currentWeek: 1,
        dueDate: null,
        estimatedDueDate: null,
        riskLevel: 'low',
        stage: 'First Trimester',
        progressPercentage: 0,
        remainingWeeks: 40,
        babySize: {
          comparison: 'Poppy Seed',
          emoji: '🟡',
          length: '1mm',
          weight: '<1g'
        }
      },
      healthMetrics: {
        waterIntake: { current: 0, target: 8, percentage: 0 },
        prenatalVitamins: { taken: 0, required: 1, percentage: 0 },
        symptoms: [],
        lastCheckup: null,
        nextCheckup: null
      },
      nextAppointment: null,
      recentActivity: [],
      healthTip: {
        title: "Today's Tip",
        category: 'General',
        content: 'Stay hydrated and maintain a healthy lifestyle. Regular exercise and balanced nutrition are key to overall wellness.',
        icon: '💡'
      }
    };

    // If patient exists and is pregnant, populate pregnancy data
    if (patient && patient.currentPregnancy && patient.currentPregnancy.isPregnant) {
      const currentWeek = patient.currentPregnancy.currentWeek || 1;
      const dueDate = patient.currentPregnancy.estimatedDueDate;
      
      dashboardData.pregnancy = {
        isPregnant: true,
        currentWeek,
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
        estimatedDueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
        riskLevel: patient.currentPregnancy.riskLevel || 'low',
        stage: getPregnancyStage(currentWeek),
        progressPercentage: Math.round((currentWeek / 40) * 100),
        remainingWeeks: Math.max(0, 40 - currentWeek),
        babySize: getBabySize(currentWeek)
      };

      // Update health tip for pregnant users
      dashboardData.healthTip = {
        title: "Today's Pregnancy Tip",
        category: 'Pregnancy',
        content: 'Stay hydrated and get plenty of rest during your pregnancy journey.',
        icon: '🤰'
      };
    } else {
      // Set non-pregnant status explicitly and update health metrics
      dashboardData.pregnancy.isPregnant = false;
      dashboardData.healthMetrics.prenatalVitamins = { taken: 0, required: 0, percentage: 0 };
    }

    // Get next appointment
    const nextAppointment = await Appointment.findOne({
      patient: patient?._id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
      isActive: true
    })
    .populate('healthcareProvider', 'firstName lastName')
    .sort({ appointmentDate: 1, appointmentTime: 1 });

    if (nextAppointment) {
      dashboardData.nextAppointment = {
        id: nextAppointment._id,
        title: formatAppointmentTitle(nextAppointment.type),
        date: nextAppointment.appointmentDate.toISOString().split('T')[0],
        time: nextAppointment.appointmentTime,
        doctor: nextAppointment.healthcareProvider ? 
          `Dr. ${nextAppointment.healthcareProvider.firstName} ${nextAppointment.healthcareProvider.lastName}` : 
          'Dr. TBA',
        location: nextAppointment.location || 'Main Hospital',
        duration: nextAppointment.duration ? `${nextAppointment.duration} minutes` : '30 minutes',
        type: nextAppointment.type
      };
    }

    // Generate some mock recent activity
    dashboardData.recentActivity = [
      {
        id: '1',
        type: 'medication',
        description: 'Completed prenatal vitamins',
        timestamp: '2 hours ago',
        icon: '✅'
      },
      {
        id: '2',
        type: 'symptom',
        description: 'Logged daily symptoms',
        timestamp: '5 hours ago',
        icon: '📝'
      },
      {
        id: '3',
        type: 'reading',
        description: 'Read pregnancy article',
        timestamp: '1 day ago',
        icon: '📖'
      }
    ];

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/dashboard/health-metrics
// @desc    Record health metric
// @access  Private
router.post('/health-metrics', [
  auth,
  body('type').isIn(['water_intake', 'prenatal_vitamins', 'exercise', 'sleep', 'weight', 'blood_pressure']).withMessage('Invalid metric type'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('unit').notEmpty().withMessage('Unit is required')
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

    const { type, value, unit, notes } = req.body;

    // Ensure patient profile exists for current user (auto-create only for patient role)
    let patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ success: false, message: 'Only patient users can record health metrics' });
      }
      try {
        patient = await Patient.create({
          user: req.user.id,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Female',
          address: 'To be updated',
          facility: 'General Hospital',
          region: 'Harare',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+263242791631'
          },
          createdBy: req.user.id,
        });
      } catch (e) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
    }

    // Persist health metric
    const metric = await HealthMetric.create({
      patient: patient._id,
      user: req.user.id,
      type,
      value,
      unit,
      notes,
    });

    // Also track activity
    try {
      await ActivityLog.create({
        user: req.user.id,
        patient: patient._id,
        type: 'health_metric',
        description: `Recorded ${type.replace('_', ' ')}`,
        metadata: { unit, notes },
        value,
        unit,
        timestamp: new Date(),
      });
    } catch {}

    res.json({
      success: true,
      message: 'Health metric recorded successfully',
      data: metric,
    });

  } catch (error) {
    console.error('Health metric recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/health-metrics
// @desc    Get health metrics for current user (optional filters: type, days)
// @access  Private
router.get('/health-metrics', [auth], async (req, res) => {
  try {
    const { type, days } = req.query;
    let patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ success: false, message: 'Only patient users can view their health metrics' });
      }
      try {
        patient = await Patient.create({
          user: req.user.id,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Female',
          address: 'To be updated',
          facility: 'General Hospital',
          region: 'Harare',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+263242791631'
          },
          createdBy: req.user.id,
        });
      } catch (e) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
    }

    const query = { patient: patient._id };
    if (type) Object.assign(query, { type });
    if (days) {
      const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      Object.assign(query, { recordedAt: { $gte: since } });
    }

    const metrics = await HealthMetric.find(query).sort({ recordedAt: -1 });
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Get health metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/dashboard/symptom-logs
// @desc    Log symptoms
// @access  Private
router.post('/symptom-logs', [
  auth,
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('severity').isIn(['mild', 'moderate', 'severe']).withMessage('Invalid severity level')
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

    const { symptoms, severity, notes } = req.body;

    // Find patient by current user
    let patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ success: false, message: 'Only patient users can log symptoms' });
      }
      try {
        patient = await Patient.create({
          user: req.user.id,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Female',
          address: 'To be updated',
          facility: 'General Hospital',
          region: 'Harare',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+263242791631'
          },
          createdBy: req.user.id,
        });
      } catch (e) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
    }

    // Persist symptom log
    const symptomLog = await SymptomLog.create({
      patient: patient._id,
      user: req.user.id,
      symptoms,
      severity,
      notes,
    });

    // Track activity for symptom log
    try {
      await ActivityLog.create({
        user: req.user.id,
        patient: patient._id,
        type: 'symptom_log',
        description: `Logged symptoms (${severity})`,
        metadata: { symptoms, notes },
        severity,
        timestamp: new Date(),
      });
    } catch {}

    // Optionally, update patient's currentPregnancy.symptoms summary list
    try {
      const uniqueSymptoms = Array.from(new Set([...(patient.currentPregnancy?.symptoms || []), ...symptoms]));
      patient.currentPregnancy = {
        ...patient.currentPregnancy?.toObject?.() || patient.currentPregnancy || {},
        symptoms: uniqueSymptoms,
      };
      await patient.save();
    } catch {}

    res.json({
      success: true,
      message: 'Symptoms logged successfully',
      data: symptomLog,
    });

  } catch (error) {
    console.error('Symptom logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/symptom-logs
// @desc    Get symptom logs for current user (optional filters: days)
// @access  Private
router.get('/symptom-logs', [auth], async (req, res) => {
  try {
    const { days } = req.query;
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ success: false, message: 'Only patient users can view their symptom logs' });
      }
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const query = { patient: patient._id };
    if (days) {
      const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      Object.assign(query, { recordedAt: { $gte: since } });
    }

    const logs = await SymptomLog.find(query).sort({ recordedAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get symptom logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update pregnancy current week (for app convenience)
// @route   PUT /api/dashboard/pregnancy/week
// @access  Private (Patient)
router.put('/pregnancy/week', [
  auth,
  body('currentWeek').isInt({ min: 1, max: 42 }).withMessage('Week must be between 1 and 42')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { currentWeek } = req.body;
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    patient.currentPregnancy = {
      ...patient.currentPregnancy?.toObject?.() || patient.currentPregnancy || {},
      isPregnant: true,
      currentWeek,
    };
    await patient.save();

    res.json({ success: true, message: 'Pregnancy week updated', data: { currentWeek } });
  } catch (error) {
    console.error('Update pregnancy week error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/dashboard/emergency-call
// @desc    Log emergency call attempt
// @access  Private
router.post('/emergency-call', [
  auth,
  body('type').isIn(['ambulance', 'maternity_ward']).withMessage('Invalid emergency type')
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

    const { type } = req.body;

    // Log the emergency call attempt
    console.log(`Emergency call initiated by user ${req.user.id}: ${type}`);

    res.json({
      success: true,
      message: 'Emergency call logged'
    });

  } catch (error) {
    console.error('Emergency call logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions
function getPregnancyStage(week) {
  if (week <= 12) return 'First Trimester';
  if (week <= 28) return 'Second Trimester';
  return 'Third Trimester';
}

function getBabySize(week) {
  const sizes = {
    1: { comparison: 'Poppy Seed', emoji: '🟡', length: '1mm', weight: '<1g' },
    4: { comparison: 'Sesame Seed', emoji: '🌰', length: '2mm', weight: '<1g' },
    8: { comparison: 'Raspberry', emoji: '🫐', length: '2cm', weight: '2g' },
    12: { comparison: 'Lime', emoji: '🟢', length: '6cm', weight: '14g' },
    16: { comparison: 'Avocado', emoji: '🥑', length: '12cm', weight: '100g' },
    20: { comparison: 'Banana', emoji: '🍌', length: '16cm', weight: '300g' },
    24: { comparison: 'Corn', emoji: '🌽', length: '30cm', weight: '600g' },
    28: { comparison: 'Eggplant', emoji: '🍆', length: '35cm', weight: '1kg' },
    32: { comparison: 'Pineapple', emoji: '🍍', length: '40cm', weight: '1.7kg' },
    36: { comparison: 'Papaya', emoji: '🥭', length: '45cm', weight: '2.6kg' },
    40: { comparison: 'Watermelon', emoji: '🍉', length: '50cm', weight: '3.4kg' }
  };

  // Find the closest week
  const weeks = Object.keys(sizes).map(Number).sort((a, b) => a - b);
  let closestWeek = weeks[0];
  
  for (const w of weeks) {
    if (week >= w) {
      closestWeek = w;
    } else {
      break;
    }
  }

  return sizes[closestWeek];
}

function formatAppointmentTitle(type) {
  const titles = {
    consultation: 'General Consultation',
    checkup: 'Routine Checkup',
    prenatal: 'Prenatal Visit',
    postnatal: 'Postnatal Checkup',
    emergency: 'Emergency Visit',
    follow_up: 'Follow-up Appointment',
    vaccination: 'Vaccination',
    ultrasound: 'Ultrasound Scan',
    lab_test: 'Lab Test',
    other: 'Appointment'
  };

  return titles[type] || 'Appointment';
}

export default router;
