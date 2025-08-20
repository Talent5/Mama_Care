import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Persist activities to MongoDB using ActivityLog model

// @route   POST /api/dashboard/activity
// @desc    Track user activity
// @access  Private
router.post('/activity', [
  auth,
  body('type').isIn(['health_metric', 'symptom_log', 'appointment_action', 'emergency_call', 'app_usage', 'medication', 'reading']).withMessage('Invalid activity type'),
  body('description').notEmpty().trim().withMessage('Description is required')
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

    const { type, description, metadata, value, unit, severity } = req.body;
    const userId = req.user.id;

    // Get patient record
    const patient = await Patient.findOne({ user: userId });

    // Create activity log entry in DB
    const activityLog = await ActivityLog.create({
      user: userId,
      patient: patient?._id,
      type,
      description,
      metadata: metadata || {},
      timestamp: new Date(),
      value,
      unit,
      severity
    });

    console.log(`📊 Activity tracked for user ${userId}: ${type} - ${description}`);

    res.json({
      success: true,
      message: 'Activity tracked successfully',
      data: activityLog
    });

  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Get user activity history
// @access  Private
router.get('/activity', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    // Fetch activities for current user and sort by most recent
    const userActivities = await ActivityLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: userActivities
    });

  } catch (error) {
    console.error('Get activity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/dashboard/activity/sync
// @desc    Sync offline activities
// @access  Private
router.post('/activity/sync', [
  auth,
  body('activities').isArray().withMessage('Activities must be an array')
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

    const { activities } = req.body;
    const userId = req.user.id;

    // Get patient record
    const patient = await Patient.findOne({ user: userId });

    const docs = (activities || [])
      .filter(a => a.type && a.description)
      .map(a => ({
        user: userId,
        patient: patient?._id,
        type: a.type,
        description: a.description,
        metadata: a.metadata || {},
        timestamp: new Date(a.timestamp || Date.now()),
        value: a.value,
        unit: a.unit,
        severity: a.severity,
      }));

    const result = await ActivityLog.insertMany(docs, { ordered: false });
    const syncedCount = result.length;

    console.log(`📊 Synced ${syncedCount} offline activities for user ${userId}`);

    res.json({
      success: true,
      message: `Synced ${syncedCount} activities successfully`,
      data: { syncedCount }
    });

  } catch (error) {
    console.error('Activity sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/analytics/patient-activity
// @desc    Get patient activity analytics (for admin dashboard)
// @access  Private (Admin/Healthcare Provider)
router.get('/analytics/patient-activity', auth, async (req, res) => {
  try {
    const { patientId, startDate, endDate, type, limit = 50, includeMetadata = true } = req.query;

    const query = {};
    if (patientId) Object.assign(query, { patient: patientId });
    if (type) Object.assign(query, { type });
    if (startDate || endDate) {
      Object.assign(query, {
        timestamp: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {}),
        },
      });
    }

    // Set default time range if none provided (last 24 hours for real-time feel)
    if (!startDate && !endDate) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      query.timestamp = { $gte: oneDayAgo };
    }

    const limitNum = Math.min(parseInt(limit) || 50, 200); // Cap at 200 for performance

    const filteredActivities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limitNum)
      .populate('user', 'firstName lastName email')
      .populate('patient', 'firstName lastName phone')
      .lean();

    // Generate analytics
    const activitiesByType = filteredActivities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});

    const activitiesByDay = filteredActivities.reduce((acc, a) => {
      const day = new Date(a.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Get unique patients and users for analytics
    const uniquePatients = new Set(
      filteredActivities
        .map(a => a.patient?._id?.toString())
        .filter(Boolean)
    );
    const uniqueUsers = new Set(
      filteredActivities
        .map(a => a.user?._id?.toString())
        .filter(Boolean)
    );

    // Recent activities with enhanced data
    const recentActivities = filteredActivities.slice(0, 20).map(activity => ({
      id: activity._id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      user: activity.user ? {
        id: activity.user._id,
        name: `${activity.user.firstName} ${activity.user.lastName}`,
        email: activity.user.email
      } : null,
      patient: activity.patient ? {
        id: activity.patient._id,
        name: `${activity.patient.firstName} ${activity.patient.lastName}`,
        phone: activity.patient.phone
      } : null,
      metadata: includeMetadata === 'true' ? activity.metadata : undefined,
      severity: activity.severity,
      value: activity.value,
      unit: activity.unit
    }));

    const analytics = {
      totalActivities: filteredActivities.length,
      uniquePatients: uniquePatients.size,
      uniqueUsers: uniqueUsers.size,
      activitiesByType,
      activitiesByDay,
      recentActivities,
      engagementScore: calculateEngagementScore(filteredActivities),
      lastUpdate: new Date().toISOString(),
      // Real-time indicators
      emergencyCallsLast24h: filteredActivities.filter(a => 
        a.type === 'emergency_call' && 
        new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      healthMetricsLast24h: filteredActivities.filter(a => 
        a.type === 'health_metric' && 
        new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      medicationLogsLast24h: filteredActivities.filter(a => 
        a.type === 'medication' && 
        new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };

    // Add cache headers for better performance
    res.set({
      'Cache-Control': 'no-cache, must-revalidate',
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });

    res.json({ success: true, data: analytics });

  } catch (error) {
    console.error('Patient activity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/analytics/activity-stream
// @desc    Get real-time activity stream with minimal latency
// @access  Private (Admin/Healthcare Provider)
router.get('/analytics/activity-stream', auth, async (req, res) => {
  try {
    const { since, limit = 10 } = req.query;
    
    const query = {};
    if (since) {
      // Get activities since a specific timestamp for real-time updates
      query.timestamp = { $gt: new Date(since) };
    } else {
      // Default to last 5 minutes if no timestamp provided
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      query.timestamp = { $gte: fiveMinutesAgo };
    }

    const limitNum = Math.min(parseInt(limit) || 10, 50);

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limitNum)
      .populate('user', 'firstName lastName')
      .populate('patient', 'firstName lastName')
      .lean();

    const streamData = {
      activities: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown User',
        patient: activity.patient ? `${activity.patient.firstName} ${activity.patient.lastName}` : 'Unknown Patient',
        severity: activity.severity,
        isEmergency: activity.type === 'emergency_call',
        isHealthMetric: activity.type === 'health_metric'
      })),
      lastUpdate: new Date().toISOString(),
      hasNewData: activities.length > 0
    };

    // Set headers for real-time streaming
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    res.json({ success: true, data: streamData });

  } catch (error) {
    console.error('Activity stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/analytics/live-stats
// @desc    Get live statistics for real-time dashboard updates
// @access  Private (Admin/Healthcare Provider)
router.get('/analytics/live-stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run queries in parallel for better performance
    const [
      activitiesLastHour,
      activitiesLast24h,
      emergenciesLast24h,
      healthMetricsLast24h,
      medicationLogsLast24h
    ] = await Promise.all([
      ActivityLog.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      ActivityLog.countDocuments({ timestamp: { $gte: oneDayAgo } }),
      ActivityLog.countDocuments({ 
        type: 'emergency_call', 
        timestamp: { $gte: oneDayAgo } 
      }),
      ActivityLog.countDocuments({ 
        type: 'health_metric', 
        timestamp: { $gte: oneDayAgo } 
      }),
      ActivityLog.countDocuments({ 
        type: 'medication', 
        timestamp: { $gte: oneDayAgo } 
      })
    ]);

    // Get active users/patients count
    const activeUsersLast24h = await ActivityLog.distinct('user', { 
      timestamp: { $gte: oneDayAgo } 
    });
    const activePatientsLast24h = await ActivityLog.distinct('patient', { 
      timestamp: { $gte: oneDayAgo },
      patient: { $exists: true, $ne: null }
    });

    const liveStats = {
      activitiesLastHour,
      activitiesLast24h,
      emergenciesLast24h,
      healthMetricsLast24h,
      medicationLogsLast24h,
      activeUsersLast24h: activeUsersLast24h.length,
      activePatientsLast24h: activePatientsLast24h.length,
      activityRate: activitiesLastHour > 0 ? Math.round(activitiesLastHour / 60 * 100) / 100 : 0, // activities per minute
      lastUpdate: now.toISOString()
    };

    res.set({
      'Cache-Control': 'no-cache, must-revalidate',
      'ETag': `"${now.getTime()}"`
    });

    res.json({ success: true, data: liveStats });

  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/analytics/overview
// @desc    Get overall activity analytics for admin dashboard
// @access  Private (Admin/Healthcare Provider)
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const filteredActivities = await ActivityLog.find({ timestamp: { $gte: startDate } }).lean();

    // Get unique active users
    const activeUsers = new Set(filteredActivities.map(activity => activity.userId));
    const activePatients = new Set(filteredActivities.map(activity => activity.patientId).filter(Boolean));

    // Calculate metrics
    const overview = {
      period,
      totalActivities: filteredActivities.length,
      activeUsers: activeUsers.size,
      activePatients: activePatients.size,
      averageActivitiesPerUser: activeUsers.size > 0 ? Math.round(filteredActivities.length / activeUsers.size) : 0,
      activitiesByType: {},
      emergencyCallsCount: filteredActivities.filter(a => a.type === 'emergency_call').length,
      healthMetricsCount: filteredActivities.filter(a => a.type === 'health_metric').length,
      symptomLogsCount: filteredActivities.filter(a => a.type === 'symptom_log').length,
      medicationComplianceRate: calculateMedicationCompliance(filteredActivities),
      engagementTrends: calculateEngagementTrends(filteredActivities, period)
    };

    // Group by type
    filteredActivities.forEach(activity => {
      overview.activitiesByType[activity.type] = (overview.activitiesByType[activity.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Activity overview analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions
function calculateEngagementScore(activities) {
  if (activities.length === 0) return 0;

  const weights = {
    health_metric: 2,
    medication: 3,
    symptom_log: 2,
    app_usage: 1,
    reading: 1,
    appointment_action: 3,
    emergency_call: 5
  };

  const totalScore = activities.reduce((score, activity) => {
    return score + (weights[activity.type] || 1);
  }, 0);

  return Math.min(100, Math.round(totalScore / activities.length * 10));
}

function calculateMedicationCompliance(activities) {
  const medicationActivities = activities.filter(a => a.type === 'medication');
  if (medicationActivities.length === 0) return 0;

  const completedMedications = medicationActivities.filter(a => 
    a.metadata && a.metadata.taken === true
  ).length;

  return Math.round((completedMedications / medicationActivities.length) * 100);
}

function calculateEngagementTrends(activities, period) {
  const trends = {};
  const now = new Date();

  let intervals;
  let format;

  switch (period) {
    case '24h':
      intervals = 24;
      format = 'hour';
      break;
    case '7d':
      intervals = 7;
      format = 'day';
      break;
    case '30d':
      intervals = 30;
      format = 'day';
      break;
    default:
      intervals = 7;
      format = 'day';
  }

  for (let i = intervals - 1; i >= 0; i--) {
    const date = new Date(now);
    
    if (format === 'hour') {
      date.setHours(date.getHours() - i);
      const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      trends[key] = 0;
    } else {
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      trends[key] = 0;
    }
  }

  activities.forEach(activity => {
    const timestamp = new Date(activity.timestamp);
    let key;
    
    if (format === 'hour') {
      key = timestamp.toISOString().slice(0, 13);
    } else {
      key = timestamp.toISOString().slice(0, 10);
    }
    
    if (trends.hasOwnProperty(key)) {
      trends[key]++;
    }
  });

  return trends;
}

export default router;
