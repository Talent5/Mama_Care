import express from 'express';
import { check, body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import NotificationSettings from '../models/NotificationSettings.js';
import SystemSettings from '../models/SystemSettings.js';
import Report from '../models/Report.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import speakeasy from 'speakeasy';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Profile Settings
router.get('/profile', auth, async (req, res) => {
  console.log('🔍 Profile endpoint hit by user:', req.user.id);
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('📋 User found:', user ? 'Yes' : 'No');
    
    // Also get patient profile if user is a patient
    let patientProfile = null;
    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ user: req.user.id })
        .populate('assignedDoctor', 'firstName lastName email phone specialization');
      console.log('👥 Patient profile found:', patientProfile ? 'Yes' : 'No');
    }
    
    const responseData = {
      success: true,
      data: {
        ...user.toObject(),
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || '',
        patientProfile
      }
    };
    
    console.log('✅ Sending profile response');
    res.json(responseData);
  } catch (err) {
    console.error('❌ Profile endpoint error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please include a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Phone number is invalid'),
  body('role').optional().isIn(['system_admin', 'doctor', 'nurse', 'ministry_official', 'healthcare_provider', 'patient']).withMessage('Invalid role'),
  body('facility').optional().trim().isLength({ min: 1 }).withMessage('Facility must be a string'),
  body('region').optional().trim().isLength({ min: 1 }).withMessage('Region must be a string'),
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

    const { firstName, lastName, email, phone, role, facility, region } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.user.id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }
    
    // Build profile object
    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (email) profileFields.email = email.toLowerCase();
    if (phone) profileFields.phone = phone;
    if (role && req.user.role === 'system_admin') profileFields.role = role; // Only admin can change roles
    if (facility) profileFields.facility = facility;
    if (region) profileFields.region = region;

    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Profile Photo Upload
router.post('/profile/photo', auth, async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const photo = req.files.photo;
    const user = await User.findById(req.user.id);

    // Validate file type and size
    if (!photo.mimetype.startsWith('image')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image file' 
      });
    }

    if (photo.size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ 
        success: false,
        message: 'Image size should be less than 5MB' 
      });
    }

    // Generate unique filename
    const fileName = `${user._id}-${Date.now()}${path.extname(photo.name)}`;
    
    // Move file to uploads directory
    await photo.mv(`./uploads/profile-photos/${fileName}`);
    
    // Update user profile with photo URL
    user.avatar = `/uploads/profile-photos/${fileName}`;
    await user.save();

    res.json({ 
      success: true,
      message: 'Profile photo updated successfully',
      data: { photoUrl: user.avatar }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Notification Settings
router.get('/notifications', auth, async (req, res) => {
  console.log('🔔 Notifications endpoint hit by user:', req.user.id);
  try {
    let settings = await NotificationSettings.findOne({ user: req.user.id });
    console.log('📱 Notification settings found:', settings ? 'Yes' : 'No');
    
    // Create default settings if none exist
    if (!settings) {
      console.log('🆕 Creating default notification settings');
      settings = new NotificationSettings({
        user: req.user.id,
        emailNotifications: {
          highRiskAlerts: true,
          missedAppointments: true,
          overdueVisits: true,
          dailySummary: false,
          weeklyReports: false
        },
        smsNotifications: {
          emergencyAlerts: true,
          appointmentReminders: true,
          systemMaintenance: false
        }
      });
      await settings.save();
      console.log('✅ Default notification settings created');
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('❌ Notifications endpoint error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.put('/notifications', auth, [
  body('emailNotifications').optional().isObject().withMessage('Email notifications must be an object'),
  body('smsNotifications').optional().isObject().withMessage('SMS notifications must be an object'),
  body('pushNotifications').optional().isObject().withMessage('Push notifications must be an object')
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
      emailNotifications,
      smsNotifications,
      pushNotifications
    } = req.body;

    const notificationFields = {
      user: req.user.id
    };

    if (emailNotifications) {
      notificationFields.emailNotifications = emailNotifications;
    }

    if (smsNotifications) {
      notificationFields.smsNotifications = smsNotifications;
    }

    if (pushNotifications) {
      notificationFields.pushNotifications = pushNotifications;
    }

    let settings = await NotificationSettings.findOne({ user: req.user.id });

    if (settings) {
      settings = await NotificationSettings.findOneAndUpdate(
        { user: req.user.id },
        { $set: notificationFields },
        { new: true }
      );
    } else {
      settings = new NotificationSettings(notificationFields);
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Security Settings
router.put('/security/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Please enter a password with 6 or more characters')
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

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.put('/security/2fa', auth, [
  body('enabled').isBoolean().withMessage('Enabled must be a boolean value')
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

    const { enabled } = req.body;
    
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = enabled;
    
    if (enabled) {
      // Generate and save 2FA secret
      const secret = speakeasy.generateSecret({
        name: `MamaCare - ${user.email}`,
        issuer: 'MamaCare Zimbabwe'
      });
      user.twoFactorSecret = secret.base32;
      
      res.json({ 
        success: true,
        message: '2FA enabled successfully',
        data: { 
          twoFactorEnabled: user.twoFactorEnabled,
          qrCodeUrl: secret.otpauth_url,
          secret: secret.base32
        }
      });
    } else {
      user.twoFactorSecret = null;
      
      res.json({ 
        success: true,
        message: '2FA disabled successfully',
        data: { twoFactorEnabled: user.twoFactorEnabled }
      });
    }
    
    await user.save();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// System Settings
router.get('/system', auth, async (req, res) => {
  console.log('⚙️ System settings endpoint hit by user:', req.user.id);
  try {
    let settings = await SystemSettings.findOne({ user: req.user.id });
    console.log('🖥️ System settings found:', settings ? 'Yes' : 'No');
    
    // Create default settings if none exist
    if (!settings) {
      console.log('🆕 Creating default system settings');
      settings = new SystemSettings({
        user: req.user.id,
        language: 'en',
        timezone: 'Africa/Harare',
        theme: 'light',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '24h'
      });
      await settings.save();
      console.log('✅ Default system settings created');
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('❌ System settings endpoint error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.put('/system', auth, [
  body('language').optional().isIn(['en', 'sn', 'nd']).withMessage('Invalid language'),
  body('timezone').optional().isString().withMessage('Invalid timezone'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme'),
  body('dateFormat').optional().isString().withMessage('Invalid date format'),
  body('timeFormat').optional().isIn(['12h', '24h']).withMessage('Invalid time format')
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

    const { language, timezone, theme, dateFormat, timeFormat } = req.body;

    const systemFields = {
      user: req.user.id
    };

    if (language) systemFields.language = language;
    if (timezone) systemFields.timezone = timezone;
    if (theme) systemFields.theme = theme;
    if (dateFormat) systemFields.dateFormat = dateFormat;
    if (timeFormat) systemFields.timeFormat = timeFormat;

    let settings = await SystemSettings.findOne({ user: req.user.id });

    if (settings) {
      settings = await SystemSettings.findOneAndUpdate(
        { user: req.user.id },
        { $set: systemFields },
        { new: true }
      );
    } else {
      settings = new SystemSettings(systemFields);
      await settings.save();
    }

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Data Export
router.get('/export/patients', auth, async (req, res) => {
  try {
    // Get patient data based on user role
    let patients;
    if (req.user.role === 'patient') {
      // Patients can only export their own data
      patients = await Patient.find({ user: req.user.id })
        .populate('user', 'firstName lastName email phone');
    } else {
      // Healthcare providers can export facility patients
      patients = await Patient.find({ 
        facility: req.user.facility || 'General Hospital' 
      }).populate('user', 'firstName lastName email phone');
    }
    
    // Convert to CSV
    const fields = [
      'user.firstName', 
      'user.lastName', 
      'user.email', 
      'user.phone',
      'dateOfBirth',
      'gender', 
      'address', 
      'facility',
      'region',
      'currentPregnancy.isPregnant',
      'currentPregnancy.riskLevel',
      'createdAt'
    ];
    
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(patients);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patients_export.csv');
    
    res.send(csv);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.get('/export/medical-records', auth, async (req, res) => {
  try {
    let medicalData;
    
    if (req.user.role === 'patient') {
      // Get patient's own medical records
      const patient = await Patient.findOne({ user: req.user.id })
        .populate('user', 'firstName lastName email phone');
        
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }
      
      medicalData = {
        patient: patient,
        records: {
          medicalHistory: patient.medicalHistory || [],
          allergies: patient.allergies || [],
          medications: patient.medications || [],
          vitals: patient.vitals || {},
          currentPregnancy: patient.currentPregnancy || {}
        }
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate PDF report
    const doc = new PDFDocument();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=medical_records.pdf');
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('MamaCare Medical Records', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Patient: ${medicalData.patient.user.firstName} ${medicalData.patient.user.lastName}`);
    doc.text(`Email: ${medicalData.patient.user.email}`);
    doc.text(`Phone: ${medicalData.patient.user.phone || 'N/A'}`);
    doc.text(`Date of Birth: ${medicalData.patient.dateOfBirth?.toDateString() || 'N/A'}`);
    doc.text(`Gender: ${medicalData.patient.gender || 'N/A'}`);
    doc.moveDown();
    
    // Add medical history
    if (medicalData.records.medicalHistory.length > 0) {
      doc.fontSize(16).text('Medical History:');
      medicalData.records.medicalHistory.forEach((history, index) => {
        doc.fontSize(12).text(`${index + 1}. ${history}`);
      });
      doc.moveDown();
    }
    
    // Add allergies
    if (medicalData.records.allergies.length > 0) {
      doc.fontSize(16).text('Allergies:');
      medicalData.records.allergies.forEach((allergy, index) => {
        doc.fontSize(12).text(`${index + 1}. ${allergy}`);
      });
      doc.moveDown();
    }
    
    // Add current pregnancy info
    if (medicalData.records.currentPregnancy.isPregnant) {
      doc.fontSize(16).text('Current Pregnancy:');
      doc.fontSize(12).text(`Week: ${medicalData.records.currentPregnancy.currentWeek || 'N/A'}`);
      doc.text(`Risk Level: ${medicalData.records.currentPregnancy.riskLevel || 'Low'}`);
      doc.text(`Due Date: ${medicalData.records.currentPregnancy.estimatedDueDate?.toDateString() || 'N/A'}`);
      doc.moveDown();
    }
    
    doc.fontSize(10).text(`Report generated on: ${new Date().toDateString()}`, { align: 'center' });
    
    doc.end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Account deletion
router.delete('/account', auth, [
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required'),
  body('confirmText').equals('DELETE MY ACCOUNT').withMessage('Please type "DELETE MY ACCOUNT" to confirm')
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

    const { confirmPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(confirmPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete user and related data
    await User.findByIdAndUpdate(req.user.id, { 
      isActive: false,
      deletedAt: new Date()
    });
    
    // Soft delete patient profile if exists
    await Patient.findOneAndUpdate(
      { user: req.user.id },
      { 
        isActive: false,
        deletedAt: new Date()
      }
    );
    
    // Delete settings
    await NotificationSettings.findOneAndDelete({ user: req.user.id });
    await SystemSettings.findOneAndDelete({ user: req.user.id });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

export default router; 