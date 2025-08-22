import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { createPatientAssignmentNotification } from './notifications.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['system_admin', 'doctor', 'nurse', 'ministry_official', 'healthcare_provider', 'patient']).withMessage('Invalid role')
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

    const { firstName, lastName, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'patient', // Default to patient for mobile registrations
      phone
    });

    await user.save();

    // If this is a patient registration, create patient profile and auto-assign doctor
    if (role === 'patient' || !role) {
      try {
        // Create patient profile with all required fields
        const patient = new Patient({
          user: user._id,
          dateOfBirth: new Date('1990-01-01'), // Default date - should be collected from user later
          gender: 'Female', // Default gender - should be collected from user later
          address: 'To be updated', // Default address - should be collected from user later
          facility: 'Harare Central Hospital', // Default facility
          region: 'Harare', // Default region
          emergencyContact: {
            name: 'To be updated',
            relationship: 'spouse',
            phone: '+263771234567'
          },
          currentPregnancy: {
            isPregnant: false,
            riskLevel: 'Low'
          },
          createdBy: user._id,
          isActive: true
        });

        await patient.save();

        // Auto-assign doctor
        const assignedDoctor = await autoAssignDoctor(patient);
        if (assignedDoctor) {
          patient.assignedDoctor = assignedDoctor._id;
          patient.assignmentDate = new Date();
          patient.assignmentReason = 'Automatic assignment on registration';
          patient.assignedBy = user._id; // Self-assigned during registration
          await patient.save();

          // Send notification to assigned doctor
          createPatientAssignmentNotification(assignedDoctor._id, patient);
        }
      } catch (patientError) {
        console.error('Error creating patient profile:', patientError);
        // Don't fail the registration if patient profile creation fails
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      // Log failed login attempt
      try {
        await SecurityEvent.logEvent({
          type: 'login_failure',
          userEmail: email,
          userName: 'Unknown',
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          location: req.headers['cf-ipcountry'] || 'Unknown',
          riskLevel: 'medium',
          details: `Failed login attempt for non-existent or inactive user: ${email}`,
          userAgent: req.headers['user-agent'] || '',
          metadata: { 
            reason: 'user_not_found_or_inactive',
            timestamp: new Date() 
          }
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      try {
        await SecurityEvent.logEvent({
          type: 'login_failure',
          userId: user._id,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          location: req.headers['cf-ipcountry'] || 'Unknown',
          riskLevel: 'high',
          details: `Failed login attempt with incorrect password for user: ${user.email}`,
          userAgent: req.headers['user-agent'] || '',
          metadata: { 
            reason: 'invalid_password',
            timestamp: new Date() 
          }
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    // Log successful login
    try {
      await SecurityEvent.logEvent({
        type: 'login_success',
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        location: req.headers['cf-ipcountry'] || 'Unknown',
        riskLevel: 'low',
        details: `Successful login for user: ${user.email}`,
        userAgent: req.headers['user-agent'] || '',
        metadata: { 
          loginTime: new Date(),
          tokenGenerated: true 
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    // Generate new token for the authenticated user
    const token = generateToken(req.user.id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          avatar: user.avatar,
          phone: user.phone,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
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
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save reset token to user
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Log security event
    try {
      await SecurityEvent.logEvent({
        type: 'password_reset_requested',
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        location: req.headers['cf-ipcountry'] || 'Unknown',
        riskLevel: 'medium',
        details: `Password reset requested for user: ${user.email}`,
        userAgent: req.headers['user-agent'] || '',
        metadata: { 
          resetTokenGenerated: true,
          expiresAt: new Date(resetTokenExpires)
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    // TODO: In production, send email with reset link
    // For now, we'll include the token in response for testing (REMOVE IN PRODUCTION)
    if (process.env.NODE_ENV === 'development') {
      console.log('Reset token:', resetToken);
      console.log('Reset URL would be: /reset-password?token=' + resetToken);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
      // TODO: Remove this in production - only for development/testing
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken: resetToken,
        resetUrl: `/reset-password?token=${resetToken}`
      })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { token, newPassword } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log security event
    try {
      await SecurityEvent.logEvent({
        type: 'password_reset_completed',
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        location: req.headers['cf-ipcountry'] || 'Unknown',
        riskLevel: 'high',
        details: `Password successfully reset for user: ${user.email}`,
        userAgent: req.headers['user-agent'] || '',
        metadata: { 
          passwordChanged: true,
          timestamp: new Date() 
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// Helper function to auto-assign doctor to new patient
async function autoAssignDoctor(patient) {
  try {
    // Find available doctors
    const doctors = await User.find({ 
      role: 'doctor', 
      isActive: true 
    }).select('_id firstName lastName email');

    if (doctors.length === 0) {
      console.log('No doctors available for auto-assignment');
      return null;
    }

    // Get patient counts for each doctor to balance workload
    const doctorWorkloads = await Promise.all(
      doctors.map(async (doctor) => {
        const patientCount = await Patient.countDocuments({ 
          assignedDoctor: doctor._id,
          isActive: true 
        });
        return {
          doctor,
          patientCount
        };
      })
    );

    // Sort by workload (assign to doctor with least patients)
    doctorWorkloads.sort((a, b) => a.patientCount - b.patientCount);

    return doctorWorkloads[0].doctor;

  } catch (error) {
    console.error('Error in auto-assign doctor:', error);
    return null;
  }
}

export default router;
