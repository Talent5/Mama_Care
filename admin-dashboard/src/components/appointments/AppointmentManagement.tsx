import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  User
} from 'lucide-react';

// Extended interface to handle both backend formats
interface ExtendedAppointment {
  _id: string;
  patient?: any;
  healthcareProvider?: any;
  provider?: any;
  appointmentDate?: string;
  date?: string;
  appointmentTime?: string;
  time?: string;
  type: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rejected';
  reason?: string;
  notes?: string;
  priority?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal state for editing appointment
  const [editingAppointment, setEditingAppointment] = useState<ExtendedAppointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchPendingAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/appointments?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAppointments(data.data.appointments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/appointments/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPendingAppointments(data.data.appointments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    }
  };

  const handleApproveAppointment = async (appointmentId: string, customDate?: string, customTime?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const requestBody: any = {
        doctorNotes: 'Appointment approved'
      };
      
      // Add custom date/time if provided
      if (customDate) {
        requestBody.appointmentDate = customDate;
      }
      if (customTime) {
        requestBody.appointmentTime = customTime;
      }
      
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        await fetchAppointments();
        await fetchPendingAppointments();
        setShowEditModal(false);
        setEditingAppointment(null);
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

  const handleOpenEditModal = (appointment: ExtendedAppointment) => {
    setEditingAppointment(appointment);
    setEditDate(appointment.appointmentDate || appointment.date || '');
    setEditTime(appointment.appointmentTime || appointment.time || '');
    setShowEditModal(true);
  };

  const handleApproveWithEdit = () => {
    if (!editingAppointment) return;
    handleApproveAppointment(editingAppointment._id, editDate, editTime);
  };

  const handleQuickApprove = (appointmentId: string) => {
    handleApproveAppointment(appointmentId);
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
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

  const getPatientName = (appointment: ExtendedAppointment) => {
    if (appointment.patient && typeof appointment.patient === 'object') {
      if (appointment.patient.user) {
        return `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`;
      }
      if (appointment.patient.firstName) {
        return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      }
    }
    return 'Patient Name';
  };

  const getProviderName = (appointment: ExtendedAppointment) => {
    const provider = appointment.healthcareProvider || appointment.provider;
    if (provider && typeof provider === 'object') {
      return `${provider.firstName} ${provider.lastName}`;
    }
    return 'Healthcare Provider';
  };

  const getAppointmentTime = (appointment: ExtendedAppointment) => {
    return appointment.appointmentTime || appointment.time || 'TBA';
  };

  const getAppointmentDate = (appointment: ExtendedAppointment) => {
    const date = appointment.appointmentDate || appointment.date;
    return date ? new Date(date).toLocaleDateString() : 'TBA';
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'consultation': 'Consultation',
      'checkup': 'Checkup',
      'prenatal': 'Prenatal',
      'postnatal': 'Postnatal',
      'emergency': 'Emergency',
      'follow_up': 'Follow-up',
      'vaccination': 'Vaccination',
      'ultrasound': 'Ultrasound',
      'lab_test': 'Lab Test',
      'other': 'Other',
      'anc': 'ANC Visit'
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Manage appointments and approve patient requests</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors bg-[#4ea674] hover:bg-[#3d8f5f]"
        >
          <Plus className="w-4 h-4" />
          New Appointment
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
                        {getAppointmentTime(appointment)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getAppointmentDate(appointment)}
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
                      onClick={() => handleQuickApprove(appointment._id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Quick Approve
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(appointment)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Edit & Approve
                    </button>
                    <button
                      onClick={() => handleRejectAppointment(appointment._id)}
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

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
              <p className="text-sm text-gray-600">Scheduled appointments for {selectedDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Loading appointments...</div>
            </div>
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {getAppointmentTime(appointment)}
                      </div>
                      <div className="text-sm text-gray-500">{getTypeLabel(appointment.type)}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{getPatientName(appointment)}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getProviderName(appointment)}
                        </div>
                        {appointment.reason && (
                          <div>
                            <strong>Reason:</strong> {appointment.reason}
                          </div>
                        )}
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
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">No appointments scheduled for {selectedDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit & Approve Appointment
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Patient</h4>
                <p className="text-sm text-gray-600">{getPatientName(editingAppointment)}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Original Request</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> {getTypeLabel(editingAppointment.type)}</p>
                  <p><strong>Date:</strong> {getAppointmentDate(editingAppointment)}</p>
                  <p><strong>Time:</strong> {getAppointmentTime(editingAppointment)}</p>
                  <p><strong>Reason:</strong> {editingAppointment.reason || 'No reason provided'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Adjust Schedule (Optional)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Time
                    </label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Leave unchanged to approve with original date and time
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleApproveWithEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Appointment
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
