import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['high_risk', 'missed_appointment', 'overdue_visit', 'emergency'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'warning', 'info'],
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
alertSchema.index({ createdAt: -1 });
alertSchema.index({ patientId: 1, resolved: 1 });
alertSchema.index({ type: 1, severity: 1, resolved: 1 });

// Static method to create different types of alerts
alertSchema.statics.createHighRiskAlert = async function(patientId, patientName, details) {
  return this.create({
    type: 'high_risk',
    severity: 'critical',
    message: `High-risk patient ${patientName} requires immediate attention - ${details}`,
    patientId,
    patientName,
    metadata: { details }
  });
};

alertSchema.statics.createMissedAppointmentAlert = async function(patientId, patientName, appointmentDate) {
  return this.create({
    type: 'missed_appointment',
    severity: 'warning',
    message: `Patient ${patientName} missed scheduled ANC appointment`,
    patientId,
    patientName,
    metadata: { appointmentDate }
  });
};

alertSchema.statics.createOverdueVisitAlert = async function(patientId, patientName, daysPastDue) {
  return this.create({
    type: 'overdue_visit',
    severity: 'warning',
    message: `Patient ${patientName} is overdue for ANC visit by ${daysPastDue} days`,
    patientId,
    patientName,
    metadata: { daysPastDue }
  });
};

alertSchema.statics.createEmergencyAlert = async function(patientId, patientName, emergency) {
  return this.create({
    type: 'emergency',
    severity: 'critical',
    message: `Emergency: Patient ${patientName} experiencing ${emergency}`,
    patientId,
    patientName,
    metadata: { emergency }
  });
};

// Instance method to resolve alert
alertSchema.methods.resolve = async function(resolvedBy, notes) {
  this.resolved = true;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Static method to get alert statistics
alertSchema.statics.getAlertStats = async function() {
  const [stats] = await this.aggregate([
    {
      $facet: {
        totalUnresolved: [
          { $match: { resolved: false } },
          { $count: "count" }
        ],
        critical: [
          { $match: { resolved: false, severity: 'critical' } },
          { $count: "count" }
        ],
        warning: [
          { $match: { resolved: false, severity: 'warning' } },
          { $count: "count" }
        ],
        info: [
          { $match: { resolved: false, severity: 'info' } },
          { $count: "count" }
        ],
        overdueVisits: [
          { $match: { resolved: false, type: 'overdue_visit' } },
          { $count: "count" }
        ],
        resolved: [
          { $match: { resolved: true } },
          { $count: "count" }
        ],
        byType: [
          { $match: { resolved: false } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 }
            }
          }
        ],
        bySeverity: [
          { $match: { resolved: false } },
          {
            $group: {
              _id: "$severity",
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  return {
    totalUnresolved: stats.totalUnresolved[0]?.count || 0,
    critical: stats.critical[0]?.count || 0,
    warning: stats.warning[0]?.count || 0,
    info: stats.info[0]?.count || 0,
    overdueVisits: stats.overdueVisits[0]?.count || 0,
    resolved: stats.resolved[0]?.count || 0,
    byType: stats.byType,
    bySeverity: stats.bySeverity
  };
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
