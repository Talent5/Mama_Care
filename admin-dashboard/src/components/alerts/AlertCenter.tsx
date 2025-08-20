import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  User, 
  CheckCircle,
  Filter,
  Search,
  Loader
} from 'lucide-react';
import { AlertData } from '../../types/dashboard';
import { alertsAPI, patientsAPI } from '../../services/api';
import PatientDetailsModal from '../patients/PatientDetailsModal';

const AlertCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUnresolved: 0,
    critical: 0,
    warning: 0,
    info: 0,
    overdueVisits: 0,
    resolved: 0
  });
  
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [filterType, setFilterType] = useState<'all' | 'high_risk' | 'missed_appointment' | 'overdue_visit' | 'emergency'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Fetch alerts and stats
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = {
        search: searchTerm || undefined,
        type: filterType !== 'all' ? filterType : undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        limit: '50' // Fetch more alerts for better filtering
      };

      // Fetch alerts and stats in parallel
      const [alertsResponse, statsResponse] = await Promise.all([
        alertsAPI.getAlerts(filters),
        alertsAPI.getAlertStats()
      ]);

      if (alertsResponse.success && alertsResponse.data) {
        setAlerts(alertsResponse.data.alerts || []);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType, filterSeverity]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await alertsAPI.resolveAlert(alertId);
      if (response.success) {
        // Refresh data to show updated state
        fetchData();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      setError('Failed to resolve alert. Please try again.');
    }
  };

  // Handle viewing patient details
  const handleViewPatient = async (patientId: string) => {
    if (!patientId) {
      setError('Patient ID not available.');
      return;
    }

    try {
      setLoadingPatient(true);
      const response = await patientsAPI.getPatient(patientId);
      if (response.success && response.data) {
        // Transform the patient data to match the modal's expected format
        const patient = {
          id: response.data.id,
          name: response.data.name || `${response.data.firstName} ${response.data.lastName}`,
          age: response.data.age || 0,
          gestationalWeek: response.data.gestationalWeek,
          condition: response.data.condition || 'Pregnancy Care',
          risk: response.data.riskLevel || 'Low',
          lastVisit: response.data.lastVisit,
          bloodPressure: response.data.bloodPressure,
          bloodSugar: response.data.bloodSugar,
          symptoms: response.data.symptoms || 'No symptoms recorded',
          phone: response.data.phone,
          address: response.data.address,
          emergencyContact: response.data.emergencyContact,
          medicalHistory: response.data.medicalHistory || [],
          currentMedications: response.data.currentMedications || [],
          allergies: response.data.allergies || [],
          nextAppointment: response.data.nextAppointment
        };
        setSelectedPatient(patient);
        setShowPatientModal(true);
      } else {
        setError('Failed to load patient details.');
      }
    } catch (err) {
      console.error('Failed to fetch patient:', err);
      setError('Failed to load patient details. Please try again.');
    } finally {
      setLoadingPatient(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Bell className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high_risk': return 'High Risk';
      case 'missed_appointment': return 'Missed Appointment';
      case 'overdue_visit': return 'Overdue Visit';
      case 'emergency': return 'Emergency';
      default: return type;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-[#4ea674]" />
          <span className="ml-2 text-gray-600">Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
          <p className="text-gray-600">Monitor and manage patient alerts and notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            {stats.critical} Critical
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {stats.totalUnresolved} Unresolved
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={fetchData}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-gray-900">Critical Alerts</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <p className="text-sm text-gray-600">Require immediate action</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-gray-900">Warnings</h3>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
          <p className="text-sm text-gray-600">Need attention</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Overdue Visits</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.overdueVisits}</div>
          <p className="text-sm text-gray-600">Past due date</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Resolved</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <p className="text-sm text-gray-600">Completed actions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts by patient name or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as 'all' | 'critical' | 'warning' | 'info')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {getTypeLabel(alert.type)}
                  </span>
                  {alert.resolved && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Resolved
                    </span>
                  )}
                </div>
                <p className="text-gray-900 mb-2">{alert.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {alert.patientName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!alert.resolved && (
                  <>
                    <button 
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
                    >
                      Resolve
                    </button>
                    <button 
                      onClick={() => handleViewPatient(alert.patientId)}
                      disabled={loadingPatient}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingPatient ? 'Loading...' : 'View Patient'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
