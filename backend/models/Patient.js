import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Patient gender is required']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Patient address is required'],
    trim: true
  },
  facility: {
    type: String,
    required: [true, 'Facility is required'],
    trim: true
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    trim: true
  },
  currentPregnancy: {
    isPregnant: {
      type: Boolean,
      default: false
    },
    gestationalAge: {
      type: Number,
      min: 0,
      max: 45
    },
    currentWeek: {
      type: Number,
      min: 1,
      max: 42,
      default: 1
    },
    estimatedDueDate: {
      type: Date
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low'
    },
    condition: {
      type: String,
      trim: true
    },
    symptoms: [{
      type: String,
      trim: true
    }]
  },
  medicalHistory: [{
    type: String,
    trim: true
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  vitals: {
    bloodPressure: {
      systolic: { type: Number, min: 70, max: 250 },
      diastolic: { type: Number, min: 40, max: 150 }
    },
    bloodSugar: { type: Number, min: 30, max: 500 },
    temperature: { type: Number, min: 35, max: 45 },
    weight: { type: Number, min: 1, max: 300 },
    height: { type: Number, min: 50, max: 250 },
    bmi: { type: Number }
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    }
  },
  lastVisit: {
    type: Date
  },
  nextAppointment: {
    type: Date
  },
  ancVisits: {
    type: Number,
    default: 0,
    min: 0,
    max: 8
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'High Risk', 'Deceased'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Doctor assignment fields
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignmentDate: {
    type: Date
  },
  assignmentReason: {
    type: String,
    trim: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search optimization
PatientSchema.index({ 'user': 1 });
PatientSchema.index({ facility: 1, status: 1 });
PatientSchema.index({ createdAt: -1 });
PatientSchema.index({ 'currentPregnancy.riskLevel': 1 });
PatientSchema.index({ 'currentPregnancy.isPregnant': 1 });

// Virtual for full name
PatientSchema.virtual('fullName').get(function() {
  return this.user ? `${this.user.firstName} ${this.user.lastName}` : 'Unknown Patient';
});

// Pre-save middleware to calculate BMI
PatientSchema.pre('save', function(next) {
  if (this.vitals?.weight && this.vitals?.height) {
    const heightInMeters = this.vitals.height / 100;
    this.vitals.bmi = this.vitals.weight / (heightInMeters * heightInMeters);
  }
  next();
});

// Pre-find middleware to populate user
PatientSchema.pre(/^find/, function(next) {
  this.populate('user', 'firstName lastName email phone avatar');
  next();
});

export default mongoose.model('Patient', PatientSchema);
