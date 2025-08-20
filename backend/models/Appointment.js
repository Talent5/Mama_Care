import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  healthcareProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Healthcare provider is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  duration: {
    type: Number, // in minutes
    default: 30,
    min: [15, 'Appointment duration must be at least 15 minutes'],
    max: [180, 'Appointment duration cannot exceed 180 minutes']
  },
  type: {
    type: String,
    enum: [
      'consultation',
      'checkup',
      'prenatal',
      'postnatal',
      'emergency',
      'follow_up',
      'vaccination',
      'ultrasound',
      'lab_test',
      'other'
    ],
    required: [true, 'Appointment type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  // Doctor approval fields
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  proposedDateTime: {
    date: { type: Date },
    time: { type: String }
  },
  doctorNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Doctor notes cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  symptoms: [{
    symptom: { type: String, required: true },
    severity: { 
      type: String, 
      enum: ['mild', 'moderate', 'severe'], 
      default: 'mild' 
    },
    duration: { type: String }, // e.g., "2 days", "1 week"
    notes: { type: String }
  }],
  vitals: {
    bloodPressure: {
      systolic: { type: Number, min: 70, max: 250 },
      diastolic: { type: Number, min: 40, max: 150 }
    },
    heartRate: { type: Number, min: 40, max: 200 }, // bpm
    temperature: { type: Number, min: 35, max: 45 }, // celsius
    weight: { type: Number, min: 1, max: 300 }, // kg
    height: { type: Number, min: 50, max: 250 }, // cm
    respiratoryRate: { type: Number, min: 10, max: 40 }, // breaths per minute
    oxygenSaturation: { type: Number, min: 70, max: 100 } // percentage
  },
  diagnosis: {
    primary: { type: String, trim: true },
    secondary: [{ type: String, trim: true }],
    differential: [{ type: String, trim: true }]
  },
  treatment: {
    prescriptions: [{
      medication: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      instructions: { type: String }
    }],
    procedures: [{
      name: { type: String, required: true },
      description: { type: String },
      performedBy: { type: String },
      date: { type: Date, default: Date.now }
    }],
    recommendations: [{ type: String }],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    referrals: [{
      specialist: { type: String },
      reason: { type: String },
      urgency: { 
        type: String, 
        enum: ['routine', 'urgent', 'emergency'], 
        default: 'routine' 
      }
    }]
  },
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    description: { type: String }
  }],
  reminder: {
    sent: { type: Boolean, default: false },
    sentDate: { type: Date },
    reminderType: { 
      type: String, 
      enum: ['email', 'sms', 'push'], 
      default: 'email' 
    }
  },
  remindersSent: {
    type: String,
    enum: ['24h', '1h', 'both'],
    default: null
  },
  pushRemindersSent: [{
    type: { type: String, enum: ['24h', '1h'] },
    sentAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (!this.appointmentDate || !this.appointmentTime) return null;
  const [hours, minutes] = this.appointmentTime.split(':');
  const datetime = new Date(this.appointmentDate);
  datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return datetime;
});

// Virtual for appointment end time
appointmentSchema.virtual('appointmentEndTime').get(function() {
  if (!this.appointmentDateTime || !this.duration) return null;
  const endTime = new Date(this.appointmentDateTime);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  return endTime;
});

// Indexes for optimization
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ healthcareProvider: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ type: 1 });
appointmentSchema.index({ priority: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Compound index for scheduling conflicts
appointmentSchema.index({ 
  healthcareProvider: 1, 
  appointmentDate: 1, 
  appointmentTime: 1 
});

// Populate related data when querying
appointmentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'patient',
    select: 'user currentPregnancy',
    populate: {
      path: 'user',
      select: 'firstName lastName email phone'
    }
  }).populate({
    path: 'healthcareProvider',
    select: 'firstName lastName email phone role'
  });
  next();
});

export default mongoose.model('Appointment', appointmentSchema);
