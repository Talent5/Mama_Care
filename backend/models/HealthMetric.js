import mongoose from 'mongoose';

const HealthMetricSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['water_intake', 'prenatal_vitamins', 'exercise', 'sleep', 'weight', 'blood_pressure'],
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

HealthMetricSchema.index({ patient: 1, recordedAt: -1 });

export default mongoose.model('HealthMetric', HealthMetricSchema);

