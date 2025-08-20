import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['health_metric', 'symptom_log', 'appointment_action', 'emergency_call', 'app_usage', 'medication', 'reading'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    value: {
      type: Number,
    },
    unit: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ patient: 1, timestamp: -1 });

export default mongoose.model('ActivityLog', ActivityLogSchema);

