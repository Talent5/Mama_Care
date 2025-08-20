import mongoose from 'mongoose';

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  visitType: {
    type: String,
    enum: ['consultation', 'emergency', 'follow_up', 'routine_checkup', 'prenatal', 'postnatal', 'vaccination', 'lab_test'],
    required: true
  },
  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },
  historyOfPresentIllness: {
    type: String,
    trim: true
  },
  physicalExamination: {
    vitals: {
      bloodPressure: {
        systolic: { type: Number, min: 70, max: 250 },
        diastolic: { type: Number, min: 40, max: 150 }
      },
      heartRate: { type: Number, min: 40, max: 200 },
      temperature: { type: Number, min: 35, max: 45 },
      respiratoryRate: { type: Number, min: 10, max: 40 },
      oxygenSaturation: { type: Number, min: 70, max: 100 },
      weight: { type: Number, min: 1, max: 300 },
      height: { type: Number, min: 50, max: 250 },
      bmi: { type: Number }
    },
    generalAppearance: {
      type: String,
      trim: true
    },
    systemsReview: {
      cardiovascular: String,
      respiratory: String,
      gastrointestinal: String,
      genitourinary: String,
      neurological: String,
      musculoskeletal: String,
      integumentary: String,
      psychiatric: String
    }
  },
  diagnosis: {
    primary: {
      type: String,
      required: true,
      trim: true
    },
    secondary: [{
      type: String,
      trim: true
    }],
    icd10Codes: [{
      code: String,
      description: String
    }]
  },
  treatment: {
    medications: [{
      name: { type: String, required: true },
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    procedures: [{
      name: String,
      description: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: { type: Date, default: Date.now }
    }],
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    timeframe: String,
    instructions: String,
    scheduledDate: Date,
    appointmentType: {
      type: String,
      enum: ['consultation', 'checkup', 'lab_test', 'imaging', 'specialist_referral']
    }
  },
  attachments: [{
    type: {
      type: String,
      enum: ['lab_result', 'image', 'document', 'prescription', 'referral'],
      required: true
    },
    filename: String,
    originalName: String,
    url: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Pregnancy specific fields
  pregnancyDetails: {
    gestationalAge: Number,
    fundalHeight: Number,
    fetalHeartRate: Number,
    fetalMovements: String,
    complications: [String],
    recommendations: [String]
  },
  // Laboratory Results
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    unit: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical', 'pending']
    },
    performedDate: Date,
    reportedDate: Date,
    laboratory: String
  }],
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'amended'],
    default: 'draft'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for search optimization
MedicalRecordSchema.index({ patient: 1, visitDate: -1 });
MedicalRecordSchema.index({ provider: 1, visitDate: -1 });
MedicalRecordSchema.index({ appointment: 1 });
MedicalRecordSchema.index({ visitType: 1, visitDate: -1 });

// Pre-save middleware to calculate BMI
MedicalRecordSchema.pre('save', function(next) {
  if (this.physicalExamination?.vitals?.weight && this.physicalExamination?.vitals?.height) {
    const heightInMeters = this.physicalExamination.vitals.height / 100;
    this.physicalExamination.vitals.bmi = this.physicalExamination.vitals.weight / (heightInMeters * heightInMeters);
  }
  next();
});

// Pre-find middleware to populate references
MedicalRecordSchema.pre(/^find/, function(next) {
  this.populate('patient', 'user dateOfBirth gender')
      .populate('provider', 'firstName lastName email role')
      .populate('appointment', 'date time type status');
  next();
});

export default mongoose.model('MedicalRecord', MedicalRecordSchema);
