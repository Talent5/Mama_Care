import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema(
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
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true,
      index: true,
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

SymptomLogSchema.index({ patient: 1, recordedAt: -1 });

export default mongoose.model('SymptomLog', SymptomLogSchema);

