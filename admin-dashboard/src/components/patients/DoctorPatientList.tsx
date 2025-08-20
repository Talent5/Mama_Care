import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Calendar,
  Eye,
  FileText,
  AlertTriangle,
  Baby,
  Heart,
  Clock,
  Phone,
  MapPin,
  RefreshCw,
  Plus,
  ChevronLeft
} from 'lucide-react';
import { patientsAPI } from '../../services/api';
import PatientDetailsModal from './PatientDetailsModal';
import QuickAppointmentModal from '../appointments/QuickAppointmentModal';

interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalWeek?: number;
  condition: string;
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
  lastVisit: string;
  nextAppoint: string;
  bloodPressure?: string;
  bloodSugar?: string;
  symptoms?: string;
  phone?: string;
  address?: string;
  pregnancyStatus: 'prenatal' | 'postnatal' | 'non-pregnant';
}

interface DoctorPatientListProps {
  onBack?: () => void;
}

const DoctorPatientList: React.FC<DoctorPatientListProps> = ({ onBack }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'prenatal' | 'postnatal' | 'non-pregnant'>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientsAPI.getPatients();
      setPatients(response.data.patients.map(transformPatientData));
    } catch (error) {
      console.error('Error loading patients:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  const transformPatientData = (apiPatient: any): Patient => {
    return {
      id: apiPatient._id,
      name: `${apiPatient.user.firstName} ${apiPatient.user.lastName}`,
      age: calculateAge(apiPatient.dateOfBirth),
      gestationalWeek: apiPatient.currentPregnancy?.gestationalAge,
      condition: apiPatient.currentPregnancy?.condition || 'Normal',
      risk: apiPatient.currentPregnancy?.riskLevel || 'Low',
      lastVisit: formatDate(apiPatient.lastVisit),
      nextAppoint: formatDate(apiPatient.nextAppointment),
      bloodPressure: apiPatient.vitals?.bloodPressure,
      bloodSugar: apiPatient.vitals?.bloodSugar,
      symptoms: apiPatient.currentPregnancy?.symptoms?.join(', ') || 'None',
      phone: apiPatient.user.phone,
      address: apiPatient.address,
      pregnancyStatus: apiPatient.currentPregnancy?.isPregnant ? 'prenatal' : 'postnatal'
    };
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

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Not scheduled';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleScheduleAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowAppointmentModal(true);
  };

  const handleAddNote = async (patientId: string, note: string) => {
    try {
      await patientsAPI.addPatientNote(patientId, note);
      // Refresh patient data
      loadPatients();
    } catch (error) {
      console.error('Error adding note:', error);
      // TODO: Show error toast
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || patient.risk === riskFilter;
    const matchesStatus = statusFilter === 'all' || patient.pregnancyStatus === statusFilter;
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prenatal': return 'bg-blue-100 text-blue-800';
      case 'postnatal': return 'bg-purple-100 text-purple-800';
      case 'non-pregnant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatientStats = () => {
    const total = patients.length;
    const critical = patients.filter(p => p.risk === 'Critical').length;
    const prenatal = patients.filter(p => p.pregnancyStatus === 'prenatal').length;
    const postnatal = patients.filter(p => p.pregnancyStatus === 'postnatal').length;
    
    return { total, critical, prenatal, postnatal };
  };

  const { total, critical, prenatal, postnatal } = getPatientStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patients...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                My Patients
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive patient management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Add Patient
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Patients</p>
                <p className="text-2xl font-bold text-blue-900">{total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Critical Cases</p>
                <p className="text-2xl font-bold text-red-900">{critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Prenatal Care</p>
                <p className="text-2xl font-bold text-purple-900">{prenatal}</p>
              </div>
              <Baby className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Postnatal Care</p>
                <p className="text-2xl font-bold text-green-900">{postnatal}</p>
              </div>
              <Heart className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as 'all' | 'Critical' | 'High' | 'Medium' | 'Low')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'prenatal' | 'postnatal' | 'non-pregnant')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="prenatal">Prenatal</option>
              <option value="postnatal">Postnatal</option>
              <option value="non-pregnant">Non-pregnant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.age} years old</p>
                  {patient.gestationalWeek && (
                    <p className="text-sm text-purple-600 font-medium">
                      Week {patient.gestationalWeek}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(patient.risk)}`}>
                    {patient.risk} Risk
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.pregnancyStatus)}`}>
                    {patient.pregnancyStatus.charAt(0).toUpperCase() + patient.pregnancyStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">Condition:</p>
                <p className="font-medium text-gray-900">{patient.condition}</p>
              </div>

              {/* Key Metrics */}
              {(patient.bloodPressure || patient.bloodSugar) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Key Metrics:</p>
                  <p className="font-medium text-red-600">
                    {patient.bloodPressure || patient.bloodSugar}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {patient.phone}
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {patient.address}
                  </div>
                )}
              </div>

              {/* Visit Info */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last visit: {patient.lastVisit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Next: {patient.nextAppoint}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 flex items-center justify-between gap-2">
                <button 
                  onClick={() => handleViewPatient(patient)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button 
                  onClick={() => handleScheduleAppointment(patient)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
                <button 
                  onClick={() => handleViewPatient(patient)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Notes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailsModal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          patient={selectedPatient}
          onAddNote={handleAddNote}
          onScheduleAppointment={(patientId) => {
            setSelectedPatient(null);
            setShowAppointmentModal(true);
          }}
        />
      )}

      {/* Quick Appointment Modal */}
      {showAppointmentModal && selectedPatient && (
        <QuickAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedPatient(null);
          }}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add New Patient
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientList;
