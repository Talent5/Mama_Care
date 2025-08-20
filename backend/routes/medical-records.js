import express from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { auth, roleAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create medical record
router.post('/', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider')], async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      visitType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      treatment,
      followUp,
      pregnancyDetails,
      labResults
    } = req.body;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const medicalRecord = new MedicalRecord({
      patient: patientId,
      appointment: appointmentId,
      provider: req.user.id,
      visitType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      treatment,
      followUp,
      pregnancyDetails,
      labResults,
      status: 'completed'
    });

    await medicalRecord.save();

    // Update appointment status to completed
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'completed',
      diagnosis: diagnosis?.primary,
      treatment: treatment?.medications?.map(med => med.name).join(', '),
      followUpRequired: followUp?.required || false,
      followUpDate: followUp?.scheduledDate
    });

    // Update patient's last visit
    await Patient.findByIdAndUpdate(patientId, {
      lastVisit: new Date(),
      'vitals.bloodPressure': physicalExamination?.vitals?.bloodPressure,
      'vitals.temperature': physicalExamination?.vitals?.temperature,
      'vitals.weight': physicalExamination?.vitals?.weight,
      'vitals.height': physicalExamination?.vitals?.height,
      'vitals.bmi': physicalExamination?.vitals?.bmi
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create medical record'
    });
  }
});

// Get medical record by ID
router.get('/:id', [auth], async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if user has permission to view this record
    const isProvider = medicalRecord.provider._id.toString() === req.user.id;
    const isPatient = medicalRecord.patient.user.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isProvider && !isPatient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical record'
    });
  }
});

// Get patient medical history
router.get('/patient/:patientId', [auth], async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, visitType, dateFrom, dateTo } = req.query;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions
    const isPatient = patient.user.toString() === req.user.id;
    const isAssignedDoctor = patient.assignedDoctor?.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isPatient && !isAssignedDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = { patient: patientId, isActive: true };
    
    if (visitType) {
      query.visitType = visitType;
    }
    
    if (dateFrom || dateTo) {
      query.visitDate = {};
      if (dateFrom) query.visitDate.$gte = new Date(dateFrom);
      if (dateTo) query.visitDate.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MedicalRecord.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical history'
    });
  }
});

// Update medical record
router.put('/:id', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider')], async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if user is the provider who created the record or admin
    const isProvider = medicalRecord.provider._id.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: 'amended' },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update medical record'
    });
  }
});

// Get medical records by provider
router.get('/provider/:providerId', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin')], async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, visitType, dateFrom, dateTo } = req.query;

    // Check permissions
    const isOwnRecords = providerId === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isOwnRecords && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = { provider: providerId, isActive: true };
    
    if (visitType) {
      query.visitType = visitType;
    }
    
    if (dateFrom || dateTo) {
      query.visitDate = {};
      if (dateFrom) query.visitDate.$gte = new Date(dateFrom);
      if (dateTo) query.visitDate.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MedicalRecord.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching provider medical records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical records'
    });
  }
});

// Search medical records
router.get('/search/:query', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin')], async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const searchQuery = {
      $and: [
        { isActive: true },
        {
          $or: [
            { 'diagnosis.primary': { $regex: query, $options: 'i' } },
            { 'diagnosis.secondary': { $regex: query, $options: 'i' } },
            { chiefComplaint: { $regex: query, $options: 'i' } },
            { 'treatment.medications.name': { $regex: query, $options: 'i' } }
          ]
        }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [records, total] = await Promise.all([
      MedicalRecord.find(searchQuery)
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MedicalRecord.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching medical records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search medical records'
    });
  }
});

// Add attachment to medical record
router.post('/:id/attachments', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider')], async (req, res) => {
  try {
    const { type, filename, originalName, url, description } = req.body;

    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const attachment = {
      type,
      filename,
      originalName,
      url,
      description,
      uploadedBy: req.user.id,
      uploadDate: new Date()
    };

    medicalRecord.attachments.push(attachment);
    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add attachment'
    });
  }
});

// Get medical record statistics
router.get('/stats/dashboard', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin')], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.visitDate = {};
      if (dateFrom) dateFilter.visitDate.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.visitDate.$lte = new Date(dateTo);
    }

    const providerFilter = req.user.role === 'doctor' || req.user.role === 'nurse' || req.user.role === 'healthcare_provider'
      ? { provider: req.user.id, ...dateFilter }
      : dateFilter;

    const [
      totalRecords,
      recordsByType,
      recentRecords,
      commonDiagnoses
    ] = await Promise.all([
      MedicalRecord.countDocuments({ ...providerFilter, isActive: true }),
      
      MedicalRecord.aggregate([
        { $match: { ...providerFilter, isActive: true } },
        { $group: { _id: '$visitType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      MedicalRecord.find({ ...providerFilter, isActive: true })
        .sort({ visitDate: -1 })
        .limit(5)
        .select('patient visitDate visitType diagnosis.primary'),
      
      MedicalRecord.aggregate([
        { $match: { ...providerFilter, isActive: true } },
        { $group: { _id: '$diagnosis.primary', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        recordsByType,
        recentRecords,
        commonDiagnoses
      }
    });
  } catch (error) {
    console.error('Error fetching medical record statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

export default router;
