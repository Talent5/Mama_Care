import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Stethoscope,
  AlertTriangle,
  Search,
  Plus,
  Check
} from 'lucide-react';
import { appointmentsAPI, patientsAPI } from '../../services/api';

interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalWeek?: number;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: string;
  type: string;
  priority: string;
  notes: string;
  isNewPatient: boolean;
  createdAt: string;
  status: string;
}

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
}

const QuickAppointmentModal: React.FC<QuickAppointmentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName
}) => {
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    patientName: patientName || '',
    appointmentDate: '',
    appointmentTime: '',
    duration: '30',
    type: 'consultation',
    priority: 'normal',
    notes: '',
    isNewPatient: false
  });

  const [searchQuery, setSearchQuery] = useState(patientName || '');
  const [isSearching, setIsSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId && patientName) {
      setFormData(prev => ({
        ...prev,
        patientId,
        patientName
      }));
      setSearchQuery(patientName);
    }
  }, [patientId, patientName]);

  const searchPatients = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await patientsAPI.getPatients({ search: query });
      setPatients(response.data.patients.map((p: any) => ({
        id: p._id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        age: calculateAge(p.dateOfBirth),
        gestationalWeek: p.currentPregnancy?.gestationalAge
      })));
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const appointmentTypes = [
    { value: 'consultation', label: 'Initial Consultation', duration: 45, color: 'blue' },
    { value: 'checkup', label: 'Routine Check-up', duration: 30, color: 'green' },
    { value: 'prenatal', label: 'Prenatal Visit', duration: 30, color: 'purple' },
    { value: 'postnatal', label: 'Postnatal Care', duration: 30, color: 'pink' },
    { value: 'emergency', label: 'Emergency Consultation', duration: 60, color: 'red' },
    { value: 'follow_up', label: 'Follow-up Visit', duration: 20, color: 'orange' },
    { value: 'ultrasound', label: 'Ultrasound Screening', duration: 45, color: 'indigo' },
    { value: 'lab_review', label: 'Lab Results Review', duration: 15, color: 'gray' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  if (!isOpen) return null;

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name
    }));
    setSearchQuery(patient.name);
    setIsSearching(false);
  };

  const handleTypeChange = (type: string) => {
    const selectedType = appointmentTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      type,
      duration: selectedType?.duration.toString() || '30'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        patientId: formData.patientId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        duration: parseInt(formData.duration),
        type: formData.type,
        priority: formData.priority,
        notes: formData.notes
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);
      
      onClose();
      
      // Reset form
      setFormData({
        patientId: '',
        patientName: '',
        appointmentDate: '',
        appointmentTime: '',
        duration: '30',
        type: 'consultation',
        priority: 'normal',
        notes: '',
        isNewPatient: false
      });
      setSearchQuery('');
      setError('');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('Failed to create appointment');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    const typeConfig = appointmentTypes.find(t => t.value === type);
    const color = typeConfig?.color || 'gray';
    
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      pink: 'bg-pink-100 text-pink-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Schedule Appointment</h2>
                <p className="text-sm text-gray-600">Create a new patient appointment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="appointment-form" className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Patient Selection */}
            {!patientId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setSearchQuery(query);
                        setIsSearching(true);
                        if (!query) {
                          setFormData(prev => ({ ...prev, patientId: '', patientName: '' }));
                          setPatients([]);
                        } else {
                          searchPatients(query);
                        }
                      }}
                      placeholder="Search for patient by name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearching && searchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-3 text-gray-600">
                          Searching...
                        </div>
                      ) : filteredPatients.length > 0 ? (
                        <>
                          {filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handlePatientSelect(patient)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{patient.name}</p>
                                <p className="text-sm text-gray-600">
                                  Age: {patient.age} • Week: {patient.gestationalWeek || 'N/A'}
                                </p>
                              </div>
                              <User className="w-4 h-4 text-gray-400" />
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-600">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type.value)}`}>
                      {type.value === 'emergency' && <AlertTriangle className="w-3 h-3" />}
                      {type.value === 'consultation' && <Stethoscope className="w-3 h-3" />}
                      {type.value === 'checkup' && <Check className="w-3 h-3" />}
                      <span>{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{type.duration} min</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  min="15"
                  max="120"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any relevant notes or special instructions..."
                className="w-full px-3 py-2 h-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Appointment Summary */}
            {formData.patientName && formData.appointmentDate && formData.appointmentTime && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Appointment Summary</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Patient:</strong> {formData.patientName}</p>
                  <p><strong>Date:</strong> {new Date(formData.appointmentDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {formData.appointmentTime}</p>
                  <p><strong>Type:</strong> {appointmentTypes.find(t => t.value === formData.type)?.label}</p>
                  <p><strong>Duration:</strong> {formData.duration} minutes</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span><strong>Priority:</strong></span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(formData.priority)}`}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              * Required fields
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="appointment-form"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAppointmentModal;
