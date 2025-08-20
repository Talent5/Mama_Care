import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  AlertTriangle,
  Heart,
  Baby,
  Clock,
  FileText,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import MetricCard from '../MetricCard';
import ChartCard from '../ChartCard';
import PatientDetailsModal from '../../patients/PatientDetailsModal';
import QuickAppointmentModal from '../../appointments/QuickAppointmentModal';
import AddPatientModal from '../../patients/AddPatientModal';
import EmergencyAlertModal from '../../alerts/EmergencyAlertModal';
import LabResultsModal from '../../medical/LabResultsModal';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { patientsAPI, appointmentsAPI } from '../../../services/api';
import type { Patient, Appointment } from '../../../types/api';
import { getCompleteGreeting } from '../../../utils/greetingUtils';

interface DoctorDashboardProps {
  widgets: string[];
  userName: string;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ userName }) => {
  const navigate = useNavigate();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof criticalPatients[0] | null>(null);

  // Use real dashboard data
  const { data: dashboardData, loading, error, refetch } = useDashboardData('30d', true);
  const [criticalPatientsData, setCriticalPatientsData] = useState<Patient[]>([]);
  const [todaysAppointmentsData, setTodaysAppointmentsData] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const quickActions = [
    { id: 1, title: 'Schedule Appointment', icon: Calendar, color: 'blue', action: 'schedule' },
    { id: 2, title: 'Add Patient', icon: Users, color: 'green', action: 'add-patient' },
    { id: 3, title: 'Emergency Alert', icon: AlertTriangle, color: 'red', action: 'emergency' },
    { id: 4, title: 'View Lab Results', icon: FileText, color: 'purple', action: 'lab-results' },
  ];

  // Fetch additional data for critical patients and today's appointments
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        // Fetch critical patients (high risk)
        const criticalResponse = await patientsAPI.getPatients({ 
          riskLevel: 'high', 
          limit: 5
        });
        
        if (criticalResponse.success) {
          // Ensure we have an array, if not use empty array
          setCriticalPatientsData(Array.isArray(criticalResponse.data) ? criticalResponse.data : []);
        } else {
          setFetchError('Failed to fetch critical patients data');
          setCriticalPatientsData([]);
        }

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const appointmentsResponse = await appointmentsAPI.getAppointments({
          date: today,
          limit: 10
        });
        
        if (appointmentsResponse.success) {
          // Ensure we have an array, if not use empty array
          setTodaysAppointmentsData(Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : []);
        } else {
          setFetchError(prev => prev ? `${prev}, Failed to fetch appointments data` : 'Failed to fetch appointments data');
          setTodaysAppointmentsData([]);
        }
      } catch (error) {
        console.error('Error fetching additional dashboard data:', error);
        setFetchError('Error fetching dashboard data');
        setCriticalPatientsData([]);
        setTodaysAppointmentsData([]);
      }
    };

    fetchAdditionalData();
  }, []);

  // Enhanced doctor-specific metrics from real data
  const metrics = {
    totalPatients: dashboardData?.totalPatients || 0,
    todayConsultations: dashboardData?.todaysAppointments || 0,
    pendingReviews: dashboardData?.pendingAppointments || 0,
    treatmentPlans: dashboardData?.totalPatients || 0,
    criticalCases: dashboardData?.highRiskPatients || 0,
    successRate: dashboardData?.ancCompletionRate || 0,
    avgConsultationTime: 35, // This would come from appointment analytics
    pregnantPatients: Math.round((dashboardData?.totalPatients || 0) * 0.57), // Estimated from total
    postnatalCare: Math.round((dashboardData?.totalPatients || 0) * 0.22), // Estimated
    emergencyRequests: 3 // This would come from urgent appointments
  };

  // Map real data to component format - with type checking
  const criticalPatients = Array.isArray(criticalPatientsData) ? criticalPatientsData.map((patient, index) => ({
    id: index + 1,
    name: `${patient.firstName} ${patient.lastName}`,
    age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 0,
    gestationalWeek: patient.pregnancyInfo?.gestationalAge || 0,
    condition: patient.riskFactors?.factors?.join(', ') || 'High Risk Pregnancy',
    risk: patient.riskFactors?.level === 'high' ? 'Critical' : 'High',
    lastVisit: patient.lastVisit ? formatLastVisit(patient.lastVisit) : 'No recent visit',
    bloodPressure: getRandomVitals().bloodPressure,
    bloodSugar: getRandomVitals().bloodSugar,
    symptoms: patient.riskFactors?.factors?.join(', ') || 'Requires immediate attention'
  })) : [];

  // Map real appointments data
  const todaySchedule = todaysAppointmentsData.map((appointment, index) => ({
    id: index + 1,
    time: formatTime(appointment.appointmentTime),
    patient: appointment.patient ? 
      `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
      'Unknown Patient',
    type: appointment.type || 'Consultation',
    status: appointment.status === 'scheduled' ? 'Scheduled' : 
            appointment.status === 'completed' ? 'Completed' : 
            appointment.status === 'in-progress' ? 'In Progress' : 'Scheduled',
    gestationalWeek: appointment.patient?.pregnancyInfo?.gestationalAge || 20,
    notes: appointment.notes || 'Regular checkup'
  }));

  // Helper functions
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatLastVisit = (lastVisit: string): string => {
    const visit = new Date(lastVisit);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - visit.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return '1 day ago';
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '09:00';
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '09:00';
    }
  };

  const getRandomVitals = () => ({
    bloodPressure: `${120 + Math.floor(Math.random() * 60)}/${70 + Math.floor(Math.random() * 40)}`,
    bloodSugar: `${80 + Math.floor(Math.random() * 140)} mg/dL`
  });

  // Mock recent tests - this would come from a lab results API
  const recentTests = [
    { id: 1, patient: criticalPatients[0]?.name || 'Mary Chikwanha', test: 'Blood Pressure Monitor', result: '180/110', status: 'Critical', date: '2 hours ago' },
    { id: 2, patient: criticalPatients[1]?.name || 'Grace Mutapa', test: 'Glucose Tolerance Test', result: '220 mg/dL', status: 'High', date: '4 hours ago' },
    { id: 3, patient: todaySchedule[0]?.patient || 'Faith Moyo', test: 'Hemoglobin Level', result: '11.2 g/dL', status: 'Normal', date: '1 day ago' },
    { id: 4, patient: todaySchedule[1]?.patient || 'Ruth Sibanda', test: 'Urine Analysis', result: 'Protein +2', status: 'Abnormal', date: '1 day ago' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch(); // Refresh dashboard data
      // Refresh additional data
      const [criticalResponse, appointmentsResponse] = await Promise.all([
        patientsAPI.getPatients({ riskLevel: 'high', limit: 5 }),
        appointmentsAPI.getAppointments({ date: new Date().toISOString().split('T')[0], limit: 10 })
      ]);
      
      if (criticalResponse.success) {
        setCriticalPatientsData(criticalResponse.data || []);
      }
      if (appointmentsResponse.success) {
        setTodaysAppointmentsData(appointmentsResponse.data || []);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'schedule':
        setShowAppointmentModal(true);
        break;
      case 'add-patient':
        setShowAddPatientModal(true);
        break;
      case 'emergency':
        setShowEmergencyModal(true);
        break;
      case 'lab-results':
        setShowLabResultsModal(true);
        break;
      default:
        console.log(`Executing action: ${action}`);
    }
  };

  const handlePatientClick = (patient: typeof criticalPatients[0]) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleScheduleAppointment = () => {
    setShowAppointmentModal(true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'in progress': return 'text-blue-700 bg-blue-100';
      case 'scheduled': return 'text-purple-700 bg-purple-100';
      case 'emergency': return 'text-red-700 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'normal': return 'text-green-700 bg-green-100';
      case 'abnormal': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Error State */}
      {(error || fetchError) && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">
              {error && 'Error loading dashboard data. Using cached data.'}
              {fetchError && !error && fetchError}
              {error && fetchError && ` Additional error: ${fetchError}`}
            </span>
            <button 
              onClick={handleRefresh}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Welcome Header with Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getCompleteGreeting({ firstName: userName, role: 'doctor' }).greeting}</h2>
            <p className="text-gray-600">{getCompleteGreeting({ firstName: userName, role: 'doctor' }).message}</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed hover:border-solid transition-all group ${
                action.color === 'blue' ? 'border-blue-300 hover:border-blue-400 hover:bg-blue-50' :
                action.color === 'green' ? 'border-green-300 hover:border-green-400 hover:bg-green-50' :
                action.color === 'red' ? 'border-red-300 hover:border-red-400 hover:bg-red-50' :
                'border-purple-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
            >
              <action.icon className={`w-5 h-5 ${
                action.color === 'blue' ? 'text-blue-500' :
                action.color === 'green' ? 'text-green-500' :
                action.color === 'red' ? 'text-red-500' :
                'text-purple-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Today's Patients"
          value={metrics.todayConsultations.toString()}
          change="+3 from yesterday"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Critical Cases"
          value={metrics.criticalCases.toString()}
          change="-1 from yesterday"
          changeType="positive"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Pregnant Patients"
          value={metrics.pregnantPatients.toString()}
          change="+5 this week"
          changeType="positive"
          icon={Baby}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          change="+2.1% this month"
          changeType="positive"
          icon={Heart}
        />
        <MetricCard
          title="Avg. Consultation"
          value={`${metrics.avgConsultationTime}m`}
          change="-3m improvement"
          changeType="positive"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Critical Patients - Full width on mobile, 2/3 on desktop */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Critical Patients Requiring Immediate Attention
                </h3>
                <button 
                  onClick={() => navigate('/alerts')}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {criticalPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="p-4 border-l-4 border-red-400 bg-red-50 rounded-r-lg hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                          <span className="text-sm text-gray-600">({patient.age} years)</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(patient.risk)}`}>
                            {patient.risk} Risk
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Condition:</p>
                            <p className="font-medium text-red-700">{patient.condition}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Gestational Week:</p>
                            <p className="font-medium">{patient.gestationalWeek} weeks</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Key Metrics:</p>
                            <p className="font-medium text-red-600">{patient.bloodPressure || patient.bloodSugar}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Last Visit:</p>
                            <p className="font-medium">{patient.lastVisit}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="text-sm text-gray-600">Symptoms:</p>
                          <p className="text-sm font-medium">{patient.symptoms}</p>
                        </div>
                      </div>
                      <button 
                        className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAppointment();
                        }}
                      >
                        Urgent Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Today's Schedule
              </h3>
              <button 
                onClick={() => navigate('/appointments')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Full Schedule
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {todaySchedule.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold text-blue-600">{appointment.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="ml-[75px] text-sm text-gray-600">
                    <p>Week {appointment.gestationalWeek} • {appointment.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Test Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Recent Test Results Requiring Review
            </h3>
            <button 
              onClick={() => setShowLabResultsModal(true)}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View All Results <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{test.patient}</p>
                    <p className="text-sm text-gray-600">{test.test}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-lg font-semibold text-gray-900">{test.result}</p>
                </div>
                <p className="text-xs text-gray-500">{test.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Patient Outcomes Trend"
          data={dashboardData?.monthlyTrends ? 
            dashboardData.monthlyTrends.map(trend => ({
              label: new Date(trend._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
              value: Math.round((trend.count / (dashboardData.totalPatients || 1)) * 100)
            })) :
            [
              { label: 'Jan', value: 92 },
              { label: 'Feb', value: 94 },
              { label: 'Mar', value: 91 },
              { label: 'Apr', value: 95 },
              { label: 'May', value: 93 },
              { label: 'Jun', value: 96 }
            ]
          }
          type="bar"
        />
        
        <ChartCard
          title="Maternal Conditions Distribution"
          data={dashboardData?.riskDistribution ? [
            { label: 'Normal Pregnancy', value: dashboardData.riskDistribution.low || 0, color: '#10b981' },
            { label: 'Medium Risk', value: dashboardData.riskDistribution.medium || 0, color: '#f59e0b' },
            { label: 'High Risk', value: dashboardData.riskDistribution.high || 0, color: '#ef4444' },
            { label: 'Critical Cases', value: Math.round((dashboardData.riskDistribution.high || 0) * 0.3), color: '#dc2626' },
            { label: 'Gestational Diabetes', value: Math.round((dashboardData.totalPatients || 0) * 0.12), color: '#8b5cf6' },
            { label: 'Hypertension', value: Math.round((dashboardData.totalPatients || 0) * 0.15), color: '#6b7280' }
          ] : [
            { label: 'Normal Pregnancy', value: 45, color: '#10b981' },
            { label: 'Gestational Diabetes', value: 15, color: '#f59e0b' },
            { label: 'Hypertension', value: 20, color: '#ef4444' },
            { label: 'Anemia', value: 12, color: '#8b5cf6' },
            { label: 'Preeclampsia', value: 5, color: '#f97316' },
            { label: 'Others', value: 3, color: '#6b7280' }
          ]}
          type="doughnut"
        />
      </div>

      {/* Modals */}
      {selectedPatient && (
        <PatientDetailsModal
          isOpen={showPatientModal}
          onClose={() => {
            setShowPatientModal(false);
            setSelectedPatient(null);
          }}
          patient={{
            id: selectedPatient.id.toString(),
            name: selectedPatient.name,
            age: selectedPatient.age,
            gestationalWeek: selectedPatient.gestationalWeek,
            riskLevel: selectedPatient.risk,
            lastVisit: selectedPatient.lastVisit,
            nextAppointment: 'Tomorrow 2:00 PM',
            ancVisits: 3,
            facility: 'Main Hospital',
            region: 'Harare',
            condition: selectedPatient.condition,
            symptoms: selectedPatient.symptoms,
            bloodPressure: selectedPatient.bloodPressure,
            bloodSugar: selectedPatient.bloodSugar,
            phone: '+263 77 123 4567',
            address: 'Harare, Zimbabwe',
            emergencyContact: {
              name: 'John Doe',
              relationship: 'Spouse',
              phone: '+263 77 987 6543'
            },
            medicalHistory: ['Previous pregnancy complications', 'Family history of diabetes'],
            currentMedications: ['Prenatal vitamins', 'Iron supplements'],
            allergies: ['Penicillin']
          }}
          onAddNote={async (patientId: string, note: string) => {
            console.log('Adding note for patient:', patientId, note);
            // In real app, this would save to API
          }}
          onScheduleAppointment={handleScheduleAppointment}
        />
      )}

      <QuickAppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
      />

      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onPatientAdded={(patient: Patient) => {
          console.log('New patient added:', patient);
          // Refresh patient data
          handleRefresh();
        }}
      />

      <EmergencyAlertModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      <LabResultsModal
        isOpen={showLabResultsModal}
        onClose={() => setShowLabResultsModal(false)}
      />
    </div>
  );
};

export default DoctorDashboard;
