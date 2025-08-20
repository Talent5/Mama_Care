import React, { useState } from 'react';
import { X, AlertTriangle, Heart, Calendar, Phone, MapPin, User, FileText } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalWeek?: number;
  riskLevel: string;
  lastVisit: string;
  nextAppointment: string;
  ancVisits: number;
  facility: string;
  region: string;
  condition: string;
  symptoms: string;
  bloodPressure?: string;
  bloodSugar?: string;
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onAddNote: (patientId: string, note: string) => Promise<void>;
  onScheduleAppointment: (patientId: string) => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onAddNote,
  onScheduleAppointment
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote(patient.id, newNote);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (risk: string | undefined) => {
    if (!risk) return 'bg-gray-100 text-gray-800';
    
    switch (risk.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string | undefined) => {
    if (!risk) return null;
    
    switch (risk.toLowerCase()) {
      case 'critical':
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Heart className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {patient.age} years
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {patient.facility}
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {patient.phone}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getRiskColor(patient.riskLevel)}`}>
              {getRiskIcon(patient.riskLevel)}
              <span className="text-sm font-medium">{patient.riskLevel || 'Unknown'} risk</span>
            </div>
            <div className="text-sm text-gray-600">
              Gestational Week: {patient.gestationalWeek || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              ANC Visits: {patient.ancVisits}/8
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[#4ea674] text-[#4ea674]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'vitals'
                  ? 'border-b-2 border-[#4ea674] text-[#4ea674]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Vitals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-b-2 border-[#4ea674] text-[#4ea674]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'notes'
                  ? 'border-b-2 border-[#4ea674] text-[#4ea674]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notes
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Appointments</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Visit:</span>
                      <span className="text-gray-900">{patient.lastVisit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next Appointment:</span>
                      <span className="text-gray-900">{patient.nextAppointment}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onScheduleAppointment(patient.id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Appointment
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{patient.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {patient.emergencyContact && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">{patient.emergencyContact.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Relationship:</span>
                      <span className="text-gray-900">{patient.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-gray-900">{patient.emergencyContact.phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {patient.bloodPressure && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Blood Pressure</h3>
                    <div className="text-2xl font-bold text-gray-900">{patient.bloodPressure}</div>
                  </div>
                )}
                {patient.bloodSugar && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Blood Sugar</h3>
                    <div className="text-2xl font-bold text-gray-900">{patient.bloodSugar} mg/dL</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Medical History</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {patient.medicalHistory.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {patient.currentMedications && patient.currentMedications.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Current Medications</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {patient.currentMedications.map((med, index) => (
                      <li key={index}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Allergies</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {patient.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Add Note</h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isSubmitting || !newNote.trim()}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  {isSubmitting ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
