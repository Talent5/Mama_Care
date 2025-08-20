import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  language: {
    type: String,
    enum: ['en', 'sn', 'nd'],
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'Africa/Harare'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  dateFormat: {
    type: String,
    enum: ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'],
    default: 'dd/MM/yyyy'
  },
  timeFormat: {
    type: String,
    enum: ['12h', '24h'],
    default: '24h'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  units: {
    weight: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    },
    height: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    },
    temperature: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    }
  },
  accessibility: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra-large'],
      default: 'medium'
    },
    highContrast: {
      type: Boolean,
      default: false
    },
    screenReader: {
      type: Boolean,
      default: false
    },
    reduceMotion: {
      type: Boolean,
      default: false
    }
  },
  privacy: {
    shareAnalytics: {
      type: Boolean,
      default: true
    },
    shareUsageData: {
      type: Boolean,
      default: false
    },
    dataRetentionPeriod: {
      type: Number, // in days
      default: 365
    }
  },
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    lastBackupDate: {
      type: Date
    }
  },
  lastExportDate: {
    type: Date
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for fast user lookups
SystemSettingsSchema.index({ user: 1 });

// Method to get user's locale information
SystemSettingsSchema.methods.getLocaleInfo = function() {
  return {
    language: this.language,
    dateFormat: this.dateFormat,
    timeFormat: this.timeFormat,
    timezone: this.timezone,
    currency: this.currency
  };
};

// Method to check if backup is due
SystemSettingsSchema.methods.isBackupDue = function() {
  if (!this.backup.autoBackup) return false;
  
  if (!this.backup.lastBackupDate) return true;
  
  const now = new Date();
  const lastBackup = new Date(this.backup.lastBackupDate);
  const diffTime = Math.abs(now - lastBackup);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  switch (this.backup.backupFrequency) {
    case 'daily':
      return diffDays >= 1;
    case 'weekly':
      return diffDays >= 7;
    case 'monthly':
      return diffDays >= 30;
    default:
      return false;
  }
};

export default mongoose.model('SystemSettings', SystemSettingsSchema); 