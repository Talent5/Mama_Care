import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter,
  MapPin,
  Users,
  Heart,
  AlertTriangle
} from 'lucide-react';
import MetricCard from '../dashboard/MetricCard';
import ChartCard from '../dashboard/ChartCard';
import { analyticsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const AnalyticsReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'harare' | 'bulawayo' | 'gweru'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedRegion]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required analytics data in parallel
      const [patientStats, appointmentStats] = await Promise.all([
        analyticsAPI.getPatientStats({ period: selectedPeriod, region: selectedRegion }),
        analyticsAPI.getAppointmentStats({ period: selectedPeriod, region: selectedRegion })
      ]);

      if (patientStats.success && appointmentStats.success) {
        setData({
          patients: patientStats.data,
          appointments: appointmentStats.data
        });
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await analyticsAPI.exportReport('analytics', {
        period: selectedPeriod,
        region: selectedRegion
      });
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${selectedPeriod}-${selectedRegion}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Failed to generate report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
        <button
          onClick={fetchAnalyticsData}
          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = data ? [
    {
      title: 'ANC Completion Rate',
      value: `${data.patients?.ancCompletionRate || 0}%`,
      change: `${(data.patients?.ancCompletionRateChange || 0) > 0 ? '+' : ''}${data.patients?.ancCompletionRateChange || 0}% from last period`,
      changeType: (data.patients?.ancCompletionRateChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Heart,
      trend: data.patients?.ancCompletionTrend || []
    },
    {
      title: 'High-Risk Detection',
      value: `${(((data.patients?.riskDistribution?.high || 0) / (data.patients?.totalPatients || 1)) * 100).toFixed(1)}%`,
      change: `${(data.patients?.highRiskChange || 0) > 0 ? '+' : ''}${data.patients?.highRiskChange || 0}% from last period`,
      changeType: (data.patients?.highRiskChange || 0) > 0 ? 'neutral' as const : 'positive' as const,
      icon: AlertTriangle,
      trend: data.patients?.riskTrend || []
    },
    {
      title: 'Appointment Adherence',
      value: `${(((data.appointments?.completedAppointments || 0) / (data.appointments?.totalAppointments || 1)) * 100).toFixed(1)}%`,
      change: `${(data.appointments?.adherenceChange || 0) > 0 ? '+' : ''}${data.appointments?.adherenceChange || 0}% from last period`,
      changeType: (data.appointments?.adherenceChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Calendar,
      trend: data.appointments?.adherenceTrend || []
    },
    {
      title: 'Active Patients',
      value: (data.patients?.activePatients || 0).toString(),
      change: `${(data.patients?.activePatientChange || 0) > 0 ? '+' : ''}${data.patients?.activePatientChange || 0} from last period`,
      changeType: (data.patients?.activePatientChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Users,
      trend: data.patients?.activeTrend || []
    }
  ] : [];

  const riskDistribution = data ? [
    { label: 'Low Risk', value: data.patients?.riskDistribution?.low || 0, color: '#4ea674' },
    { label: 'Medium Risk', value: data.patients?.riskDistribution?.medium || 0, color: '#f59e0b' },
    { label: 'High Risk', value: data.patients?.riskDistribution?.high || 0, color: '#ef4444' }
  ] : [];

  const regionalData = data?.patients?.regionalStats || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights into maternal health outcomes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="7d">Last Week</option>
            <option value="30d">Last Month</option>
            <option value="90d">Last Quarter</option>
            <option value="1y">Last Year</option>
          </select>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="all">All Regions</option>
            <option value="harare">Harare</option>
            <option value="bulawayo">Bulawayo</option>
            <option value="gweru">Gweru</option>
          </select>
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: '#4ea674' }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Risk Assessment Distribution"
          data={riskDistribution}
          type="doughnut"
        />
        <ChartCard
          title="Regional Performance"
          data={regionalData}
          type="bar"
        />
      </div>
    </div>
  );
};

export default AnalyticsReports;