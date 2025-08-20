import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'login_success',
      'login_failure', 
      'logout',
      'password_change',
      'role_change',
      'data_access',
      'data_export',
      'suspicious_activity',
      'unauthorized_access',
      'account_locked',
      'account_unlocked',
      'security_scan',
      'system_change'
    ],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // IPv4 address
        const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        // IPv6 address (basic format)
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        // IPv6-mapped IPv4 address
        const ipv6MappedRegex = /^::ffff:(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        // Localhost variations
        const localhostRegex = /^(::1|localhost)$/;
        
        return ipv4Regex.test(v) || ipv6Regex.test(v) || ipv6MappedRegex.test(v) || localhostRegex.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  details: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
securityEventSchema.index({ type: 1, createdAt: -1 });
securityEventSchema.index({ userId: 1, createdAt: -1 });
securityEventSchema.index({ riskLevel: 1, resolved: 1 });
securityEventSchema.index({ ipAddress: 1 });
securityEventSchema.index({ createdAt: -1 });

// Static method to log security events
securityEventSchema.statics.logEvent = async function(eventData) {
  try {
    const event = new this(eventData);
    await event.save();
    
    // Auto-escalate critical events
    if (eventData.riskLevel === 'critical') {
      console.warn('CRITICAL SECURITY EVENT:', eventData);
      // TODO: Send real-time alerts, email notifications, etc.
    }
    
    return event;
  } catch (error) {
    console.error('Failed to log security event:', error);
    throw error;
  }
};

// Static method to get security metrics
securityEventSchema.statics.getSecurityMetrics = async function() {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      criticalEvents,
      weeklyEvents,
      loginFailures,
      suspiciousActivities
    ] = await Promise.all([
      this.countDocuments({}),
      this.countDocuments({ riskLevel: 'critical', resolved: false }),
      this.countDocuments({ createdAt: { $gte: lastWeek } }),
      this.countDocuments({ 
        type: 'login_failure', 
        createdAt: { $gte: lastMonth } 
      }),
      this.countDocuments({ 
        type: 'suspicious_activity', 
        createdAt: { $gte: lastMonth },
        resolved: false
      })
    ]);

    return {
      totalEvents,
      criticalAlerts: criticalEvents,
      weeklyEvents,
      failedLogins: loginFailures,
      suspiciousActivities,
      lastSecurityScan: new Date(), // TODO: Implement actual scan tracking
      activeSessions: 0 // TODO: Implement session tracking
    };
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    throw error;
  }
};

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
export default SecurityEvent;
