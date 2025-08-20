import express from 'express';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import HealthMetric from '../models/HealthMetric.js';
import ActivityLog from '../models/ActivityLog.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/analytics/real-time
// @desc    Get real-time analytics data
// @access  Private (System Admin, Healthcare Provider)
router.get('/real-time', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    
    // Real-time metrics
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
      isActive: true
    });

    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: today },
      isActive: true
    });

    const pendingAppointments = await Appointment.countDocuments({
      status: 'pending',
      isActive: true
    });

    const emergencyAlerts = await Patient.countDocuments({
      'currentPregnancy.riskLevel': 'High',
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    // System performance metrics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const totalAppointments = await Appointment.countDocuments({ isActive: true });

    // Push notification statistics
    const usersWithPushTokens = await User.countDocuments({
      pushToken: { $exists: true, $ne: null },
      isActive: true
    });
    const pushTokenCoverage = totalUsers > 0 ? ((usersWithPushTokens / totalUsers) * 100).toFixed(1) : 0;

    // Recent activities (last 30 minutes)
    const recentActivities = await ActivityLog.find({
      timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    })
    .populate('user', 'firstName lastName')
    .sort({ timestamp: -1 })
    .limit(20);

    // Live appointment status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: today },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        realTimeMetrics: {
          activeUsers,
          todayAppointments,
          pendingAppointments,
          emergencyAlerts,
          systemLoad: Math.random() * 100, // Mock system load
          uptime: process.uptime(),
          timestamp: now
        },
        systemStats: {
          totalUsers,
          totalPatients,
          totalAppointments,
          pushTokenCoverage: parseFloat(pushTokenCoverage)
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity._id,
          type: activity.type,
          description: activity.description,
          user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
          timestamp: activity.timestamp,
          metadata: activity.metadata
        })),
        appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get real-time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/health-metrics
// @desc    Get health metrics analytics
// @access  Private (System Admin, Healthcare Provider)
router.get('/health-metrics', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Health metrics by type
    const metricsByType = await HealthMetric.aggregate([
      {
        $match: {
          recordedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' }
        }
      }
    ]);

    // Daily health metric submissions
    const dailyMetrics = await HealthMetric.aggregate([
      {
        $match: {
          recordedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Blood pressure trends for pregnant patients
    const bpTrends = await HealthMetric.aggregate([
      {
        $match: {
          type: 'blood_pressure',
          recordedAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData'
        }
      },
      {
        $match: {
          'patientData.currentPregnancy.isPregnant': true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" }
          },
          avgSystolic: { $avg: '$metadata.systolic' },
          avgDiastolic: { $avg: '$metadata.diastolic' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Risk assessment based on metrics
    const highRiskMetrics = await HealthMetric.aggregate([
      {
        $match: {
          recordedAt: { $gte: startDate },
          $or: [
            { type: 'blood_pressure', 'metadata.systolic': { $gt: 140 } },
            { type: 'blood_pressure', 'metadata.diastolic': { $gt: 90 } },
            { type: 'weight', value: { $lt: 45 } },
            { type: 'blood_sugar', value: { $gt: 200 } }
          ]
        }
      },
      {
        $group: {
          _id: '$patient',
          riskFactors: {
            $push: {
              type: '$type',
              value: '$value',
              date: '$recordedAt'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        metricsByType: metricsByType.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            average: parseFloat(item.avgValue?.toFixed(2)) || 0,
            min: item.minValue,
            max: item.maxValue
          };
          return acc;
        }, {}),
        dailyMetrics: dailyMetrics.map(item => ({
          date: item._id,
          count: item.count
        })),
        bpTrends: bpTrends.map(item => ({
          date: item._id,
          avgSystolic: parseFloat(item.avgSystolic?.toFixed(1)) || 0,
          avgDiastolic: parseFloat(item.avgDiastolic?.toFixed(1)) || 0,
          count: item.count
        })),
        highRiskPatients: highRiskMetrics.length
      }
    });
  } catch (error) {
    console.error('Get health metrics analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/notifications
// @desc    Get notification analytics
// @access  Private (System Admin)
router.get('/notifications', [auth, roleAuth('system_admin')], async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '1d':
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

    // Push notification coverage
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersWithTokens = await User.countDocuments({
      pushToken: { $exists: true, $ne: null },
      isActive: true
    });

    // Appointment reminders sent
    const appointmentReminders = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate },
      pushRemindersSent: { $exists: true, $ne: [] },
      isActive: true
    });

    // Upcoming appointments needing reminders
    const upcomingNeedingReminders = await Appointment.countDocuments({
      appointmentDate: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      status: { $in: ['scheduled', 'confirmed'] },
      remindersSent: { $ne: '24h' },
      isActive: true
    });

    // Mock notification delivery stats (in production, track from push service)
    const notificationStats = {
      sent: Math.floor(Math.random() * 1000) + 500,
      delivered: Math.floor(Math.random() * 800) + 400,
      opened: Math.floor(Math.random() * 300) + 100,
      failed: Math.floor(Math.random() * 50) + 10
    };

    res.json({
      success: true,
      data: {
        period,
        coverage: {
          totalUsers,
          usersWithTokens,
          coveragePercentage: totalUsers > 0 ? ((usersWithTokens / totalUsers) * 100).toFixed(1) : 0
        },
        reminders: {
          appointmentReminders,
          upcomingNeedingReminders
        },
        deliveryStats: {
          ...notificationStats,
          deliveryRate: notificationStats.sent > 0 ? 
            ((notificationStats.delivered / notificationStats.sent) * 100).toFixed(1) : 0,
          openRate: notificationStats.delivered > 0 ? 
            ((notificationStats.opened / notificationStats.delivered) * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get notification analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get system performance analytics
// @access  Private (System Admin)
router.get('/performance', [auth, roleAuth('system_admin')], async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Database connection status
    const dbStats = {
      connected: true, // Mock - implement actual DB health check
      responseTime: Math.random() * 50 + 10, // Mock response time in ms
      activeConnections: Math.floor(Math.random() * 10) + 5
    };

    // API usage statistics
    const apiStats = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          type: 'api_call'
        }
      },
      {
        $group: {
          _id: {
            endpoint: '$metadata.endpoint',
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$metadata.responseTime' }
        }
      },
      {
        $group: {
          _id: '$_id.endpoint',
          totalCalls: { $sum: '$count' },
          avgResponseTime: { $avg: '$avgResponseTime' },
          hourlyCounts: {
            $push: {
              hour: '$_id.hour',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { totalCalls: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Error rate
    const totalRequests = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate },
      type: 'api_call'
    });

    const errorRequests = await ActivityLog.countDocuments({
      timestamp: { $gte: startDate },
      type: 'api_call',
      'metadata.statusCode': { $gte: 400 }
    });

    const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        period,
        systemMetrics: {
          ...systemMetrics,
          memoryUsage: {
            rss: Math.round(systemMetrics.memoryUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(systemMetrics.memoryUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(systemMetrics.memoryUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(systemMetrics.memoryUsage.external / 1024 / 1024) // MB
          }
        },
        database: dbStats,
        api: {
          totalRequests,
          errorRequests,
          errorRate: parseFloat(errorRate),
          topEndpoints: apiStats.map(stat => ({
            endpoint: stat._id,
            totalCalls: stat.totalCalls,
            avgResponseTime: Math.round(stat.avgResponseTime || 0)
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/appointments
// @desc    Get appointments analytics
// @access  Private (System Admin, Healthcare Provider)
router.get('/appointments', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Total appointments
    const totalAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate },
      isActive: true
    });

    // Appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Appointments by type
    const appointmentsByType = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Appointments by priority
    const appointmentsByPriority = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily appointment counts for chart
    const dailyAppointments = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Upcoming appointments (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(),
        $lte: sevenDaysFromNow
      },
      status: { $in: ['scheduled', 'confirmed'] },
      isActive: true
    });

    // Average appointments per day
    const daysDiff = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const averagePerDay = (totalAppointments / daysDiff).toFixed(1);

    res.json({
      success: true,
      data: {
        period,
        totalAppointments,
        averagePerDay: parseFloat(averagePerDay),
        upcomingAppointments,
        appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        appointmentsByType: appointmentsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        appointmentsByPriority: appointmentsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dailyAppointments: dailyAppointments.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get appointments analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/patients
// @desc    Get patients analytics
// @access  Private (System Admin, Healthcare Provider)
router.get('/patients', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Total patients
    const totalPatients = await Patient.countDocuments({ isActive: true });
    
    // New patients in period
    const newPatients = await Patient.countDocuments({
      createdAt: { $gte: startDate },
      isActive: true
    });

    // Pregnant patients
    const pregnantPatients = await Patient.countDocuments({
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    // Patients by age groups
    const patientsByAge = await Patient.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: 'Under 18' },
                { case: { $lt: ['$age', 25] }, then: '18-24' },
                { case: { $lt: ['$age', 35] }, then: '25-34' },
                { case: { $lt: ['$age', 45] }, then: '35-44' },
                { case: { $gte: ['$age', 45] }, then: '45+' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Risk level distribution for pregnant patients
    const riskLevelDistribution = await Patient.aggregate([
      {
        $match: {
          'currentPregnancy.isPregnant': true,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$currentPregnancy.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily new patient registrations
    const dailyRegistrations = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Due soon (next 4 weeks)
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
    
    const dueSoon = await Patient.countDocuments({
      'currentPregnancy.estimatedDueDate': {
        $gte: new Date(),
        $lte: fourWeeksFromNow
      },
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        period,
        totalPatients,
        newPatients,
        pregnantPatients,
        dueSoon,
        patientsByAge: patientsByAge.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        riskLevelDistribution: riskLevelDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dailyRegistrations: dailyRegistrations.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get patients analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/overview
// @desc    Get overview analytics
// @access  Private (System Admin, Healthcare Provider)
router.get('/overview', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    // Get current date ranges
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total counts
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const pregnantPatients = await Patient.countDocuments({
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      },
      isActive: true
    });

    // This week's appointments
    const thisWeekAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: thisWeekStart },
      isActive: true
    });

    // Last week's appointments for comparison
    const lastWeekAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: lastWeekStart,
        $lt: thisWeekStart
      },
      isActive: true
    });

    // This month's new patients
    const thisMonthNewPatients = await Patient.countDocuments({
      createdAt: { $gte: thisMonthStart },
      isActive: true
    });

    // Last month's new patients for comparison
    const lastMonthNewPatients = await Patient.countDocuments({
      createdAt: {
        $gte: lastMonthStart,
        $lt: thisMonthStart
      },
      isActive: true
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAppointments = await Appointment.find({
      createdAt: { $gte: sevenDaysAgo },
      isActive: true
    })
    .populate({
      path: 'patient',
      select: 'name user',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .populate('healthcareProvider', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    const recentPatients = await Patient.find({
      createdAt: { $gte: sevenDaysAgo },
      isActive: true
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

    // Calculate percentage changes
    const appointmentChange = lastWeekAppointments > 0 
      ? ((thisWeekAppointments - lastWeekAppointments) / lastWeekAppointments * 100).toFixed(1)
      : 0;

    const patientChange = lastMonthNewPatients > 0
      ? ((thisMonthNewPatients - lastMonthNewPatients) / lastMonthNewPatients * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalPatients,
          totalUsers,
          pregnantPatients,
          todayAppointments,
          thisWeekAppointments,
          thisMonthNewPatients
        },
        changes: {
          appointmentChange: parseFloat(appointmentChange),
          patientChange: parseFloat(patientChange)
        },
        recentActivity: {
          appointments: recentAppointments.map(apt => ({
            id: apt._id,
            patientName: apt.patient?.user ? 
              `${apt.patient.user.firstName} ${apt.patient.user.lastName}` : apt.patient?.name || 'Unknown',
            providerName: apt.healthcareProvider ? 
              `${apt.healthcareProvider.firstName} ${apt.healthcareProvider.lastName}` : 'Unknown',
            type: apt.type,
            date: apt.appointmentDate,
            time: apt.appointmentTime,
            status: apt.status,
            createdAt: apt.createdAt
          })),
          patients: recentPatients.map(patient => ({
            id: patient._id,
            name: patient.user ? 
              `${patient.user.firstName} ${patient.user.lastName}` : patient.name || 'Unknown',
            email: patient.user?.email,
            age: patient.age,
            isPregnant: patient.currentPregnancy?.isPregnant || false,
            createdAt: patient.createdAt
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private (System Admin, Healthcare Provider)
router.get('/dashboard', [auth, roleAuth('system_admin', 'healthcare_provider', 'doctor')], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get total patients
    const totalPatients = await Patient.countDocuments({ isActive: true });
    
    // Get active patients - simplified to pregnant patients + recently registered
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pregnantPatients = await Patient.countDocuments({
      isActive: true,
      'currentPregnancy.isPregnant': true
    });
    const recentPatients = await Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    });
    const activePatients = Math.max(pregnantPatients, recentPatients);

    // Get today's appointments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      isActive: true
    });

    // Get pending appointments today
    const pendingAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: 'scheduled',
      isActive: true
    });

    // Get high-risk patients
    const highRiskPatients = await Patient.countDocuments({
      'riskFactors.level': 'high',
      isActive: true
    });

    // Get ANC completion rate (patients with 4+ ANC visits)
    const totalPregnantPatients = await Patient.countDocuments({
      'currentPregnancy.isPregnant': true,
      isActive: true
    });

    const ancCompletedPatients = await Patient.countDocuments({
      'currentPregnancy.isPregnant': true,
      'currentPregnancy.ancVisits': { $gte: 4 },
      isActive: true
    });

    const ancCompletionRate = totalPregnantPatients > 0 
      ? Math.round((ancCompletedPatients / totalPregnantPatients) * 100) 
      : 0;

    // Get risk distribution
    const riskDistribution = await Patient.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$riskFactors.level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get ANC visits by stage
    const ancVisitsByStage = await Patient.aggregate([
      {
        $match: {
          'currentPregnancy.isPregnant': true,
          isActive: true
        }
      },
      {
        $project: {
          ancVisits: { $ifNull: ['$currentPregnancy.ancVisits', 0] }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$ancVisits', 0] }, then: 'Visit 1' },
                { case: { $eq: ['$ancVisits', 1] }, then: 'Visit 2' },
                { case: { $eq: ['$ancVisits', 2] }, then: 'Visit 3' },
                { case: { $eq: ['$ancVisits', 3] }, then: 'Visit 4' },
                { case: { $gte: ['$ancVisits', 4] }, then: 'Visit 5+' }
              ],
              default: 'Visit 1'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly trends for the last 6 months
    const monthlyTrends = await Patient.aggregate([
      {
        $match: {
          registrationDate: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$registrationDate" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get recent activity
    const recentActivity = await Patient.find({
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName createdAt riskFactors.level');

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      appointmentDate: { $gte: todayStart },
      status: 'scheduled',
      isActive: true
    })
    .populate('patient', 'firstName lastName phone')
    .sort({ appointmentDate: 1 })
    .limit(5);

    // Format the response
    const dashboardStats = {
      totalPatients,
      activePatients,
      todaysAppointments,
      pendingAppointments,
      highRiskPatients,
      ancCompletionRate,
      riskDistribution: riskDistribution.reduce((acc, item) => {
        acc[item._id || 'low'] = item.count;
        return acc;
      }, { low: 0, medium: 0, high: 0 }),
      ancVisitsByStage: ancVisitsByStage.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      monthlyTrends,
      recentActivity,
      upcomingAppointments
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
