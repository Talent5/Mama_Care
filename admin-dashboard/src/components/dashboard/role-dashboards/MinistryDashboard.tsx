import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Building, 
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  RefreshCw
} from 'lucide-react';
import MetricCard from '../MetricCard';
import ChartCard from '../ChartCard';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { analyticsAPI } from '../../../services/api';
import type { DashboardStats } from '../../../types/api';

interface MinistryDashboardProps {
  widgets: string[];
  userName: string;
}

interface RegionalData {
  region: string;
  facilities: number;
  patients: number;
  compliance: number;
  status: string;
}

const MinistryDashboard: React.FC<MinistryDashboardProps> = ({ widgets }) => {
  const { data: dashboardData, loading, error, refetch } = useDashboardData('30d');
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchHealthMetrics = async () => {
      try {
        const response = await analyticsAPI.getHealthMetrics();
        if (response.success) {
          setHealthMetrics(response.data);
        }
      } catch (error) {
        console.error('Error fetching health metrics:', error);
      }
    };

    fetchHealthMetrics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        analyticsAPI.getHealthMetrics().then(response => {
          if (response.success) {
            setHealthMetrics(response.data);
          }
        })
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading || !dashboardData || !healthMetrics) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ministry dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading dashboard data: {error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Transform data for display
  const keyIndicators = [
    { 
      indicator: 'Maternal Mortality Rate', 
      value: healthMetrics.maternalMortality.toString() + '%', 
      change: -15.2, 
      status: 'improving' 
    },
    { 
      indicator: 'ANC Coverage', 
      value: healthMetrics.ancCoverage.toString() + '%', 
      change: 3.1, 
      status: 'improving' 
    },
    { 
      indicator: 'ANC Completion Rate', 
      value: healthMetrics.ancCompletionRate.toString() + '%', 
      change: 1.8, 
      status: 'stable' 
    },
    { 
      indicator: 'Skilled Birth Attendance', 
      value: healthMetrics.skilleBirthAttendance.toString() + '%', 
      change: 2.3, 
      status: 'improving' 
    }
  ];

  // Transform regional data
  const regionalData: RegionalData[] = dashboardData?.regionalIndicators?.map((region: { region: string; activePatients: number; completionRate: number }) => ({
    region: region.region,
    facilities: Math.round(region.activePatients / 100), // Estimate based on patient count
    patients: region.activePatients,
    compliance: region.completionRate,
    status: region.completionRate >= 90 ? 'excellent' :
            region.completionRate >= 80 ? 'good' :
            region.completionRate >= 70 ? 'fair' : 'poor'
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* National Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Healthcare Facilities"
          value={Math.round((dashboardData?.totalPatients || 0) / 100).toString()}
          change="2"
          changeType="positive"
          icon={Building}
        />
        <MetricCard
          title="Active Patients"
          value={(dashboardData?.activePatients || 0).toLocaleString()}
          change={Math.round(((dashboardData?.activePatients || 0) / (dashboardData?.totalPatients || 1)) * 100).toString()}
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="ANC Completion Rate"
          value={`${healthMetrics?.ancCompletionRate || 0}%`}
          change="1.8"
          changeType="positive"
          icon={CheckCircle}
        />
      </div>

      {/* Key Health Indicators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Key Health Indicators
            </h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyIndicators.map((indicator, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{indicator.indicator}</p>
                    <p className="text-2xl font-bold text-gray-900">{indicator.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className={`w-3 h-3 ${indicator.change > 0 ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-xs ${indicator.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {indicator.change > 0 ? '+' : ''}{indicator.change}%
                      </span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    indicator.status === 'improving' ? 'bg-green-400' : 
                    indicator.status === 'stable' ? 'bg-blue-400' : 'bg-orange-400'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Regional Performance
            </h3>
            <button className="text-sm text-green-600 hover:text-green-700">
              View Map
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                  <th className="pb-3">Region</th>
                  <th className="pb-3">Facilities</th>
                  <th className="pb-3">Active Patients</th>
                  <th className="pb-3">Compliance</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regionalData.map((region, index) => (
                  <tr key={index} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">{region.region}</td>
                    <td className="py-3 text-gray-600">{region.facilities}</td>
                    <td className="py-3 text-gray-600">{region.patients.toLocaleString()}</td>
                    <td className="py-3 text-gray-600">{region.compliance.toFixed(1)}%</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(region.status)}`}>
                        {region.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Patient Trends (Past 6 Months)"
          data={dashboardData?.monthlyTrends?.map((trend) => ({
            label: new Date(trend._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
            value: trend.count
          })) || []}
          type="line"
        />
        
        <ChartCard
          title="Risk Level Distribution"
          data={[
            { label: 'Low Risk', value: dashboardData?.riskDistribution?.low || 0 },
            { label: 'Medium Risk', value: dashboardData?.riskDistribution?.medium || 0 },
            { label: 'High Risk', value: dashboardData?.riskDistribution?.high || 0 }
          ]}
          type="doughnut"
        />
      </div>
    </div>
  );
};

export default MinistryDashboard;
