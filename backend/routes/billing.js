import express from 'express';
import Invoice from '../models/Invoice.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

// Create invoice
router.post('/', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin', 'reception')], async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      medicalRecordId,
      items,
      taxRate,
      discount,
      discountType,
      currency,
      insuranceInfo,
      notes,
      dueDate
    } = req.body;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const invoice = new Invoice({
      patient: patientId,
      appointment: appointmentId,
      medicalRecord: medicalRecordId,
      provider: appointment.provider,
      items,
      taxRate: taxRate || 0,
      discount: discount || 0,
      discountType: discountType || 'fixed',
      currency: currency || 'USD',
      insuranceInfo,
      notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user.id
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create invoice'
    });
  }
});

// Get invoice by ID
router.get('/:id', [auth], async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    const isPatient = invoice.patient.user.toString() === req.user.id;
    const isProvider = invoice.provider._id.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin', 'reception'].includes(req.user.role);
    
    if (!isPatient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update viewed date if patient is viewing for first time
    if (isPatient && !invoice.viewedDate) {
      invoice.viewedDate = new Date();
      await invoice.save();
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invoice'
    });
  }
});

// Get invoices with filters
router.get('/', [auth], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      patientId, 
      providerId,
      dateFrom, 
      dateTo,
      overdue 
    } = req.query;

    // Build query based on user role
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (patient) {
        query.patient = patient._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }
    } else if (['doctor', 'nurse', 'healthcare_provider'].includes(req.user.role) && !['admin', 'super_admin'].includes(req.user.role)) {
      query.provider = req.user.id;
    }

    // Apply additional filters
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (providerId) query.provider = providerId;
    
    if (dateFrom || dateTo) {
      query.issueDate = {};
      if (dateFrom) query.issueDate.$gte = new Date(dateFrom);
      if (dateTo) query.issueDate.$lte = new Date(dateTo);
    }

    if (overdue === 'true') {
      query.status = { $in: ['sent', 'viewed'] };
      query.dueDate = { $lt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invoices'
    });
  }
});

// Update invoice
router.put('/:id', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin', 'reception')], async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    const isCreator = invoice.createdBy.toString() === req.user.id;
    const isProvider = invoice.provider._id.toString() === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isCreator && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow editing paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit paid invoices'
      });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update invoice'
    });
  }
});

// Send invoice to patient
router.post('/:id/send', [auth, roleAuth('doctor', 'nurse', 'healthcare_provider', 'admin', 'reception')], async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    invoice.status = 'sent';
    invoice.sentDate = new Date();
    await invoice.save();

    // Here you would typically send an email/SMS notification to the patient
    // For now, we'll just update the status

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invoice'
    });
  }
});

// Process payment
router.post('/:id/payment', [auth], async (req, res) => {
  try {
    const { amount, method, transactionId, reference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    if (amount > invoice.balance) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds balance'
      });
    }

    // Add payment record
    const payment = {
      amount: parseFloat(amount),
      method,
      transactionId,
      reference,
      processedBy: req.user.id,
      status: 'completed'
    };

    invoice.payments.push(payment);
    await invoice.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        invoice,
        payment,
        newBalance: invoice.balance
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment'
    });
  }
});

// Get invoice statistics
router.get('/stats/dashboard', [auth, roleAuth('admin', 'super_admin', 'doctor', 'reception')], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.issueDate = {};
      if (dateFrom) dateFilter.issueDate.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.issueDate.$lte = new Date(dateTo);
    }

    const providerFilter = ['doctor', 'nurse', 'healthcare_provider'].includes(req.user.role) && !['admin', 'super_admin'].includes(req.user.role)
      ? { provider: req.user.id, ...dateFilter }
      : dateFilter;

    const [
      totalInvoices,
      totalRevenue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      revenueByMonth,
      topPaymentMethods
    ] = await Promise.all([
      Invoice.countDocuments({ ...providerFilter, isActive: true }),
      
      Invoice.aggregate([
        { $match: { ...providerFilter, isActive: true, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      Invoice.countDocuments({ ...providerFilter, isActive: true, status: 'paid' }),
      
      Invoice.countDocuments({ 
        ...providerFilter, 
        isActive: true, 
        status: { $in: ['draft', 'sent', 'viewed'] }
      }),
      
      Invoice.countDocuments({ 
        ...providerFilter, 
        isActive: true, 
        status: { $in: ['sent', 'viewed'] },
        dueDate: { $lt: new Date() }
      }),
      
      Invoice.aggregate([
        { $match: { ...providerFilter, isActive: true, status: 'paid' } },
        {
          $group: {
            _id: {
              year: { $year: '$issueDate' },
              month: { $month: '$issueDate' }
            },
            revenue: { $sum: '$total' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      
      Invoice.aggregate([
        { $match: { ...providerFilter, isActive: true } },
        { $unwind: '$payments' },
        { $match: { 'payments.status': 'completed' } },
        {
          $group: {
            _id: '$payments.method',
            total: { $sum: '$payments.amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        revenueByMonth,
        topPaymentMethods
      }
    });
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

// Cancel invoice
router.post('/:id/cancel', [auth, roleAuth('admin', 'super_admin', 'doctor', 'reception')], async (req, res) => {
  try {
    const { reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel paid invoice'
      });
    }

    invoice.status = 'cancelled';
    if (reason) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel invoice'
    });
  }
});

export default router;
