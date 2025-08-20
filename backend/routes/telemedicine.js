import express from 'express';
import VideoConsultation from '../models/VideoConsultation.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// Create video consultation session
router.post('/create-session', [auth], async (req, res) => {
  try {
    const { appointmentId, settings } = req.body;

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient')
      .populate('provider');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is part of the appointment
    const isPatient = appointment.patient.user.toString() === req.user.id;
    const isProvider = appointment.provider._id.toString() === req.user.id;
    
    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if session already exists
    const existingSession = await VideoConsultation.findOne({ 
      appointment: appointmentId,
      status: { $in: ['scheduled', 'waiting', 'active'] }
    });

    if (existingSession) {
      return res.json({
        success: true,
        message: 'Session already exists',
        data: existingSession
      });
    }

    const videoConsultation = new VideoConsultation({
      appointment: appointmentId,
      scheduledTime: new Date(appointment.date),
      participants: {
        patient: {
          userId: appointment.patient.user,
          connectionStatus: 'disconnected'
        },
        provider: {
          userId: appointment.provider._id,
          connectionStatus: 'disconnected'
        }
      },
      settings: {
        videoEnabled: settings?.videoEnabled !== undefined ? settings.videoEnabled : true,
        audioEnabled: settings?.audioEnabled !== undefined ? settings.audioEnabled : true,
        screenSharingEnabled: settings?.screenSharingEnabled !== undefined ? settings.screenSharingEnabled : true,
        chatEnabled: settings?.chatEnabled !== undefined ? settings.chatEnabled : true,
        recordingEnabled: settings?.recordingEnabled || false,
        maxDuration: settings?.maxDuration || 60
      },
      createdBy: req.user.id
    });

    await videoConsultation.save();

    // Update appointment type to include telemedicine
    await Appointment.findByIdAndUpdate(appointmentId, {
      type: 'consultation',
      notes: appointment.notes ? `${appointment.notes} (Telemedicine)` : 'Telemedicine consultation'
    });

    res.status(201).json({
      success: true,
      message: 'Video consultation session created successfully',
      data: videoConsultation
    });
  } catch (error) {
    console.error('Error creating video session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create video session'
    });
  }
});

// Join video session
router.post('/join/:sessionId', [auth], async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to join
    const isPatient = session.participants.patient.userId._id.toString() === req.user.id;
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    
    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update participant status
    const now = new Date();
    if (isPatient) {
      session.participants.patient.joinedAt = now;
      session.participants.patient.connectionStatus = 'connected';
    } else if (isProvider) {
      session.participants.provider.joinedAt = now;
      session.participants.provider.connectionStatus = 'connected';
    }

    // Start session if not already started
    if (session.status === 'scheduled' || session.status === 'waiting') {
      session.status = 'active';
      session.startTime = now;
    }

    await session.save();

    // Generate token for WebRTC (in a real implementation, you'd use a proper WebRTC service)
    const token = Buffer.from(JSON.stringify({
      sessionId,
      userId: req.user.id,
      roomName: session.roomName,
      role: isPatient ? 'patient' : 'provider',
      timestamp: now.getTime()
    })).toString('base64');

    res.json({
      success: true,
      message: 'Joined session successfully',
      data: {
        token,
        roomName: session.roomName,
        sessionId,
        settings: session.settings,
        participants: session.participants
      }
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join session'
    });
  }
});

// Leave video session
router.post('/leave/:sessionId', [auth], async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of the session
    const isPatient = session.participants.patient.userId._id.toString() === req.user.id;
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    
    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update participant status
    const now = new Date();
    if (isPatient) {
      session.participants.patient.leftAt = now;
      session.participants.patient.connectionStatus = 'disconnected';
    } else if (isProvider) {
      session.participants.provider.leftAt = now;
      session.participants.provider.connectionStatus = 'disconnected';
    }

    // End session if both participants have left
    const bothLeft = session.participants.patient.connectionStatus === 'disconnected' && 
                     session.participants.provider.connectionStatus === 'disconnected';
    
    if (bothLeft && session.status === 'active') {
      session.status = 'completed';
      session.endTime = now;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Left session successfully',
      data: session
    });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to leave session'
    });
  }
});

// End video session
router.post('/end/:sessionId', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider')], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Only providers can end sessions
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    
    if (!isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Only healthcare providers can end sessions'
      });
    }

    const now = new Date();
    session.status = 'completed';
    session.endTime = now;
    session.participants.patient.connectionStatus = 'disconnected';
    session.participants.provider.connectionStatus = 'disconnected';
    
    if (notes) {
      session.notes = notes;
    }

    await session.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(session.appointment._id, {
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end session'
    });
  }
});

// Send chat message
router.post('/:sessionId/chat', [auth], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, messageType = 'text', attachments } = req.body;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of the session
    const isPatient = session.participants.patient.userId._id.toString() === req.user.id;
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    
    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const chatMessage = {
      senderId: req.user.id,
      senderRole: isPatient ? 'patient' : 'provider',
      message,
      messageType,
      attachments: attachments || [],
      timestamp: new Date()
    };

    session.chatHistory.push(chatMessage);
    await session.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
});

// Get session details
router.get('/:sessionId', [auth], async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check permissions
    const isPatient = session.participants.patient.userId._id.toString() === req.user.id;
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isPatient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session'
    });
  }
});

// Get user's video sessions
router.get('/', [auth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

    // Build query based on user role
    let query = { isActive: true };

    if (req.user.role === 'patient') {
      query['participants.patient.userId'] = req.user.id;
    } else if (['doctor', 'nurse', 'healthcare_provider'].includes(req.user.role)) {
      query['participants.provider.userId'] = req.user.id;
    } else if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (status) query.status = status;
    
    if (dateFrom || dateTo) {
      query.scheduledTime = {};
      if (dateFrom) query.scheduledTime.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledTime.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sessions, total] = await Promise.all([
      VideoConsultation.find(query)
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      VideoConsultation.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sessions'
    });
  }
});

// Submit feedback
router.post('/:sessionId/feedback', [auth], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, comments, technicalRating } = req.body;
    
    const session = await VideoConsultation.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of the session
    const isPatient = session.participants.patient.userId._id.toString() === req.user.id;
    const isProvider = session.participants.provider.userId._id.toString() === req.user.id;
    
    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const feedbackData = {
      rating: parseInt(rating),
      comments,
      technicalRating: technicalRating ? parseInt(technicalRating) : undefined,
      submittedAt: new Date()
    };

    if (isPatient) {
      session.feedback.patient = feedbackData;
    } else if (isProvider) {
      session.feedback.provider = feedbackData;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: session.feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback'
    });
  }
});

// Get telemedicine statistics
router.get('/stats/dashboard', [auth, roleAuth('admin', 'super_admin', 'doctor', 'nurse', 'healthcare_provider')], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.scheduledTime = {};
      if (dateFrom) dateFilter.scheduledTime.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.scheduledTime.$lte = new Date(dateTo);
    }

    const providerFilter = ['doctor', 'nurse', 'healthcare_provider'].includes(req.user.role) && !['admin', 'super_admin'].includes(req.user.role)
      ? { 'participants.provider.userId': req.user.id, ...dateFilter }
      : dateFilter;

    const [
      totalSessions,
      activeSessions,
      completedSessions,
      averageDuration,
      sessionsToday,
      feedbackStats
    ] = await Promise.all([
      VideoConsultation.countDocuments({ ...providerFilter, isActive: true }),
      
      VideoConsultation.countDocuments({ 
        ...providerFilter, 
        isActive: true, 
        status: 'active' 
      }),
      
      VideoConsultation.countDocuments({ 
        ...providerFilter, 
        isActive: true, 
        status: 'completed' 
      }),
      
      VideoConsultation.aggregate([
        { $match: { ...providerFilter, isActive: true, status: 'completed', duration: { $exists: true } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),
      
      VideoConsultation.countDocuments({ 
        ...providerFilter, 
        isActive: true,
        scheduledTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      
      VideoConsultation.aggregate([
        { $match: { ...providerFilter, isActive: true, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgPatientRating: { $avg: '$feedback.patient.rating' },
            avgProviderRating: { $avg: '$feedback.provider.rating' },
            avgTechnicalRating: { 
              $avg: { 
                $avg: ['$feedback.patient.technicalRating', '$feedback.provider.technicalRating'] 
              } 
            },
            totalFeedbacks: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        completedSessions,
        averageDuration: averageDuration[0]?.avgDuration || 0,
        sessionsToday,
        feedback: feedbackStats[0] || {
          avgPatientRating: 0,
          avgProviderRating: 0,
          avgTechnicalRating: 0,
          totalFeedbacks: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching telemedicine statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

export default router;
