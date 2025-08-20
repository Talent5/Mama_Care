import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  AlertTriangle,
  Calendar,
  MapPin,
  Heart,
  Users
} from 'lucide-react';
import { patientsAPI } from '../../services/api';
import PatientDetailsModal from './PatientDetailsModal';
import QuickAppointmentModal from '../appointments/QuickAppointmentModal';
import AddPatientModal from './AddPatientModal';

interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalWeek?: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
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
  emergencyContact?: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

const PatientManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [error, setError] = useState('');

  // Check for patient ID in URL parameters
  useEffect(() => {
    const patientId = searchParams.get('id');
    if (patientId && patients.length > 0) {
      // Find the patient with the specified ID
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        // Remove the ID from URL to clean it up
        setSearchParams({});
      }
    }
  }, [searchParams, patients, setSearchParams]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientsAPI.getPatients();
      setPatients(response.data.patients.map(transformPatientData));
      setError('');
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const transformPatientData = (apiPatient: any): Patient => {
    // Ensure user data is populated
    if (!apiPatient.user) {
      console.error('Patient user data not populated:', apiPatient);
      return {
        id: apiPatient._id,
        name: 'Unknown Patient',
        age: 0,
        riskLevel: 'Low',
        lastVisit: 'Not recorded',
        nextAppointment: 'Not scheduled',
        ancVisits: 0,
        facility: apiPatient.facility || 'Unknown',
        region: apiPatient.region || 'Unknown',
        condition: 'Unknown',
        symptoms: 'None recorded'
      };
    }

    return {
      id: apiPatient._id,
      name: `${apiPatient.user.firstName} ${apiPatient.user.lastName}`,
      age: calculateAge(apiPatient.dateOfBirth),
      gestationalWeek: apiPatient.currentPregnancy?.gestationalAge,
      riskLevel: apiPatient.currentPregnancy?.riskLevel || 'Low',
      lastVisit: formatDate(apiPatient.lastVisit),
      nextAppointment: formatDate(apiPatient.nextAppointment),
      ancVisits: apiPatient.ancVisits || 0,
      facility: apiPatient.facility,
      region: apiPatient.region,
      condition: apiPatient.currentPregnancy?.condition || 'Normal',
      symptoms: apiPatient.currentPregnancy?.symptoms?.join(', ') || 'None',
      bloodPressure: apiPatient.vitals?.bloodPressure,
      bloodSugar: apiPatient.vitals?.bloodSugar,
      phone: apiPatient.user.phone,
      address: apiPatient.address,
      emergencyContact: apiPatient.emergencyContact,
      medicalHistory: apiPatient.medicalHistory,
      currentMedications: apiPatient.currentMedications,
      allergies: apiPatient.allergies
    };
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
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
      await loadPatients(); // Refresh data
      setError('');
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note');
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.facility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === 'all' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-red-50 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Critical':
      case 'High': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Low': return <Heart className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ea674] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600">Manage maternal health records and track patient progress</p>
        </div>
        <button
          onClick={() => setShowAddPatient(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: '#4ea674' }}
        >
          <Plus className="w-4 h-4" />
          Add New Patient
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gestational Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ANC Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {patient.facility}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(patient.riskLevel)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(patient.riskLevel)}`}>
                        {patient.riskLevel} risk
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{typeof patient.gestationalWeek === 'number' && patient.gestationalWeek >= 0 ? `${patient.gestationalWeek} weeks` : 'N/A weeks'}</div>
                    <div className="text-sm text-gray-500">Age: {typeof patient.age === 'number' && patient.age > 0 ? patient.age : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{typeof patient.ancVisits === 'number' ? patient.ancVisits : 0}/8</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${((typeof patient.ancVisits === 'number' ? patient.ancVisits : 0) / 8) * 100}%`,
                          backgroundColor: '#4ea674'
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.lastVisit && patient.lastVisit !== 'Invalid Date' ? patient.lastVisit : 'Not scheduled'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Calendar className="w-3 h-3" />
                      {patient.nextAppointment && patient.nextAppointment !== 'Invalid Date' ? patient.nextAppointment : 'Not scheduled'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewPatient(patient)}
                        className="text-[#4ea674] hover:text-[#3d8f5f] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleScheduleAppointment(patient)}
                        className="text-[#4ea674] hover:text-[#3d8f5f] transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewPatient(patient)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Total Patients</h3>
          <div className="text-3xl font-bold text-gray-900">{patients.length}</div>
          <p className="text-sm text-gray-600 mt-1">Active in system</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">High Risk Cases</h3>
          <div className="text-3xl font-bold text-red-600">
            {patients.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical').length}
          </div>
          <p className="text-sm text-gray-600 mt-1">Require immediate attention</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Appointments Due</h3>
          <div className="text-3xl font-bold text-orange-600">
            {patients.filter(p => new Date(p.nextAppointment) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
          </div>
          <p className="text-sm text-gray-600 mt-1">Next 7 days</p>
        </div>
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

      {/* Add Patient Modal */}
      {showAddPatient && (
        <AddPatientModal
          isOpen={showAddPatient}
          onClose={() => setShowAddPatient(false)}
          onPatientAdded={async () => {
            setShowAddPatient(false);
            await loadPatients();
          }}
        />
      )}
    </div>
  );
};

export default PatientManagement;