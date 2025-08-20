import express from 'express';
import { body, validationResult, param } from 'express-validator';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import os from 'os';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users with enhanced admin data
// @access  Private (System Admin)
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { role, search, status } = req.query;
    
    // Build query
    let query = {};
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') {
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
      // Add more status filters as needed
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enhance users with admin-specific data
    const enhancedUsers = users.map(user => ({
      ...user.toObject(),
      name: `${user.firstName} ${user.lastName}`,
      status: user.isActive ? 'active' : 'inactive',
      loginCount: Math.floor(Math.random() * 1000) + 50, // Mock data - implement real tracking
      lastLoginIP: '192.168.1.' + Math.floor(Math.random() * 255),
      failedLoginAttempts: Math.floor(Math.random() * 3),
      twoFactorEnabled: Math.random() > 0.5
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: enhancedUsers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (Admin interface)
// @access  Private (System Admin)
router.post('/users', [
  auth,
  adminAuth,
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['system_admin', 'doctor', 'nurse', 'ministry_official']).withMessage('Invalid role'),
  body('facility').optional().trim(),
  body('region').optional().trim(),
  body('department').optional().trim(),
  body('specialization').optional().trim()
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

    const { firstName, lastName, email, password, role, facility, region, department, specialization } = req.body;

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
    userResponse.name = `${firstName} ${lastName}`;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (Admin interface)
// @access  Private (System Admin)
router.put('/users/:id', [
  auth,
  adminAuth,
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('role').optional().isIn(['system_admin', 'doctor', 'nurse', 'ministry_official']).withMessage('Invalid role'),
  body('facility').optional().trim(),
  body('region').optional().trim(),
  body('department').optional().trim(),
  body('specialization').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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
    const updateData = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    );

    // Add computed fields
    const userResponse = updatedUser.toObject();
    userResponse.name = `${updatedUser.firstName} ${updatedUser.lastName}`;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (Admin interface)
// @access  Private (System Admin)
router.delete('/users/:id', [
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

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (System Admin)
router.patch('/users/:id/toggle-status', [
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

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Toggle status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: !user.isActive },
      { new: true, select: '-password' }
    );

    // Add computed fields
    const userResponse = updatedUser.toObject();
    userResponse.name = `${updatedUser.firstName} ${updatedUser.lastName}`;

    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details (Admin interface)
// @access  Private (System Admin)
router.get('/users/:id', [
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

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add computed fields and mock admin data
    const userResponse = {
      ...user.toObject(),
      name: `${user.firstName} ${user.lastName}`,
      status: user.isActive ? 'active' : 'inactive',
      loginCount: Math.floor(Math.random() * 1000) + 50,
      lastLoginIP: '192.168.1.' + Math.floor(Math.random() * 255),
      failedLoginAttempts: Math.floor(Math.random() * 3),
      twoFactorEnabled: Math.random() > 0.5
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/metrics
// @desc    Get detailed system metrics for status monitoring
// @access  Private (System Admin)
router.get('/system/metrics', [auth, adminAuth], async (req, res) => {
  try {
    // Get system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);
    
    // Get CPU load averages
    const loadAvg = os.loadavg();
    const cpuUsage = Math.round(loadAvg[0] * 20); // Approximate CPU usage
    
    // Mock disk usage - in production, use actual disk monitoring
    const diskUsage = Math.floor(Math.random() * 30 + 60);
    
    // Get database connection count
    const dbConnections = mongoose.connections.length > 0 ? 
      Math.floor(Math.random() * 30 + 15) : 0;

    const metrics = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'healthy',
        value: cpuUsage,
        unit: '%',
        description: 'Current CPU utilization',
        lastUpdated: new Date()
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        status: memoryUsage > 85 ? 'critical' : memoryUsage > 70 ? 'warning' : 'healthy',
        value: memoryUsage,
        unit: '%',
        description: 'Current memory utilization',
        lastUpdated: new Date()
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        status: diskUsage > 90 ? 'critical' : diskUsage > 75 ? 'warning' : 'healthy',
        value: diskUsage,
        unit: '%',
        description: 'Current disk space utilization',
        lastUpdated: new Date()
      },
      {
        id: 'connections',
        name: 'Active Connections',
        status: dbConnections > 80 ? 'warning' : 'healthy',
        value: dbConnections,
        description: 'Current active database connections',
        lastUpdated: new Date()
      }
    ];

    res.json(metrics);
  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/services
// @desc    Get service status information
// @access  Private (System Admin)
router.get('/system/services', [auth, adminAuth], async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'online' : 'offline';
    const dbResponseTime = dbStatus === 'online' ? Math.floor(Math.random() * 50 + 10) : 0;
    
    // Mock service statuses - in production, implement actual service health checks
    const services = [
      {
        id: 'api',
        name: 'API Server',
        status: 'online',
        uptime: '99.9%',
        responseTime: Math.floor(Math.random() * 200 + 50),
        lastCheck: new Date(),
        endpoint: '/api/health'
      },
      {
        id: 'database',
        name: 'Database',
        status: dbStatus,
        uptime: dbStatus === 'online' ? '99.8%' : '0%',
        responseTime: dbResponseTime,
        lastCheck: new Date()
      },
      {
        id: 'email',
        name: 'Email Service',
        status: Math.random() > 0.1 ? 'online' : 'degraded',
        uptime: '98.7%',
        responseTime: Math.floor(Math.random() * 1000 + 500),
        lastCheck: new Date()
      },
      {
        id: 'storage',
        name: 'File Storage',
        status: Math.random() > 0.2 ? 'online' : 'degraded',
        uptime: '97.2%',
        responseTime: Math.floor(Math.random() * 1500 + 800),
        lastCheck: new Date()
      },
      {
        id: 'notifications',
        name: 'Push Notifications',
        status: 'online',
        uptime: '99.5%',
        responseTime: Math.floor(Math.random() * 300 + 100),
        lastCheck: new Date()
      }
    ];

    res.json(services);
  } catch (error) {
    console.error('Get services status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/status
// @desc    Get system status and metrics
// @access  Private (System Admin)
router.get('/system/status', [auth, adminAuth], async (req, res) => {
  try {
    // Get system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get system uptime
    const systemUptime = os.uptime();
    const uptimeHours = Math.floor(systemUptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    
    // Mock some metrics - in production, integrate with actual monitoring
    const systemStatus = {
      overall: 'healthy',
      uptime: `${Math.floor(Math.random() * 2 + 98)}.${Math.floor(Math.random() * 10)}%`,
      totalUsers,
      activeUsers,
      systemLoad: Math.floor(Math.random() * 30 + 50), // Mock CPU load
      memoryUsage: parseFloat(memoryUsage),
      diskUsage: Math.floor(Math.random() * 20 + 60), // Mock disk usage
      networkLatency: Math.floor(Math.random() * 10 + 8), // Mock network latency
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/servers
// @desc    Get server information
// @access  Private (System Admin)
router.get('/system/servers', [auth, adminAuth], async (req, res) => {
  try {
    // Mock server data - in production, integrate with actual server monitoring
    const servers = [
      {
        id: 'web-01',
        name: 'Web Server 01',
        status: 'healthy',
        cpu: Math.floor(Math.random() * 30 + 15),
        memory: Math.floor(Math.random() * 40 + 50),
        disk: Math.floor(Math.random() * 30 + 30),
        uptime: '15 days',
        location: 'Harare DC',
        lastCheck: '2 mins ago',
        ipAddress: '192.168.1.10',
        os: 'Ubuntu 22.04',
        version: 'v1.0.0'
      },
      {
        id: 'db-01',
        name: 'Database Primary',
        status: Math.random() > 0.8 ? 'warning' : 'healthy',
        cpu: Math.floor(Math.random() * 20 + 70),
        memory: Math.floor(Math.random() * 20 + 75),
        disk: Math.floor(Math.random() * 15 + 80),
        uptime: '28 days',
        location: 'Harare DC',
        lastCheck: '1 min ago',
        ipAddress: '192.168.1.11',
        os: 'Ubuntu 22.04',
        version: 'MongoDB 6.0.3'
      },
      {
        id: 'api-01',
        name: 'API Gateway',
        status: 'healthy',
        cpu: Math.floor(Math.random() * 20 + 25),
        memory: Math.floor(Math.random() * 30 + 35),
        disk: Math.floor(Math.random() * 20 + 25),
        uptime: '12 days',
        location: 'Bulawayo DC',
        lastCheck: '3 mins ago',
        ipAddress: '192.168.2.10',
        os: 'Ubuntu 22.04',
        version: 'Node.js 18.x'
      }
    ];

    res.json({
      success: true,
      data: servers
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/database
// @desc    Get database information
// @access  Private (System Admin)
router.get('/system/database', [auth, adminAuth], async (req, res) => {
  try {
    const dbStats = await mongoose.connection.db.stats();
    
    const databaseInfo = {
      type: 'MongoDB',
      version: '6.0.3',
      size: `${(dbStats.dataSize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      connections: mongoose.connection.readyState === 1 ? Math.floor(Math.random() * 30 + 15) : 0,
      maxConnections: 100,
      queriesPerSecond: Math.floor(Math.random() * 500 + 1000),
      slowQueries: Math.floor(Math.random() * 5),
      indexEfficiency: `${Math.floor(Math.random() * 5 + 95)}.${Math.floor(Math.random() * 10)}%`,
      replicationLag: `0.0${Math.floor(Math.random() * 9 + 1)}s`,
      lastOptimized: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    };

    res.json({
      success: true,
      data: databaseInfo
    });
  } catch (error) {
    console.error('Get database info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/system/backups
// @desc    Get backup information
// @access  Private (System Admin)
router.get('/system/backups', [auth, adminAuth], async (req, res) => {
  try {
    // Mock backup data - in production, integrate with actual backup system
    const backups = [
      {
        id: 1,
        type: 'full',
        size: '2.1 GB',
        status: 'completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: '45 mins',
        retention: '30 days',
        location: 's3://backups/mamacare/',
        checksum: 'sha256:abc123def456'
      },
      {
        id: 2,
        type: 'incremental',
        size: '156 MB',
        status: 'completed',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        duration: '8 mins',
        retention: '7 days',
        location: 's3://backups/mamacare/',
        checksum: 'sha256:def456ghi789'
      },
      {
        id: 3,
        type: 'incremental',
        size: '98 MB',
        status: Math.random() > 0.5 ? 'completed' : 'running',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: '3 mins',
        retention: '7 days',
        location: 's3://backups/mamacare/',
        checksum: 'sha256:ghi789jkl012'
      }
    ];

    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/system/backups/create
// @desc    Create a new backup
// @access  Private (System Admin)
router.post('/system/backups/create', [
  auth,
  adminAuth,
  body('type').isIn(['full', 'incremental']).withMessage('Invalid backup type')
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

    // In production, this would trigger actual backup process
    console.log(`Creating ${type} backup initiated by user ${req.user.id}`);
    
    // Simulate backup creation
    setTimeout(() => {
      console.log(`${type} backup completed`);
    }, 5000);

    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} backup initiated successfully`
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/system/backups/:id/restore
// @desc    Restore from a backup
// @access  Private (System Admin)
router.post('/system/backups/:id/restore', [
  auth,
  adminAuth,
  param('id').isNumeric().withMessage('Invalid backup ID')
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

    // In production, this would trigger actual restore process
    console.log(`Backup restoration from backup ${id} initiated by user ${req.user.id}`);
    
    // Simulate restore process
    setTimeout(() => {
      console.log(`Backup ${id} restoration completed`);
    }, 10000);

    res.json({
      success: true,
      message: 'Backup restoration initiated successfully'
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/system/database/optimize
// @desc    Optimize database
// @access  Private (System Admin)
router.post('/system/database/optimize', [auth, adminAuth], async (req, res) => {
  try {
    // In production, this would trigger actual database optimization
    console.log(`Database optimization initiated by user ${req.user.id}`);
    
    // Simulate optimization process
    setTimeout(() => {
      console.log('Database optimization completed');
    }, 30000);

    res.json({
      success: true,
      message: 'Database optimization initiated successfully'
    });
  } catch (error) {
    console.error('Optimize database error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private (System Admin)
router.get('/dashboard/stats', [auth, adminAuth], async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get system uptime and metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);

    const systemUptime = os.uptime();
    const uptimeHours = Math.floor(systemUptime / 3600);
    
    // Mock some additional metrics for demo
    const dashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
        byRole: usersByRole.reduce((acc, role) => {
          acc[role._id] = role.count;
          return acc;
        }, {})
      },
      system: {
        uptime: `${Math.floor(Math.random() * 2 + 98)}.${Math.floor(Math.random() * 10)}%`,
        uptimeHours,
        memoryUsage: parseFloat(memoryUsage),
        cpuUsage: Math.floor(Math.random() * 30 + 50),
        diskUsage: Math.floor(Math.random() * 20 + 60),
        networkLatency: Math.floor(Math.random() * 10 + 8),
        errorRate: (Math.random() * 2).toFixed(2) + '%'
      },
      activity: {
        apiCalls: Math.floor(Math.random() * 10000 + 50000),
        apiCallsChange: '+' + Math.floor(Math.random() * 20 + 5) + '%',
        errorRateChange: '-' + Math.floor(Math.random() * 50 + 10) + '%',
        uptimeChange: '+' + Math.floor(Math.random() * 10 + 1) + '%'
      },
      alerts: [
        {
          id: 1,
          type: 'warning',
          severity: 'medium',
          message: 'High CPU usage detected on server',
          timestamp: new Date(Date.now() - Math.random() * 3600000)
        },
        {
          id: 2,
          type: 'info',
          severity: 'low',
          message: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - Math.random() * 7200000)
        },
        {
          id: 3,
          type: 'error',
          severity: 'high',
          message: 'Failed login attempts detected',
          timestamp: new Date(Date.now() - Math.random() * 1800000)
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
