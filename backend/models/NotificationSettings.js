import mongoose from 'mongoose';

const NotificationSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: {
    highRiskAlerts: {
      type: Boolean,
      default: true
    },
    missedAppointments: {
      type: Boolean,
      default: true
    },
    overdueVisits: {
      type: Boolean,
      default: true
    },
    dailySummary: {
      type: Boolean,
      default: false
    },
    weeklyReports: {
      type: Boolean,
      default: false
    },
    medicationReminders: {
      type: Boolean,
      default: true
    },
    healthTips: {
      type: Boolean,
      default: true
    }
  },
  smsNotifications: {
    emergencyAlerts: {
      type: Boolean,
      default: true
    },
    appointmentReminders: {
      type: Boolean,
      default: true
    },
    systemMaintenance: {
      type: Boolean,
      default: false
    },
    criticalUpdates: {
      type: Boolean,
      default: true
    }
  },
  pushNotifications: {
    generalUpdates: {
      type: Boolean,
      default: true
    },
    healthReminders: {
      type: Boolean,
      default: true
    },
    socialInteractions: {
      type: Boolean,
      default: false
    },
    marketingMessages: {
      type: Boolean,
      default: false
    }
  },
  doNotDisturb: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String, // Format: "22:00"
      default: "22:00"
    },
    endTime: {
      type: String, // Format: "08:00"
      default: "08:00"
    },
    exceptions: {
      emergencyAlerts: {
        type: Boolean,
        default: true
      },
      criticalHealth: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for fast user lookups
NotificationSettingsSchema.index({ user: 1 });

// Method to get effective notification settings for a specific time
NotificationSettingsSchema.methods.getEffectiveSettings = function(currentTime) {
  const settings = this.toObject();
  
  // Check if we're in "Do Not Disturb" period
  if (this.doNotDisturb.enabled) {
    const now = currentTime || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const startTime = this.doNotDisturb.startTime.split(':');
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    
    const endTime = this.doNotDisturb.endTime.split(':');
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    
    let inDoNotDisturbPeriod = false;
    
    if (startMinutes <= endMinutes) {
      // Same day period (e.g., 14:00 to 18:00)
      inDoNotDisturbPeriod = currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
    } else {
      // Overnight period (e.g., 22:00 to 08:00)
      inDoNotDisturbPeriod = currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes;
    }
    
    if (inDoNotDisturbPeriod) {
      // During DND, only allow exceptions
      settings.emailNotifications = {
        ...settings.emailNotifications,
        highRiskAlerts: this.doNotDisturb.exceptions.criticalHealth,
        missedAppointments: false,
        overdueVisits: false,
        dailySummary: false,
        weeklyReports: false,
        medicationReminders: false,
        healthTips: false
      };
      
      settings.smsNotifications = {
        ...settings.smsNotifications,
        emergencyAlerts: this.doNotDisturb.exceptions.emergencyAlerts,
        appointmentReminders: false,
        systemMaintenance: false,
        criticalUpdates: this.doNotDisturb.exceptions.criticalHealth
      };
      
      settings.pushNotifications = {
        ...settings.pushNotifications,
        generalUpdates: false,
        healthReminders: false,
        socialInteractions: false,
        marketingMessages: false
      };
    }
  }
  
  return settings;
};

export default mongoose.model('NotificationSettings', NotificationSettingsSchema); 