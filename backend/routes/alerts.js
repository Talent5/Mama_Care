import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import Alert from '../models/Alert.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { auth, adminAuth, providerAuth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/alerts
// @desc    Get all alerts with filtering and pagination
// @access  Private (All authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { 
      type, 
      severity, 
      resolved, 
      patientName, 
      search,
      startDate, 
      endDate 
    } = req.query;
    
    // Build query
    let alertQuery = {};
    
    if (type && type !== 'all') {
      alertQuery.type = type;
    }
    
    if (severity && severity !== 'all') {
      alertQuery.severity = severity;
    }
    
    if (resolved !== undefined) {
      alertQuery.resolved = resolved === 'true';
    }
    
    if (patientName || search) {
      const searchTerm = patientName || search;
      alertQuery.patientName = { $regex: searchTerm, $options: 'i' };
    }
    
    if (startDate || endDate) {
      alertQuery.createdAt = {};
      if (startDate) alertQuery.createdAt.$gte = new Date(startDate);
      if (endDate) alertQuery.createdAt.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(alertQuery)
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Alert.countDocuments(alertQuery);

    // Format alerts for frontend
    const formattedAlerts = alerts.map(alert => ({
      id: alert._id.toString(),
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      patientId: alert.patientId?.toString() || alert.patientId,
      patientName: alert.patientName,
      timestamp: alert.createdAt.toISOString(),
      resolved: alert.resolved,
      resolvedBy: alert.resolvedBy ? {
        id: alert.resolvedBy._id,
        name: `${alert.resolvedBy.firstName} ${alert.resolvedBy.lastName}`
      } : null,
      resolvedAt: alert.resolvedAt?.toISOString(),
      notes: alert.notes,
      metadata: alert.metadata
    }));

    res.json({
      success: true,
      data: {
        alerts: formattedAlerts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/alerts/stats
// @desc    Get alert statistics
// @access  Private (All authenticated users)
router.get('/stats', auth, async (req, res) => {
  try {
    // Add simple in-memory cache for stats (1 minute cache)
    const cacheKey = 'alert_stats';
    const cacheTimeout = 60000; // 1 minute
    
    if (!global.alertStatsCache) {
      global.alertStatsCache = {};
    }
    
    const now = Date.now();
    const cached = global.alertStatsCache[cacheKey];
    
    if (cached && (now - cached.timestamp) < cacheTimeout) {
      console.log('📊 Returning cached alert stats');
      return res.json({
        success: true,
        data: cached.data
      });
    }
    
    const stats = await Alert.getAlertStats();
    
    // Cache the results
    global.alertStatsCache[cacheKey] = {
      data: stats,
      timestamp: now
    };
    
    console.log('📊 Fresh alert stats computed and cached');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/alerts
// @desc    Create a new alert
// @access  Private (All authenticated users)
router.post('/', [
  auth,
  body('type').isIn(['high_risk', 'missed_appointment', 'overdue_visit', 'emergency'])
    .withMessage('Invalid alert type'),
  body('severity').isIn(['critical', 'warning', 'info'])
    .withMessage('Invalid severity level'),
  body('message').trim().isLength({ min: 5 })
    .withMessage('Message must be at least 5 characters'),
  body('patientId').isMongoId()
    .withMessage('Valid patient ID is required'),
  body('patientName').trim().isLength({ min: 1 })
    .withMessage('Patient name is required')
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

    const { type, severity, message, patientId, patientName, metadata } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const alert = new Alert({
      type,
      severity,
      message,
      patientId,
      patientName,
      metadata: metadata || {}
    });

    await alert.save();

    res.status(201).json({
      success: true,
      data: {
        id: alert._id.toString(),
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        patientId: alert.patientId.toString(),
        patientName: alert.patientName,
        timestamp: alert.createdAt.toISOString(),
        resolved: alert.resolved,
        metadata: alert.metadata
      },
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/alerts/:id/resolve
// @desc    Mark alert as resolved
// @access  Private (All authenticated users)
router.patch('/:id/resolve', [
  auth,
  param('id').isMongoId().withMessage('Invalid alert ID'),
  body('notes').optional().trim().isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
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
    const { notes } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (alert.resolved) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      });
    }

    await alert.resolve(req.user.id, notes);

    res.json({
      success: true,
      data: {
        id: alert._id.toString(),
        resolved: alert.resolved,
        resolvedBy: req.user.id,
        resolvedAt: alert.resolvedAt.toISOString(),
        notes: alert.notes
      },
      message: 'Alert marked as resolved'
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/alerts/:id
// @desc    Delete an alert (admin only)
// @access  Private (System Admin only)
router.delete('/:id', [
  auth,
  adminAuth,
  param('id').isMongoId().withMessage('Invalid alert ID')
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

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await Alert.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/alerts/patient/:patientId
// @desc    Get alerts for a specific patient
// @access  Private (Admin, Healthcare Provider, Patient owns data)
router.get('/patient/:patientId', [
  auth,
  param('patientId').isMongoId().withMessage('Invalid patient ID')
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
    const { resolved } = req.query;

    // Build query
    let alertQuery = { patientId };
    
    if (resolved !== undefined) {
      alertQuery.resolved = resolved === 'true';
    }

    const alerts = await Alert.find(alertQuery)
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Format alerts for frontend
    const formattedAlerts = alerts.map(alert => ({
      id: alert._id.toString(),
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      patientId: alert.patientId.toString(),
      patientName: alert.patientName,
      timestamp: alert.createdAt.toISOString(),
      resolved: alert.resolved,
      resolvedBy: alert.resolvedBy ? {
        id: alert.resolvedBy._id,
        name: `${alert.resolvedBy.firstName} ${alert.resolvedBy.lastName}`
      } : null,
      resolvedAt: alert.resolvedAt?.toISOString(),
      notes: alert.notes,
      metadata: alert.metadata
    }));

    res.json({
      success: true,
      data: formattedAlerts
    });
  } catch (error) {
    console.error('Get patient alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
