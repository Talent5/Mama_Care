import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { appointmentsAPI } from '../../services/api';
import { Appointment } from '../../types/api';

const AppointmentScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show'>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchPendingAppointments();
  }, [selectedDate, statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAppointments({
        date: selectedDate,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      if (response.success && response.data) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAppointments({
        status: 'pending'
      });
      
      if (response.success && response.data) {
        setPendingAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    }
  };

  const handleApproveAppointment = async (appointmentId: string, appointmentDate?: string, appointmentTime?: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          appointmentDate,
          appointmentTime,
          doctorNotes: 'Appointment approved by doctor'
        })
      });

      if (response.ok) {
        await fetchAppointments();
        await fetchPendingAppointments();
        alert('Appointment approved successfully!');
      } else {
        const error = await response.json();
        alert(`Error approving appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('Failed to approve appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          rejectionReason: reason
        })
      });

      if (response.ok) {
        await fetchAppointments();
        await fetchPendingAppointments();
        alert('Appointment rejected successfully!');
      } else {
        const error = await response.json();
        alert(`Error rejecting appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Failed to reject appointment');
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const appointmentDate = apt.appointmentDate || apt.date;
    return appointmentDate === selectedDate;
  });
  const filteredAppointments = todayAppointments.filter(apt => 
    statusFilter === 'all' || apt.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'anc': 
      case 'prenatal': return 'ANC Visit';
      case 'delivery': return 'Delivery';
      case 'postnatal': return 'Postnatal';
      case 'consultation': return 'Consultation';
      case 'checkup': return 'Checkup';
      case 'emergency': return 'Emergency';
      case 'follow_up': return 'Follow-up';
      case 'vaccination': return 'Vaccination';
      case 'ultrasound': return 'Ultrasound';
      case 'lab_test': return 'Lab Test';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getPatientName = (appointment: Appointment) => {
    if (typeof appointment.patient === 'object' && appointment.patient?.user) {
      return `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`;
    }
    return 'Patient Name';
  };

  const getProviderName = (appointment: Appointment) => {
    if (typeof appointment.healthcareProvider === 'object' && appointment.healthcareProvider) {
      return `${appointment.healthcareProvider.firstName} ${appointment.healthcareProvider.lastName}`;
    }
    return 'Healthcare Provider';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Manage appointments and approve patient requests</p>
        </div>
        <button
          onClick={() => setShowAddAppointment(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: '#4ea674' }}
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </button>
      </div>

      {/* Pending Appointments Section */}
      {pendingAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
                <p className="text-sm text-gray-600">These appointments need your approval</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingAppointments.length} pending
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {appointment.appointmentTime || 'TBA'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate || '').toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{getPatientName(appointment)}</h3>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {getTypeLabel(appointment.type)} • 
                        <strong> Reason:</strong> {appointment.reason || 'No reason provided'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Provider:</strong> {getProviderName(appointment)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveAppointment(appointment._id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason) {
                          handleRejectAppointment(appointment._id, reason);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {appointment.appointmentTime || 'TBA'}
                        </div>
                        <div className="text-sm text-gray-500">{getTypeLabel(appointment.type)}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{getPatientName(appointment)}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {getProviderName(appointment)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Healthcare Facility
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-sm text-[#4ea674] hover:bg-[#c0e6b9] rounded-lg transition-colors">
                        View
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600">No appointments scheduled for {selectedDate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Appointments</span>
                <span className="font-medium">{todayAppointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="font-medium text-blue-600">
                  {todayAppointments.filter(a => a.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">
                  {todayAppointments.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">No Shows</span>
                <span className="font-medium text-red-600">
                  {todayAppointments.filter(a => a.status === 'no_show').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-[#4ea674]" />
                <span className="text-sm">Schedule New Appointment</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Calendar className="w-4 h-4 text-[#4ea674]" />
                <span className="text-sm">View Weekly Schedule</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Search className="w-4 h-4 text-[#4ea674]" />
                <span className="text-sm">Find Available Slots</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;