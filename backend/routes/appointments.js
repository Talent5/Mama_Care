import express from 'express';
import { body, validationResult, param } from 'express-validator';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/appointments/pending
// @desc    Get pending appointments for doctor
// @access  Private - Doctor only
router.get('/pending', [
  auth,
  roleAuth('healthcare_provider', 'doctor', 'nurse')
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find({
      healthcareProvider: req.user.id,
      status: 'pending',
      isActive: true
    })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('healthcareProvider', 'firstName lastName')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments({
      healthcareProvider: req.user.id,
      status: 'pending',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get pending appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { 
      date, 
      status, 
      type, 
      priority, 
      patientId, 
      providerId,
      upcoming,
      search 
    } = req.query;
    
    // Build query based on user role
    let query = { isActive: true };
    
    if (req.user.role === 'patient') {
      // Patients can only see their own appointments
      const patient = await Patient.findOne({ user: req.user.id });
      if (patient) {
        query.patient = patient._id;
      } else {
        return res.json({
          success: true,
          data: { appointments: [], pagination: { current: 1, pages: 0, total: 0, limit } }
        });
      }
    } else if (['healthcare_provider', 'doctor', 'nurse'].includes(req.user.role)) {
      // Healthcare providers can see appointments they're assigned to
      query.healthcareProvider = req.user.id;
    }
    // Admins can see all appointments (no additional filters)

    // Apply filters
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = {
        $gte: searchDate,
        $lt: nextDay
      };
    }
    
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;
    if (providerId) query.healthcareProvider = providerId;

    let appointments;
    if (search) {
      // For search, we need to populate first then filter
      appointments = await Appointment.find(query)
        .populate({
          path: 'patient',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        })
        .populate('healthcareProvider', 'firstName lastName')
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .skip(skip)
        .limit(limit);
      
      // Filter by search term
      if (search) {
        appointments = appointments.filter(appointment => {
          const patientName = appointment.patient?.user ? 
            `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`.toLowerCase() : '';
          const providerName = appointment.healthcareProvider ? 
            `${appointment.healthcareProvider.firstName} ${appointment.healthcareProvider.lastName}`.toLowerCase() : '';
          const reason = appointment.reason?.toLowerCase() || '';
          
          const searchTerm = search.toLowerCase();
          return patientName.includes(searchTerm) || 
                 providerName.includes(searchTerm) || 
                 reason.includes(searchTerm);
        });
      }
    } else {
      appointments = await Appointment.find(query)
        .populate({
          path: 'patient',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        })
        .populate('healthcareProvider', 'firstName lastName')
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .skip(skip)
        .limit(limit);
    }

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid appointment ID')
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

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (['healthcare_provider', 'doctor', 'nurse'].includes(req.user.role)) {
      const appointmentProviderId = appointment.healthcareProvider?._id?.toString() || appointment.healthcareProvider?.toString();
      if (appointmentProviderId !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private - All authenticated users can create appointments (patients for themselves, providers for any patient)
router.post('/', [
  auth, // Remove roleAuth to allow patients to book appointments
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('healthcareProviderId').isMongoId().withMessage('Invalid healthcare provider ID'),
  body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time'),
  body('type').isIn(['consultation', 'checkup', 'prenatal', 'postnatal', 'emergency', 'follow_up', 'vaccination', 'ultrasound', 'lab_test', 'other']).withMessage('Invalid appointment type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('reason').notEmpty().isLength({ max: 500 }).withMessage('Reason is required and cannot exceed 500 characters'),
  body('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15-180 minutes')
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

    const {
      patientId,
      healthcareProviderId,
      appointmentDate,
      appointmentTime,
      type,
      priority,
      reason,
      duration,
      notes,
      symptoms
    } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify healthcare provider exists
    const provider = await User.findById(healthcareProviderId);
    if (!provider || !['healthcare_provider', 'doctor', 'nurse'].includes(provider.role)) {
      return res.status(404).json({
        success: false,
        message: 'Healthcare provider not found'
      });
    }

    // Check if patient can book for themselves
    if (req.user.role === 'patient') {
      const userPatient = await Patient.findOne({ user: req.user.id });
      if (!userPatient || userPatient._id.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'You can only book appointments for yourself'
        });
      }
    }

    // Check for scheduling conflicts
    const appointmentDateTime = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const appointmentDuration = duration || 30;
    const endDateTime = new Date(appointmentDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + appointmentDuration);

    const conflictingAppointment = await Appointment.findOne({
      healthcareProvider: healthcareProviderId,
      appointmentDate: new Date(appointmentDate),
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
      isActive: true,
      $expr: {
        $or: [
          // New appointment starts during existing appointment
          {
            $and: [
              { $lte: ['$appointmentTime', appointmentTime] },
              { $gt: [{ $dateAdd: { startDate: { $dateFromString: { dateString: { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } }, "T", "$appointmentTime"] } } }, unit: "minute", amount: { $ifNull: ["$duration", 30] } } }, appointmentDateTime] }
            ]
          },
          // New appointment ends during existing appointment
          {
            $and: [
              { $lt: ['$appointmentTime', appointmentTime] },
              { $gte: [{ $dateAdd: { startDate: { $dateFromString: { dateString: { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } }, "T", "$appointmentTime"] } } }, unit: "minute", amount: { $ifNull: ["$duration", 30] } } }, endDateTime] }
            ]
          },
          // Existing appointment is within new appointment
          {
            $and: [
              { $gte: ['$appointmentTime', appointmentTime] },
              { $lte: [{ $dateAdd: { startDate: { $dateFromString: { dateString: { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } }, "T", "$appointmentTime"] } } }, unit: "minute", amount: { $ifNull: ["$duration", 30] } } }, endDateTime] }
            ]
          }
        ]
      }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked. Please choose a different time.'
      });
    }

    // Create appointment with pending status for doctor approval
    const appointment = new Appointment({
      patient: patientId,
      healthcareProvider: healthcareProviderId,
      appointmentDate,
      appointmentTime,
      type,
      priority: priority || 'medium',
      reason,
      duration: appointmentDuration,
      notes,
      symptoms,
      status: 'pending' // Requires doctor approval
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private - Patients can update their own appointments, providers can update any
router.put('/:id', [
  auth, // Remove roleAuth to allow patients to update their appointments
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('appointmentDate').optional().isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  body('type').optional().isIn(['consultation', 'checkup', 'prenatal', 'postnatal', 'emergency', 'follow_up', 'vaccination', 'ultrasound', 'lab_test', 'other']).withMessage('Invalid appointment type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
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

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Patients can only update limited fields
      const allowedFields = ['notes', 'symptoms'];
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: { appointment: updatedAppointment }
      });
    }

    // Healthcare providers and admins can update more fields
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel/delete appointment
// @access  Private - Patients can cancel their own appointments, providers can cancel any
router.delete('/:id', [
  auth, // Remove roleAuth to allow patients to cancel their appointments
  param('id').isMongoId().withMessage('Invalid appointment ID')
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

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions - patients can only cancel their own appointments
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own appointments'
        });
      }
    }

    // Update status to cancelled instead of hard delete
    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled', isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment: cancelledAppointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/appointments/:id/approve
// @desc    Approve appointment with optional time changes
// @access  Private - Doctor only
router.post('/:id/approve', [
  auth,
  roleAuth('healthcare_provider', 'doctor', 'nurse'),
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('appointmentDate').optional().isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time'),
  body('doctorNotes').optional().isLength({ max: 1000 }).withMessage('Doctor notes cannot exceed 1000 characters')
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
    const { appointmentDate, appointmentTime, doctorNotes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Debug logging
    console.log('=== APPOINTMENT APPROVAL DEBUG ===');
    console.log('Appointment ID:', id);
    console.log('Appointment healthcare provider ID:', appointment.healthcareProvider?._id?.toString());
    console.log('Logged-in user ID:', req.user.id?.toString());
    console.log('Logged-in user role:', req.user.role);
    console.log('IDs match:', appointment.healthcareProvider?._id?.toString() === req.user.id?.toString());
    console.log('===================================');

    // Check if doctor is assigned to this appointment (compare as strings)
    const appointmentProviderId = appointment.healthcareProvider?._id?.toString() || appointment.healthcareProvider?.toString();
    if (appointmentProviderId !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve appointments assigned to you'
      });
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be approved'
      });
    }

    // Update appointment details
    const updateData = {
      status: 'scheduled',
      approvedBy: req.user.id,
      approvedAt: new Date()
    };

    // If doctor proposes new date/time
    if (appointmentDate && appointmentTime) {
      // Check for scheduling conflicts with the new time
      const conflictingAppointment = await Appointment.findOne({
        healthcareProvider: req.user.id,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        isActive: true,
        _id: { $ne: id }
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Proposed time slot conflicts with another appointment'
        });
      }

      updateData.appointmentDate = new Date(appointmentDate);
      updateData.appointmentTime = appointmentTime;
    }

    if (doctorNotes) {
      updateData.doctorNotes = doctorNotes;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Appointment approved successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Approve appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/appointments/:id/reject
// @desc    Reject appointment
// @access  Private - Doctor only
router.post('/:id/reject', [
  auth,
  roleAuth('healthcare_provider', 'doctor', 'nurse'),
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('rejectionReason').notEmpty().isLength({ max: 500 }).withMessage('Rejection reason is required and cannot exceed 500 characters')
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
    const { rejectionReason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if doctor is assigned to this appointment (compare as strings)
    const appointmentProviderId = appointment.healthcareProvider?._id?.toString() || appointment.healthcareProvider?.toString();
    if (appointmentProviderId !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject appointments assigned to you'
      });
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be rejected'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Appointment rejected',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
