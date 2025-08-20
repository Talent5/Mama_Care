import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  UserPlus, 
  Clock,
  Stethoscope,
  Pill,
  Baby,
  Bell,
  ChevronRight,
  RefreshCw,
  ClipboardCheck,
  BookOpen
} from 'lucide-react';
import MetricCard from '../MetricCard';
import ChartCard from '../ChartCard';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { patientsAPI, appointmentsAPI } from '../../../services/api';
import type { Patient, Appointment } from '../../../types/api';
import { getCompleteGreeting } from '../../../utils/greetingUtils';

interface NurseDashboardProps {
  widgets: string[];
  userName: string;
}

const NurseDashboard: React.FC<NurseDashboardProps> = ({ userName }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Use real dashboard data
  const { data: dashboardData, loading, error, refetch } = useDashboardData('30d', true);
  const [urgentTasksData, setUrgentTasksData] = useState<Patient[]>([]);
  const [todaysScheduleData, setTodaysScheduleData] = useState<Appointment[]>([]);

  // Fetch nurse-specific data
  useEffect(() => {
    const fetchNurseData = async () => {
      try {
        // Fetch urgent patients (high risk)
        const urgentResponse = await patientsAPI.getPatients({ 
          riskLevel: 'high', 
          limit: 4
        });
        
        if (urgentResponse.success) {
          setUrgentTasksData(urgentResponse.data || []);
        }

        // Fetch today's schedule
        const today = new Date().toISOString().split('T')[0];
        const scheduleResponse = await appointmentsAPI.getAppointments({
          date: today,
          limit: 8
        });
        
        if (scheduleResponse.success) {
          setTodaysScheduleData(scheduleResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching nurse dashboard data:', error);
      }
    };

    fetchNurseData();
  }, []);

  // Enhanced nurse-specific metrics from real data
  const metrics = {
    todayPatients: dashboardData?.todaysAppointments || 24,
    pendingTasks: Math.round((dashboardData?.todaysAppointments || 24) * 0.33) || 8,
    completedTasks: Math.round((dashboardData?.todaysAppointments || 24) * 0.67) || 16,
    urgentAlerts: dashboardData?.highRiskPatients || 3,
    todayAppointments: dashboardData?.todaysAppointments || 12,
    availableSlots: 8,
    medicationsToAdminister: Math.round((dashboardData?.todaysAppointments || 24) * 0.25) || 6,
    vitalSignsToRecord: Math.round((dashboardData?.todaysAppointments || 24) * 0.17) || 4,
    prenatalCheckups: Math.round((dashboardData?.todaysAppointments || 24) * 0.38) || 9,
    postnatalCare: Math.round((dashboardData?.todaysAppointments || 24) * 0.29) || 7,
    vaccinationsDue: 5,
    patientEducationSessions: 3
  };

  const quickActions = [
    { id: 1, title: 'Patient Registration', icon: UserPlus, color: 'blue', action: 'register' },
    { id: 2, title: 'Record Vitals', icon: Stethoscope, color: 'green', action: 'vitals' },
    { id: 3, title: 'Administer Medication', icon: Pill, color: 'purple', action: 'medication' },
    { id: 4, title: 'Schedule Appointment', icon: Calendar, color: 'orange', action: 'schedule' },
  ];

  const urgentTasks = [
    {
      id: 1,
      task: 'Blood pressure check for Mary Chikwanha',
      patient: 'Mary Chikwanha',
      priority: 'urgent',
      type: 'vitals',
      time: 'Due now',
      room: 'Room 201',
      gestationalWeek: 36,
      notes: 'Preeclampsia monitoring'
    },
    {
      id: 2,
      task: 'Administer insulin to Grace Mutapa',
      patient: 'Grace Mutapa',
      priority: 'urgent',
      type: 'medication',
      time: 'Due 15 mins ago',
      room: 'Room 105',
      gestationalWeek: 28,
      notes: 'Gestational diabetes - post meal'
    },
    {
      id: 3,
      task: 'Prenatal education session',
      patient: 'Ruth Sibanda',
      priority: 'high',
      type: 'education',
      time: 'Due in 30 mins',
      room: 'Education Room A',
      gestationalWeek: 32,
      notes: 'First-time mother'
    },
    {
      id: 4,
      task: 'Post-delivery check for Faith Moyo',
      patient: 'Faith Moyo',
      priority: 'high',
      type: 'assessment',
      time: 'Due in 1 hour',
      room: 'Room 302',
      notes: '24 hours post-delivery'
    }
  ];

  const todaySchedule = [
    {
      id: 1,
      time: '08:00',
      patient: 'Joyce Mpofu',
      type: 'Prenatal Checkup',
      status: 'completed',
      gestationalWeek: 35,
      vitals: { bp: '120/80', temp: '37.0°C', weight: '68kg' }
    },
    {
      id: 2,
      time: '08:30',
      patient: 'Chipo Gumbo',
      type: 'Vaccination',
      status: 'completed',
      gestationalWeek: 24,
      vitals: { bp: '118/75', temp: '36.8°C', weight: '65kg' }
    },
    {
      id: 3,
      time: '09:00',
      patient: 'Tendai Mukamuri',
      type: 'First Visit',
      status: 'in-progress',
      gestationalWeek: 16,
      vitals: { bp: 'pending', temp: 'pending', weight: 'pending' }
    },
    {
      id: 4,
      time: '09:30',
      patient: 'Blessing Mujuru',
      type: 'Follow-up',
      status: 'scheduled',
      gestationalWeek: 30,
      vitals: null
    },
    {
      id: 5,
      time: '10:00',
      patient: 'Precious Nyathi',
      type: 'Postnatal Care',
      status: 'scheduled',
      notes: '2 weeks post-delivery',
      vitals: null
    }
  ];

  const patientAlerts = [
    {
      id: 1,
      patient: 'Mary Chikwanha',
      alert: 'High blood pressure reading',
      severity: 'critical',
      time: '5 minutes ago',
      room: 'Room 201',
      action: 'Doctor notification sent'
    },
    {
      id: 2,
      patient: 'Grace Mutapa',
      alert: 'Blood sugar spike detected',
      severity: 'high',
      time: '15 minutes ago',
      room: 'Room 105',
      action: 'Medication administered'
    },
    {
      id: 3,
      patient: 'Faith Moyo',
      alert: 'Pain level increased to 8/10',
      severity: 'medium',
      time: '30 minutes ago',
      room: 'Room 302',
      action: 'Pain management protocol initiated'
    }
  ];

  const todaysEducationSessions = [
    {
      id: 1,
      title: 'Breastfeeding Basics',
      time: '10:30 AM',
      participants: 6,
      room: 'Education Room A',
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Prenatal Nutrition',
      time: '2:00 PM',
      participants: 8,
      room: 'Education Room B',
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Labor and Delivery Preparation',
      time: '4:00 PM',
      participants: 12,
      room: 'Main Conference Room',
      status: 'scheduled'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch(); // Refresh dashboard data
      // Refresh additional data
      const [urgentResponse, scheduleResponse] = await Promise.all([
        patientsAPI.getPatients({ riskLevel: 'high', limit: 4 }),
        appointmentsAPI.getAppointments({ 
          date: new Date().toISOString().split('T')[0], 
          limit: 8 
        })
      ]);
      
      if (urgentResponse.success) {
        setUrgentTasksData(urgentResponse.data || []);
      }
      if (scheduleResponse.success) {
        setTodaysScheduleData(scheduleResponse.data || []);
      }
    } catch (error) {
      console.error('Error refreshing nurse dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    console.log(`Executing nurse action: ${action}`);
    // Handle different quick actions based on nurse workflows
  };

  const handleTaskComplete = (taskId: number) => {
    console.log(`Completing task: ${taskId}`);
    // Mark task as completed
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'in-progress': return 'text-blue-700 bg-blue-100';
      case 'scheduled': return 'text-purple-700 bg-purple-100';
      case 'overdue': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'vitals': return <Stethoscope className="w-4 h-4" />;
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'education': return <BookOpen className="w-4 h-4" />;
      case 'assessment': return <ClipboardCheck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header with Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getCompleteGreeting({ firstName: userName, role: 'nurse' }).greeting}</h2>
            <p className="text-gray-600">{getCompleteGreeting({ firstName: userName, role: 'nurse' }).message}</p>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Bell className="w-4 h-4" />
              Alerts ({metrics.urgentAlerts})
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
                action.color === 'purple' ? 'border-purple-300 hover:border-purple-400 hover:bg-purple-50' :
                'border-orange-300 hover:border-orange-400 hover:bg-orange-50'
              }`}
            >
              <action.icon className={`w-5 h-5 ${
                action.color === 'blue' ? 'text-blue-500' :
                action.color === 'green' ? 'text-green-500' :
                action.color === 'purple' ? 'text-purple-500' :
                'text-orange-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Today's Patients"
          value={metrics.todayPatients.toString()}
          change="+4 from yesterday"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Urgent Tasks"
          value={metrics.pendingTasks.toString()}
          change="-2 completed"
          changeType="positive"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Medications Due"
          value={metrics.medicationsToAdminister.toString()}
          change="+1 new"
          changeType="neutral"
          icon={Pill}
        />
        <MetricCard
          title="Vitals Pending"
          value={metrics.vitalSignsToRecord.toString()}
          change="-3 completed"
          changeType="positive"
          icon={Stethoscope}
        />
        <MetricCard
          title="Prenatal Care"
          value={metrics.prenatalCheckups.toString()}
          change="+2 scheduled"
          changeType="positive"
          icon={Baby}
        />
        <MetricCard
          title="Education Sessions"
          value={metrics.patientEducationSessions.toString()}
          change="On schedule"
          changeType="neutral"
          icon={BookOpen}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Urgent Tasks - Full width on mobile, 2/3 on desktop */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Urgent Tasks & Patient Care
                </h3>
                <button className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="p-4 border-l-4 border-red-400 bg-red-50 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(task.type)}
                            <h4 className="font-semibold text-gray-900">{task.task}</h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Patient:</p>
                            <p className="font-medium text-gray-900">{task.patient}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Room:</p>
                            <p className="font-medium">{task.room}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Due:</p>
                            <p className="font-medium text-red-600">{task.time}</p>
                          </div>
                          {task.gestationalWeek && (
                            <div>
                              <p className="text-gray-600">Gestational Week:</p>
                              <p className="font-medium">{task.gestationalWeek} weeks</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="text-sm text-gray-600">Notes:</p>
                          <p className="text-sm font-medium">{task.notes}</p>
                        </div>
                      </div>
                      <button 
                        className="ml-4 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        onClick={() => handleTaskComplete(task.id)}
                      >
                        Complete Task
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
              <button className="text-sm text-blue-600 hover:text-blue-700">
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
                  {appointment.vitals && (
                    <div className="ml-[75px] text-sm text-gray-600">
                      <p>BP: {appointment.vitals.bp} | Temp: {appointment.vitals.temp} | Weight: {appointment.vitals.weight}</p>
                      {appointment.gestationalWeek && <p>Week {appointment.gestationalWeek}</p>}
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="ml-[75px] text-sm text-gray-600">
                      <p>{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Patient Alerts & Notifications
            </h3>
            <button className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All Alerts <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patientAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{alert.patient}</p>
                    <p className="text-sm text-gray-600">{alert.room}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="font-medium text-gray-900">{alert.alert}</p>
                  <p className="text-sm text-green-600 mt-1">{alert.action}</p>
                </div>
                <p className="text-xs text-gray-500">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Education Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Today's Patient Education Sessions
            </h3>
            <button className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Manage Sessions <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todaysEducationSessions.map((session) => (
              <div key={session.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-600">{session.room}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{session.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{session.participants} participants</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nurse Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Daily Patient Care Activities"
          data={[
            { label: '8 AM', value: 4 },
            { label: '9 AM', value: 8 },
            { label: '10 AM', value: 12 },
            { label: '11 AM', value: 15 },
            { label: '12 PM', value: 8 },
            { label: '1 PM', value: 6 },
            { label: '2 PM', value: 11 },
            { label: '3 PM', value: 14 },
            { label: '4 PM', value: 9 },
            { label: '5 PM', value: 5 }
          ]}
          type="bar"
        />
        
        <ChartCard
          title="Care Type Distribution"
          data={[
            { label: 'Prenatal Care', value: 35, color: '#10b981' },
            { label: 'Postnatal Care', value: 25, color: '#3b82f6' },
            { label: 'Medication Admin', value: 20, color: '#8b5cf6' },
            { label: 'Vital Signs', value: 15, color: '#f59e0b' },
            { label: 'Patient Education', value: 5, color: '#ef4444' }
          ]}
          type="doughnut"
        />
      </div>
    </div>
  );
};

export default NurseDashboard;
