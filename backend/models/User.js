import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['system_admin', 'doctor', 'nurse', 'ministry_official', 'healthcare_provider', 'patient'],
    default: 'patient'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  facility: {
    type: String,
    trim: true,
    maxlength: [100, 'Facility name cannot exceed 100 characters']
  },
  region: {
    type: String,
    trim: true,
    maxlength: [100, 'Region name cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  specialization: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // New fields for settings
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  activeSessions: [{
    deviceId: String,
    lastActive: Date,
    ipAddress: String,
    userAgent: String
  }],
  photoUrl: {
    type: String,
    default: null
  },
  preferredLanguage: {
    type: String,
    enum: ['English', 'Shona', 'Ndebele'],
    default: 'English'
  },
  timezone: {
    type: String,
    default: 'Africa/Harare'
  },
  pushToken: {
    type: String,
    default: null
  },
  pushTokenUpdatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for search optimization
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Add session
userSchema.methods.addSession = function(sessionData) {
  this.activeSessions.push(sessionData);
  return this.save({ validateBeforeSave: false });
};

// Remove session
userSchema.methods.removeSession = function(deviceId) {
  this.activeSessions = this.activeSessions.filter(session => session.deviceId !== deviceId);
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model('User', userSchema);
