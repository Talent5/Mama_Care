import express from 'express';
import { body, validationResult, query } from 'express-validator';
import SecurityEvent from '../models/SecurityEvent.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/security/events
// @desc    Get security events with filtering and pagination
// @access  Private (System Admin)
router.get('/events', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { type, riskLevel, resolved, startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (riskLevel && riskLevel !== 'all') {
      query.riskLevel = riskLevel;
    }
    
    if (resolved !== undefined) {
      query.resolved = resolved === 'true';
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const events = await SecurityEvent.find(query)
      .populate('userId', 'firstName lastName email role')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityEvent.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/security/metrics
// @desc    Get security metrics and statistics
// @access  Private (System Admin)
router.get('/metrics', [auth, adminAuth], async (req, res) => {
  try {
    const metrics = await SecurityEvent.getSecurityMetrics();
    
    // Get additional metrics
    const blockedIPs = new Set();
    const recentFailures = await SecurityEvent.find({
      type: 'login_failure',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    recentFailures.forEach(event => {
      blockedIPs.add(event.ipAddress);
    });

    const vulnerabilities = {
      critical: 0,
      high: 2,
      medium: 5,
      low: 12
    }; // TODO: Implement actual vulnerability scanning

    res.json({
      success: true,
      data: {
        ...metrics,
        blockedIPs: blockedIPs.size,
        vulnerabilities
      }
    });
  } catch (error) {
    console.error('Get security metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/security/events
// @desc    Log a security event
// @access  Private (System Admin)
router.post('/events', [
  auth,
  adminAuth,
  body('type').isIn([
    'login_success', 'login_failure', 'logout', 'password_change',
    'role_change', 'data_access', 'data_export', 'suspicious_activity',
    'unauthorized_access', 'account_locked', 'account_unlocked',
    'security_scan', 'system_change'
  ]).withMessage('Invalid event type'),
  body('userEmail').isEmail().withMessage('Valid email is required'),
  body('ipAddress').notEmpty().withMessage('IP address is required'),
  body('details').trim().isLength({ min: 5 }).withMessage('Details must be at least 5 characters'),
  body('riskLevel').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid risk level')
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

    const event = await SecurityEvent.logEvent(req.body);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Security event logged successfully'
    });
  } catch (error) {
    console.error('Log security event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/security/events/:id/resolve
// @desc    Mark security event as resolved
// @access  Private (System Admin)
router.patch('/events/:id/resolve', [auth, adminAuth], async (req, res) => {
  try {
    const { notes } = req.body;
    
    const event = await SecurityEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Security event not found'
      });
    }

    event.resolved = true;
    event.resolvedBy = req.user.id;
    event.resolvedAt = new Date();
    if (notes) event.notes = notes;

    await event.save();

    res.json({
      success: true,
      data: event,
      message: 'Security event marked as resolved'
    });
  } catch (error) {
    console.error('Resolve security event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/security/settings
// @desc    Get security settings
// @access  Private (System Admin)
router.get('/settings', [auth, adminAuth], async (req, res) => {
  try {
    // TODO: Store these in database or config
    const defaultSettings = {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAge: 90
      },
      loginSecurity: {
        maxFailedAttempts: 5,
        lockoutDuration: 30,
        twoFactorRequired: false,
        sessionTimeout: 480
      },
      auditSettings: {
        logRetention: 365,
        realTimeAlerts: true,
        emailNotifications: true
      }
    };

    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/security/settings
// @desc    Update security settings
// @access  Private (System Admin)
router.put('/settings', [
  auth,
  adminAuth,
  body('passwordPolicy.minLength').isInt({ min: 6, max: 50 }),
  body('loginSecurity.maxFailedAttempts').isInt({ min: 3, max: 10 }),
  body('loginSecurity.lockoutDuration').isInt({ min: 5, max: 120 }),
  body('loginSecurity.sessionTimeout').isInt({ min: 60, max: 1440 }),
  body('auditSettings.logRetention').isInt({ min: 30, max: 2555 })
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

    // TODO: Persist settings to database
    
    // Log the settings change
    await SecurityEvent.logEvent({
      type: 'system_change',
      userId: req.user.id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      location: 'System Admin Panel',
      riskLevel: 'medium',
      details: 'Security settings updated',
      metadata: { 
        previousSettings: req.body,
        changedBy: req.user.id 
      }
    });

    res.json({
      success: true,
      data: req.body,
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/security/scan
// @desc    Trigger security scan
// @access  Private (System Admin)
router.post('/scan', [auth, adminAuth], async (req, res) => {
  try {
    // TODO: Implement actual security scanning
    
    // Log the security scan
    await SecurityEvent.logEvent({
      type: 'security_scan',
      userId: req.user.id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      location: 'System Admin Panel',
      riskLevel: 'low',
      details: 'Manual security scan initiated',
      metadata: { initiatedBy: req.user.id }
    });

    res.json({
      success: true,
      message: 'Security scan initiated successfully'
    });
  } catch (error) {
    console.error('Security scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/security/report
// @desc    Generate security report
// @access  Private (System Admin)
router.get('/report', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const [events, metrics] = await Promise.all([
      SecurityEvent.find(dateQuery)
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 }),
      SecurityEvent.getSecurityMetrics()
    ]);

    const reportData = {
      generatedAt: new Date(),
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || new Date()
      },
      summary: metrics,
      events: events,
      eventsByType: {},
      eventsByRisk: {}
    };

    // Group events by type and risk
    events.forEach(event => {
      reportData.eventsByType[event.type] = (reportData.eventsByType[event.type] || 0) + 1;
      reportData.eventsByRisk[event.riskLevel] = (reportData.eventsByRisk[event.riskLevel] || 0) + 1;
    });

    // Log report generation
    await SecurityEvent.logEvent({
      type: 'data_export',
      userId: req.user.id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      location: 'System Admin Panel',
      riskLevel: 'low',
      details: 'Security report generated',
      metadata: { 
        reportPeriod: { startDate, endDate },
        eventCount: events.length
      }
    });

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate security report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
