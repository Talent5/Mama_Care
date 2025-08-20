import express from 'express';
import { body, validationResult, param } from 'express-validator';
import User from '../models/User.js';
import { auth, adminAuth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin, doctors, and nurses)
// @access  Private (Admin, Doctor, Nurse)
router.get('/', [auth, roleAuth('system_admin', 'doctor', 'nurse')], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, search, isActive } = req.query;
    
    // Build query
    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/doctors
// @desc    Get all doctors for appointment booking
// @access  Private
router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await User.find({
      role: { $in: ['doctor', 'healthcare_provider'] },
      isActive: true
    })
      .select('firstName lastName specialization role facility region department')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid user ID')
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

    // Check if user can access this profile
    if (req.user.role !== 'system_admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
  body('role').optional().isIn(['system_admin', 'doctor', 'nurse', 'ministry_official', 'healthcare_provider']).withMessage('Invalid role')
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
    const { firstName, lastName, email, phone, role, isActive } = req.body;

    // Check if user can update this profile
    if (req.user.role !== 'system_admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only system admins can change role and isActive status
    if (req.user.role !== 'system_admin' && (role || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. System admin privileges required to change role or status'
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role && req.user.role === 'system_admin') updateData.role = role;
    if (isActive !== undefined && req.user.role === 'system_admin') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [
  auth,
  adminAuth,
  param('id').isMongoId().withMessage('Invalid user ID')
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

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics
// @access  Private (Admin, Doctor, Nurse)
router.get('/stats/overview', [auth, roleAuth('system_admin', 'doctor', 'nurse')], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const systemAdminCount = await User.countDocuments({ role: 'system_admin', isActive: true });
    const doctorCount = await User.countDocuments({ role: 'doctor', isActive: true });
    const nurseCount = await User.countDocuments({ role: 'nurse', isActive: true });
    const ministryCount = await User.countDocuments({ role: 'ministry_official', isActive: true });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        usersByRole: {
          system_admin: systemAdminCount,
          doctor: doctorCount,
          nurse: nurseCount,
          ministry_official: ministryCount
        },
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['system_admin', 'doctor', 'nurse', 'ministry_official', 'healthcare_provider']).withMessage('Invalid role'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
  body('facility').optional().trim().isLength({ max: 100 }).withMessage('Facility name cannot exceed 100 characters'),
  body('region').optional().trim().isLength({ max: 100 }).withMessage('Region name cannot exceed 100 characters'),
  body('department').optional().trim().isLength({ max: 100 }).withMessage('Department name cannot exceed 100 characters'),
  body('specialization').optional().trim().isLength({ max: 100 }).withMessage('Specialization cannot exceed 100 characters')
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

    const { firstName, lastName, email, password, role, phone, facility, region, department, specialization } = req.body;

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
      role,
      phone,
      facility,
      region,
      department,
      specialization,
      isActive: true,
      createdBy: req.user.id
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Toggle user status (Admin only)
// @access  Private (Admin)
router.patch('/:id/status', [
  auth,
  adminAuth,
  param('id').isMongoId().withMessage('Invalid user ID')
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

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account status'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
