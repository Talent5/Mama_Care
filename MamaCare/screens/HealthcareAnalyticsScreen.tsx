import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  analyticsService, 
  medicalRecordService, 
  billingService, 
  telemedicineService,
  MedicalRecordStats,
  InvoiceStats,
  TelemedicineStats
} from '../services';

const { width } = Dimensions.get('window');

interface HealthcareAnalyticsScreenProps {
  navigation: any;
}

const HealthcareAnalyticsScreen: React.FC<HealthcareAnalyticsScreenProps> = ({ navigation }) => {
  const [medicalStats, setMedicalStats] = useState<MedicalRecordStats | null>(null);
  const [billingStats, setBillingStats] = useState<InvoiceStats | null>(null);
  const [telemedicineStats, setTelemedicineStats] = useState<TelemedicineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [medicalResponse, billingResponse, telemedicineResponse] = await Promise.all([
        medicalRecordService.getMedicalRecordStats(selectedPeriod),
        billingService.getInvoiceStats(selectedPeriod),
        telemedicineService.getTelemedicineStats(selectedPeriod)
      ]);
      
      if (medicalResponse.success && medicalResponse.data) {
        setMedicalStats(medicalResponse.data);
      }
      
      if (billingResponse.success && billingResponse.data) {
        setBillingStats(billingResponse.data);
      }
      
      if (telemedicineResponse.success && telemedicineResponse.data) {
        setTelemedicineStats(telemedicineResponse.data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    color, 
    icon, 
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    icon: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend.isPositive ? "trending-up" : "trending-down"} 
              size={16} 
              color={trend.isPositive ? "#10B981" : "#EF4444"} 
            />
            <Text style={[styles.trendText, { 
              color: trend.isPositive ? "#10B981" : "#EF4444" 
            }]}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#4ea674" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const ChartCard = ({ title, data, type }: {
    title: string;
    data: any[];
    type: 'bar' | 'pie' | 'line';
  }) => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContainer}>
        {type === 'bar' && (
          <View style={styles.barChart}>
            {data.map((item, index) => (
              <View key={index} style={styles.barItem}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.max((item.count / Math.max(...data.map(d => d.count))) * 80, 5),
                      backgroundColor: `hsl(${(index * 50) % 360}, 70%, 50%)`
                    }
                  ]} 
                />
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item._id || item.name}
                </Text>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
        
        {type === 'pie' && (
          <View style={styles.pieChart}>
            {data.map((item, index) => (
              <View key={index} style={styles.pieItem}>
                <View 
                  style={[
                    styles.pieIndicator, 
                    { backgroundColor: `hsl(${(index * 50) % 360}, 70%, 50%)` }
                  ]} 
                />
                <Text style={styles.pieLabel}>{item._id}: {item.count}</Text>
              </View>
            ))}
          </View>
        )}
        
        {type === 'line' && (
          <View style={styles.lineChart}>
            <Text style={styles.chartPlaceholder}>Line Chart Data</Text>
            {data.map((item, index) => (
              <Text key={index} style={styles.lineItem}>
                {item._id?.month || index + 1}: {formatCurrency(item.revenue || item.total || 0)}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Healthcare Analytics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadAnalyticsData}>
          <Ionicons name="refresh" size={24} color="#4ea674" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAnalyticsData} />
        }
      >
        {/* Medical Records Analytics */}
        <SectionHeader title="Medical Records" icon="medical" />
        {medicalStats && (
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Records"
              value={medicalStats.totalRecords}
              color="#3B82F6"
              icon="documents"
              trend={{ value: 12, isPositive: true }}
            />
            <MetricCard
              title="Recent Records"
              value={medicalStats.recentRecords.length}
              subtitle="Last 7 days"
              color="#10B981"
              icon="add-circle"
            />
          </View>
        )}

        {/* Records by Type Chart */}
        {medicalStats?.recordsByType && medicalStats.recordsByType.length > 0 && (
          <ChartCard
            title="Records by Visit Type"
            data={medicalStats.recordsByType}
            type="bar"
          />
        )}

        {/* Common Diagnoses */}
        {medicalStats?.commonDiagnoses && medicalStats.commonDiagnoses.length > 0 && (
          <ChartCard
            title="Most Common Diagnoses"
            data={medicalStats.commonDiagnoses.slice(0, 5)}
            type="pie"
          />
        )}

        {/* Billing Analytics */}
        <SectionHeader title="Billing & Revenue" icon="card" />
        {billingStats && (
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(billingStats.totalRevenue)}
              color="#10B981"
              icon="trending-up"
              trend={{ value: 8, isPositive: true }}
            />
            <MetricCard
              title="Paid Invoices"
              value={billingStats.paidInvoices}
              subtitle={`of ${billingStats.totalInvoices} total`}
              color="#3B82F6"
              icon="checkmark-circle"
            />
            <MetricCard
              title="Pending Payments"
              value={billingStats.pendingInvoices}
              color="#F59E0B"
              icon="time"
            />
            <MetricCard
              title="Overdue Invoices"
              value={billingStats.overdueInvoices}
              color="#EF4444"
              icon="alert-circle"
            />
          </View>
        )}

        {/* Revenue Trends */}
        {billingStats?.revenueByMonth && billingStats.revenueByMonth.length > 0 && (
          <ChartCard
            title="Revenue Trends"
            data={billingStats.revenueByMonth}
            type="line"
          />
        )}

        {/* Payment Methods */}
        {billingStats?.topPaymentMethods && billingStats.topPaymentMethods.length > 0 && (
          <ChartCard
            title="Payment Methods"
            data={billingStats.topPaymentMethods}
            type="pie"
          />
        )}

        {/* Telemedicine Analytics */}
        <SectionHeader title="Telemedicine" icon="videocam" />
        {telemedicineStats && (
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Sessions"
              value={telemedicineStats.totalSessions}
              color="#8B5CF6"
              icon="videocam"
              trend={{ value: 25, isPositive: true }}
            />
            <MetricCard
              title="Active Sessions"
              value={telemedicineStats.activeSessions}
              subtitle="Right now"
              color="#10B981"
              icon="radio-button-on"
            />
            <MetricCard
              title="Avg Duration"
              value={`${Math.round(telemedicineStats.averageDuration)}m`}
              color="#F59E0B"
              icon="time"
            />
            <MetricCard
              title="Today's Sessions"
              value={telemedicineStats.sessionsToday}
              color="#3B82F6"
              icon="calendar"
            />
          </View>
        )}

        {/* Patient Satisfaction */}
        {telemedicineStats?.feedback && (
          <View style={styles.satisfactionCard}>
            <Text style={styles.satisfactionTitle}>Patient Satisfaction</Text>
            <View style={styles.satisfactionMetrics}>
              <View style={styles.satisfactionItem}>
                <Text style={styles.satisfactionLabel}>Patient Rating</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingValue}>
                    {telemedicineStats.feedback.avgPatientRating.toFixed(1)}
                  </Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= telemedicineStats.feedback.avgPatientRating ? "star" : "star-outline"}
                        size={16}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.satisfactionItem}>
                <Text style={styles.satisfactionLabel}>Technical Quality</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingValue}>
                    {telemedicineStats.feedback.avgTechnicalRating.toFixed(1)}
                  </Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= telemedicineStats.feedback.avgTechnicalRating ? "star" : "star-outline"}
                        size={16}
                        color="#3B82F6"
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.feedbackCount}>
              Based on {telemedicineStats.feedback.totalFeedbacks} reviews
            </Text>
          </View>
        )}

        {/* Key Performance Indicators */}
        <SectionHeader title="Key Performance Indicators" icon="analytics" />
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Healthcare Efficiency</Text>
            <Text style={styles.kpiValue}>
              {medicalStats && billingStats ? 
                Math.round((billingStats.paidInvoices / billingStats.totalInvoices) * 100) : 0}%
            </Text>
            <Text style={styles.kpiSubtitle}>Payment Success Rate</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Digital Adoption</Text>
            <Text style={styles.kpiValue}>
              {telemedicineStats && medicalStats ? 
                Math.round((telemedicineStats.totalSessions / medicalStats.totalRecords) * 100) : 0}%
            </Text>
            <Text style={styles.kpiSubtitle}>Telemedicine Usage</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  refreshButton: {
    padding: 5
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2
  },
  periodButtonActive: {
    backgroundColor: '#4ea674'
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666'
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: (width - 50) / 2,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  chartCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  chartContainer: {
    minHeight: 120
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2
  },
  bar: {
    width: '80%',
    borderRadius: 2,
    marginBottom: 5
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333'
  },
  pieChart: {
    flexDirection: 'column'
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  pieIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10
  },
  pieLabel: {
    fontSize: 14,
    color: '#333'
  },
  lineChart: {
    paddingVertical: 10
  },
  chartPlaceholder: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10
  },
  lineItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3
  },
  satisfactionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  satisfactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  satisfactionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  satisfactionItem: {
    alignItems: 'center'
  },
  satisfactionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  ratingContainer: {
    alignItems: 'center'
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  stars: {
    flexDirection: 'row'
  },
  feedbackCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  kpiCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: (width - 50) / 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center'
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center'
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ea674',
    marginBottom: 5
  },
  kpiSubtitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  },
  bottomPadding: {
    height: 20
  }
});

export default HealthcareAnalyticsScreen;
