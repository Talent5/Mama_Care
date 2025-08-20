import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { billingService, Invoice, InvoiceStats } from '../services';

interface BillingScreenProps {
  navigation: any;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ navigation }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, statsResponse] = await Promise.all([
        billingService.getInvoices({ limit: 20 }),
        billingService.getInvoiceStats()
      ]);
      
      if (invoicesResponse.success && invoicesResponse.data) {
        setInvoices(invoicesResponse.data.invoices);
      }
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      Alert.alert('Error', 'Failed to load billing information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice || !paymentAmount) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      if (amount <= 0 || amount > selectedInvoice.balance) {
        Alert.alert('Error', 'Invalid payment amount');
        return;
      }

      const response = await billingService.processPayment(selectedInvoice._id, {
        amount,
        method: paymentMethod,
        transactionId: `TXN_${Date.now()}`
      });

      if (response.success) {
        Alert.alert('Success', 'Payment processed successfully');
        setShowPaymentModal(false);
        setPaymentAmount('');
        setSelectedInvoice(null);
        loadData();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await billingService.sendInvoice(invoiceId);
      if (response.success) {
        Alert.alert('Success', 'Invoice sent successfully');
        loadData();
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      Alert.alert('Error', 'Failed to send invoice');
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    return billingService.getStatusColor(status);
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => setSelectedInvoice(item)}
    >
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.patientName}>
        {typeof item.patient === 'object' && item.patient.user ? 
          `${item.patient.user.firstName} ${item.patient.user.lastName}` : 
          'Patient'
        }
      </Text>
      
      <Text style={styles.invoiceDate}>
        Issued: {new Date(item.issueDate).toLocaleDateString()}
      </Text>
      
      <Text style={styles.dueDate}>
        Due: {new Date(item.dueDate).toLocaleDateString()}
      </Text>
      
      <View style={styles.amountContainer}>
        <Text style={styles.totalAmount}>
          {billingService.formatCurrency(item.total, item.currency)}
        </Text>
        {item.balance > 0 && (
          <Text style={styles.balanceAmount}>
            Balance: {billingService.formatCurrency(item.balance, item.currency)}
          </Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        {item.status === 'draft' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleSendInvoice(item._id)}
          >
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
        )}
        
        {['sent', 'viewed'].includes(item.status) && item.balance > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => {
              setSelectedInvoice(item);
              setShowPaymentModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Pay</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const StatsCard = ({ title, value, color, icon }: {
    title: string;
    value: string | number;
    color: string;
    icon: string;
  }) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing & Invoices</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        {/* Stats Section */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatsCard
                title="Total Revenue"
                value={billingService.formatCurrency(stats.totalRevenue)}
                color="#10B981"
                icon="trending-up"
              />
              <StatsCard
                title="Paid Invoices"
                value={stats.paidInvoices}
                color="#3B82F6"
                icon="checkmark-circle"
              />
              <StatsCard
                title="Pending"
                value={stats.pendingInvoices}
                color="#F59E0B"
                icon="time"
              />
              <StatsCard
                title="Overdue"
                value={stats.overdueInvoices}
                color="#EF4444"
                icon="alert-circle"
              />
            </View>
          </View>
        )}

        {/* Recent Invoices */}
        <View style={styles.invoicesSection}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <FlatList
            data={invoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Invoice Detail Modal */}
      <Modal
        visible={!!selectedInvoice && !showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invoice Details</Text>
            <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedInvoice && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.invoiceDetailHeader}>
                <Text style={styles.invoiceDetailNumber}>{selectedInvoice.invoiceNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInvoice.status) }]}>
                  <Text style={styles.statusText}>{selectedInvoice.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Patient</Text>
                <Text style={styles.detailValue}>
                  {typeof selectedInvoice.patient === 'object' && selectedInvoice.patient.user ? 
                    `${selectedInvoice.patient.user.firstName} ${selectedInvoice.patient.user.lastName}` : 
                    'Patient'
                  }
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Services</Text>
                {selectedInvoice.items.map((item, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Text style={styles.serviceDescription}>{item.description}</Text>
                    <Text style={styles.serviceAmount}>
                      {item.quantity} × {billingService.formatCurrency(item.unitPrice)} = {billingService.formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    {billingService.formatCurrency(selectedInvoice.subtotal)}
                  </Text>
                </View>
                {selectedInvoice.tax > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax</Text>
                    <Text style={styles.totalValue}>
                      {billingService.formatCurrency(selectedInvoice.tax)}
                    </Text>
                  </View>
                )}
                {selectedInvoice.discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Discount</Text>
                    <Text style={styles.totalValue}>
                      -{billingService.formatCurrency(selectedInvoice.discount)}
                    </Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total</Text>
                  <Text style={styles.grandTotalValue}>
                    {billingService.formatCurrency(selectedInvoice.total)}
                  </Text>
                </View>
                {selectedInvoice.paidAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Paid</Text>
                    <Text style={styles.totalValue}>
                      {billingService.formatCurrency(selectedInvoice.paidAmount)}
                    </Text>
                  </View>
                )}
                {selectedInvoice.balance > 0 && (
                  <View style={[styles.totalRow, styles.balanceRow]}>
                    <Text style={styles.balanceLabel}>Balance Due</Text>
                    <Text style={styles.balanceValue}>
                      {billingService.formatCurrency(selectedInvoice.balance)}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModal}>
            <Text style={styles.paymentModalTitle}>Process Payment</Text>
            
            <Text style={styles.paymentLabel}>
              Balance Due: {selectedInvoice && billingService.formatCurrency(selectedInvoice.balance)}
            </Text>
            
            <Text style={styles.paymentInputLabel}>Payment Amount</Text>
            <TextInput
              style={styles.paymentInput}
              placeholder="0.00"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.paymentInputLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {(['cash', 'card', 'mobile_money'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.paymentMethodTextActive
                  ]}>
                    {method.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.paymentModalButtons}>
              <TouchableOpacity
                style={[styles.paymentButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentButton, styles.processButton]}
                onPress={handleProcessPayment}
              >
                <Text style={styles.processButtonText}>Process</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#4ea674',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statsText: {
    marginLeft: 10
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statsTitle: {
    fontSize: 12,
    color: '#666'
  },
  invoicesSection: {
    padding: 20,
    backgroundColor: 'white'
  },
  invoiceCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  patientName: {
    fontSize: 16,
    color: '#4ea674',
    fontWeight: '600',
    marginBottom: 5
  },
  invoiceDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  amountContainer: {
    marginBottom: 15
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  balanceAmount: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 3
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  invoiceDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  invoiceDetailNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 16,
    color: '#333'
  },
  serviceItem: {
    marginBottom: 10
  },
  serviceDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3
  },
  serviceAmount: {
    fontSize: 14,
    color: '#666'
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  totalLabel: {
    fontSize: 16,
    color: '#666'
  },
  totalValue: {
    fontSize: 16,
    color: '#333'
  },
  grandTotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  balanceRow: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626'
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626'
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  paymentModal: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  paymentInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  paymentMethodButtonActive: {
    backgroundColor: '#4ea674',
    borderColor: '#4ea674'
  },
  paymentMethodText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666'
  },
  paymentMethodTextActive: {
    color: 'white'
  },
  paymentModalButtons: {
    flexDirection: 'row',
    gap: 15
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  processButton: {
    backgroundColor: '#4ea674'
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default BillingScreen;
