import mongoose from 'mongoose';

const VideoConsultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  roomName: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['webrtc', 'zoom', 'agora', 'twilio'],
    default: 'webrtc'
  },
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'active', 'completed', 'cancelled', 'failed'],
    default: 'scheduled'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startTime: Date,
  endTime: Date,
  duration: Number, // in minutes
  participants: {
    patient: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      joinedAt: Date,
      leftAt: Date,
      connectionStatus: {
        type: String,
        enum: ['connected', 'disconnected', 'reconnecting'],
        default: 'disconnected'
      }
    },
    provider: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      joinedAt: Date,
      leftAt: Date,
      connectionStatus: {
        type: String,
        enum: ['connected', 'disconnected', 'reconnecting'],
        default: 'disconnected'
      }
    }
  },
  settings: {
    videoEnabled: {
      type: Boolean,
      default: true
    },
    audioEnabled: {
      type: Boolean,
      default: true
    },
    screenSharingEnabled: {
      type: Boolean,
      default: true
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    },
    maxDuration: {
      type: Number,
      default: 60 // minutes
    }
  },
  recording: {
    enabled: {
      type: Boolean,
      default: false
    },
    consentGiven: {
      type: Boolean,
      default: false
    },
    recordingId: String,
    url: String,
    startTime: Date,
    endTime: Date,
    size: Number, // in bytes
    duration: Number // in seconds
  },
  chatHistory: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['patient', 'provider'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      originalName: String,
      url: String,
      size: Number,
      type: String
    }]
  }],
  technicalDetails: {
    bandwidth: {
      patient: {
        upload: Number,
        download: Number
      },
      provider: {
        upload: Number,
        download: Number
      }
    },
    quality: {
      video: {
        type: String,
        enum: ['low', 'medium', 'high', 'hd'],
        default: 'medium'
      },
      audio: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high'
      }
    },
    connectionIssues: [{
      timestamp: Date,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      issue: String,
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  feedback: {
    patient: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      technicalRating: {
        type: Number,
        min: 1,
        max: 5
      },
      submittedAt: Date
    },
    provider: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      technicalRating: {
        type: Number,
        min: 1,
        max: 5
      },
      submittedAt: Date
    }
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique session ID
VideoConsultationSchema.pre('save', function(next) {
  if (this.isNew && !this.sessionId) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (this.isNew && !this.roomName) {
    this.roomName = `room_${this.sessionId}`;
  }
  
  // Calculate duration if session ended
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  next();
});

// Indexes
VideoConsultationSchema.index({ appointment: 1 });
VideoConsultationSchema.index({ 'participants.patient.userId': 1, scheduledTime: -1 });
VideoConsultationSchema.index({ 'participants.provider.userId': 1, scheduledTime: -1 });
VideoConsultationSchema.index({ status: 1, scheduledTime: 1 });

// Pre-find middleware to populate references
VideoConsultationSchema.pre(/^find/, function(next) {
  this.populate('appointment', 'date time type patient provider')
      .populate('participants.patient.userId', 'firstName lastName email')
      .populate('participants.provider.userId', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName');
  next();
});

export default mongoose.model('VideoConsultation', VideoConsultationSchema);
