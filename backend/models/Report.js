import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
    required: [true, 'Report type is required']
  },
  facility: {
    type: String,
    required: [true, 'Facility is required'],
    trim: true
  },
  dateRange: {
    start: {
      type: Date,
      required: [true, 'Start date is required']
    },
    end: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  metrics: {
    totalPatients: Number,
    newPatients: Number,
    activePatients: Number,
    highRiskPatients: Number,
    appointments: {
      total: Number,
      completed: Number,
      missed: Number
    },
    averageVisitDuration: Number
  },
  summary: {
    type: String,
    required: [true, 'Report summary is required']
  },
  recommendations: [{
    type: String,
    trim: true
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

// Index for search optimization
ReportSchema.index({ facility: 1, type: 1, 'dateRange.start': -1 });
ReportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', ReportSchema); 