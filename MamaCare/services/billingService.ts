import { apiClient, ApiResponse } from '../config/api';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  patient: string | any;
  appointment: string | any;
  medicalRecord?: string | any;
  provider: string | any;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  items: Array<{
    description: string;
    serviceType: 'consultation' | 'procedure' | 'medication' | 'test' | 'imaging' | 'vaccination' | 'other';
    quantity: number;
    unitPrice: number;
    total: number;
    cptCode?: string;
    icd10Code?: string;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  total: number;
  currency: string;
  paymentMethod?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'insurance' | 'credit';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    coveragePercentage: number;
    copayAmount?: number;
    deductibleAmount?: number;
    preAuthorizationCode?: string;
    claimNumber?: string;
  };
  payments: Array<{
    amount: number;
    method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'insurance';
    date: string;
    transactionId?: string;
    reference?: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
  }>;
  paidAmount: number;
  balance: number;
  notes?: string;
  termsAndConditions?: string;
  sentDate?: string;
  viewedDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  patientId: string;
  appointmentId: string;
  medicalRecordId?: string;
  items: Array<{
    description: string;
    serviceType: Invoice['items'][0]['serviceType'];
    quantity: number;
    unitPrice: number;
    cptCode?: string;
    icd10Code?: string;
  }>;
  taxRate?: number;
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  currency?: string;
  insuranceInfo?: Invoice['insuranceInfo'];
  notes?: string;
  dueDate?: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: Invoice['status'];
  patientId?: string;
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}

export interface PaginatedInvoices {
  invoices: Invoice[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface PaymentData {
  amount: number;
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'insurance';
  transactionId?: string;
  reference?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenueByMonth: Array<{
    _id: { year: number; month: number };
    revenue: number;
    count: number;
  }>;
  topPaymentMethods: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
}

class BillingService {
  async createInvoice(invoiceData: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    try {
      return await apiClient.post<Invoice>('/billing', invoiceData);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    try {
      return await apiClient.get<Invoice>(`/billing/${id}`);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      throw error;
    }
  }

  async getInvoices(filters?: InvoiceFilters): Promise<ApiResponse<PaginatedInvoices>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/billing${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedInvoices>(endpoint);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, updateData: Partial<CreateInvoiceData>): Promise<ApiResponse<Invoice>> {
    try {
      return await apiClient.put<Invoice>(`/billing/${id}`, updateData);
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  }

  async sendInvoice(id: string): Promise<ApiResponse<Invoice>> {
    try {
      return await apiClient.post<Invoice>(`/billing/${id}/send`);
    } catch (error) {
      console.error('Failed to send invoice:', error);
      throw error;
    }
  }

  async processPayment(id: string, paymentData: PaymentData): Promise<ApiResponse<{
    invoice: Invoice;
    payment: any;
    newBalance: number;
  }>> {
    try {
      return await apiClient.post(`/billing/${id}/payment`, paymentData);
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }

  async cancelInvoice(id: string, reason?: string): Promise<ApiResponse<Invoice>> {
    try {
      return await apiClient.post<Invoice>(`/billing/${id}/cancel`, { reason });
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      throw error;
    }
  }

  async getInvoiceStats(period?: string): Promise<ApiResponse<InvoiceStats>> {
    try {
      const queryParams = period ? `?period=${period}` : '';
      return await apiClient.get<InvoiceStats>(`/billing/stats/dashboard${queryParams}`);
    } catch (error) {
      console.error('Failed to fetch invoice statistics:', error);
      throw error;
    }
  }

  // Helper methods for different invoice types
  async createFromAppointment(appointmentId: string, items: CreateInvoiceData['items'], options?: {
    medicalRecordId?: string;
    insuranceInfo?: Invoice['insuranceInfo'];
    notes?: string;
    dueDate?: string;
  }): Promise<ApiResponse<Invoice>> {
    try {
      // You would typically fetch appointment details to get patientId
      // For now, this is a placeholder that would need appointment service integration
      const invoiceData: CreateInvoiceData = {
        patientId: '', // This would be fetched from appointment
        appointmentId,
        items,
        ...options
      };
      
      return await this.createInvoice(invoiceData);
    } catch (error) {
      console.error('Failed to create invoice from appointment:', error);
      throw error;
    }
  }

  // Pre-defined service items for common procedures
  getCommonServiceItems(): Array<Omit<CreateInvoiceData['items'][0], 'quantity' | 'unitPrice'>> {
    return [
      {
        description: 'General Consultation',
        serviceType: 'consultation',
        cptCode: '99213'
      },
      {
        description: 'Prenatal Checkup',
        serviceType: 'consultation',
        cptCode: '99213'
      },
      {
        description: 'Vaccination - DPT',
        serviceType: 'vaccination',
        cptCode: '90700'
      },
      {
        description: 'Blood Test - Complete Blood Count',
        serviceType: 'test',
        cptCode: '85025'
      },
      {
        description: 'Ultrasound Examination',
        serviceType: 'imaging',
        cptCode: '76700'
      },
      {
        description: 'Emergency Consultation',
        serviceType: 'consultation',
        cptCode: '99282'
      }
    ];
  }

  // Calculate totals for invoice preview
  calculateInvoiceTotals(items: CreateInvoiceData['items'], taxRate: number = 0, discount: number = 0, discountType: 'fixed' | 'percentage' = 'fixed'): {
    subtotal: number;
    tax: number;
    discountAmount: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * taxRate;
    
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discount / 100);
      } else {
        discountAmount = discount;
      }
    }
    
    const total = subtotal + tax - discountAmount;
    
    return {
      subtotal,
      tax,
      discountAmount,
      total
    };
  }

  // Format currency for display
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Get payment status color for UI
  getStatusColor(status: Invoice['status']): string {
    const colors = {
      draft: '#6B7280',
      sent: '#3B82F6',
      viewed: '#8B5CF6',
      paid: '#10B981',
      overdue: '#EF4444',
      cancelled: '#6B7280',
      refunded: '#F59E0B'
    };
    return colors[status] || '#6B7280';
  }
}

export default new BillingService();
