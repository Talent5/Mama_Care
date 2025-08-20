import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth, roleAuth } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';
import reminderScheduler from '../services/reminderScheduler.js';

const router = express.Router();

// In-memory notification store (in production, use a database)
let notifications = [];

// @route   PUT /api/notifications/push-token
// @desc    Update user's push token
// @access  Private
router.put('/push-token', [
  auth,
  body('pushToken').notEmpty().withMessage('Push token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { pushToken } = req.body;
    
    // Update user's push token in database
    // This would typically update the User model
    // await User.findByIdAndUpdate(req.user.id, { pushToken });

    res.json({
      success: true,
      message: 'Push token updated successfully'
    });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update push token'
    });
  }
});

// GET /api/notifications - Get notifications for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userNotifications = notifications.filter(
      notification => notification.userId === req.user.id
    );

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        notifications: userNotifications,
        unreadCount: userNotifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// POST /api/notifications/mark-read/:id - Mark a notification as read
router.post('/mark-read/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = notifications.find(
      n => n.id === notificationId && n.userId === req.user.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    const userNotifications = notifications.filter(
      n => n.userId === req.user.id && !n.read
    );

    userNotifications.forEach(notification => {
      notification.read = true;
      notification.readAt = new Date();
    });

    res.json({
      success: true,
      message: `Marked ${userNotifications.length} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notificationIndex = notifications.findIndex(
      n => n.id === notificationId && n.userId === req.user.id
    );

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notifications.splice(notificationIndex, 1);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// POST /api/notifications/send - Send push notification (Admin only)
router.post('/send', [
  auth,
  roleAuth(['admin', 'superadmin']),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('recipients').isArray().withMessage('Recipients must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { title, body: messageBody, recipients, data } = req.body;

    const results = await pushNotificationService.sendBulkNotifications(recipients, {
      title,
      body: messageBody,
      data
    });

    // Create notifications in our store
    const notificationPromises = recipients.map(userId => {
      return createNotification({
        userId,
        title,
        message: messageBody,
        type: 'admin',
        data
      });
    });

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: results
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications'
    });
  }
});

// GET /api/notifications/stats - Get notification statistics (Admin only)
router.get('/stats', [auth, roleAuth(['admin', 'superadmin'])], async (req, res) => {
  try {
    const stats = getNotificationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics'
    });
  }
});

// POST /api/notifications/test - Send test notification (Admin only)
router.post('/test', [
  auth,
  roleAuth(['admin', 'superadmin']),
  body('pushToken').notEmpty().withMessage('Push token is required'),
  body('title').optional(),
  body('body').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      pushToken, 
      title = 'Test Notification', 
      body = 'This is a test notification from MamaCare' 
    } = req.body;

    const result = await pushNotificationService.sendNotification(pushToken, {
      title,
      body,
      data: { type: 'test' }
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// POST /api/notifications/schedule-reminder - Schedule appointment reminder
router.post('/schedule-reminder', [
  auth,
  roleAuth(['admin', 'doctor']),
  body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
  body('reminderTime').isISO8601().withMessage('Valid reminder time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { appointmentId, reminderTime } = req.body;

    await reminderScheduler.scheduleAppointmentReminder(appointmentId, new Date(reminderTime));

    res.json({
      success: true,
      message: 'Appointment reminder scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule reminder'
    });
  }
});

// GET /api/notifications/reminders/status - Get reminder scheduler status
router.get('/reminders/status', [auth, roleAuth(['admin', 'superadmin'])], async (req, res) => {
  try {
    const status = reminderScheduler.getSchedulerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Utility functions
function createNotification({ userId, title, message, type = 'info', data = {} }) {
  const notification = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    title,
    message,
    type,
    data,
    read: false,
    createdAt: new Date(),
    readAt: null
  };

  notifications.push(notification);
  return notification;
}

function createPatientAssignmentNotification(doctorId, patientName) {
  return createNotification({
    userId: doctorId,
    title: 'New Patient Assignment',
    message: `You have been assigned a new patient: ${patientName}`,
    type: 'patient_assignment',
    data: { patientName }
  });
}

function createEmergencyNotification(userId, message) {
  return createNotification({
    userId,
    title: 'Emergency Alert',
    message,
    type: 'emergency',
    data: { priority: 'high' }
  });
}

function createAppointmentReminderNotification(userId, appointmentDetails) {
  return createNotification({
    userId,
    title: 'Appointment Reminder',
    message: `You have an appointment on ${appointmentDetails.date} at ${appointmentDetails.time}`,
    type: 'appointment_reminder',
    data: appointmentDetails
  });
}

function getNotificationStats() {
  const total = notifications.length;
  const unread = notifications.filter(n => !n.read).length;
  const byType = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    unread,
    read: total - unread,
    byType
  };
}

// Export the router and utility functions
export default router;
export {
  createNotification,
  createPatientAssignmentNotification,
  createEmergencyNotification,
  createAppointmentReminderNotification,
  getNotificationStats
};
