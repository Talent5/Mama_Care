import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
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
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    serviceType: {
      type: String,
      enum: ['consultation', 'procedure', 'medication', 'test', 'imaging', 'vaccination', 'other'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    cptCode: String, // Current Procedural Terminology code
    icd10Code: String // International Classification of Diseases code
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'insurance', 'credit'],
    default: 'cash'
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    coveragePercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    copayAmount: Number,
    deductibleAmount: Number,
    preAuthorizationCode: String,
    claimNumber: String
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'insurance'],
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    transactionId: String,
    reference: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed'
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  notes: String,
  termsAndConditions: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentDate: Date,
  viewedDate: Date,
  paidDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    
    if (this.taxRate) {
      this.tax = this.subtotal * this.taxRate;
    }
    
    let discountAmount = 0;
    if (this.discount > 0) {
      if (this.discountType === 'percentage') {
        discountAmount = this.subtotal * (this.discount / 100);
      } else {
        discountAmount = this.discount;
      }
    }
    
    this.total = this.subtotal + this.tax - discountAmount;
    this.balance = this.total - this.paidAmount;
  }
  
  // Set due date if not provided (default 30 days)
  if (this.isNew && !this.dueDate) {
    this.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Calculate item totals before saving
InvoiceSchema.pre('save', function(next) {
  if (this.items) {
    this.items.forEach(item => {
      item.total = item.quantity * item.unitPrice;
    });
  }
  next();
});

// Update status based on payments
InvoiceSchema.pre('save', function(next) {
  if (this.payments && this.payments.length > 0) {
    this.paidAmount = this.payments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    this.balance = this.total - this.paidAmount;
    
    if (this.balance <= 0) {
      this.status = 'paid';
      if (!this.paidDate) {
        this.paidDate = new Date();
      }
    } else if (this.paidAmount > 0) {
      this.status = 'partially_paid';
    }
  }
  
  // Check for overdue status
  if (this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
});

// Indexes
InvoiceSchema.index({ patient: 1, issueDate: -1 });
InvoiceSchema.index({ provider: 1, issueDate: -1 });
InvoiceSchema.index({ appointment: 1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });

// Pre-find middleware to populate references
InvoiceSchema.pre(/^find/, function(next) {
  this.populate('patient', 'user dateOfBirth gender')
      .populate('provider', 'firstName lastName email')
      .populate('appointment', 'date time type')
      .populate('createdBy', 'firstName lastName');
  next();
});

export default mongoose.model('Invoice', InvoiceSchema);
