import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send, Bell, Phone, Clock, User } from 'lucide-react';
import { alertsAPI, patientsAPI } from '../../services/api';
import type { Patient } from '../../types/api';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
}

const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName
}) => {
  const [alertData, setAlertData] = useState({
    patientId: patientId || '',
    patientName: patientName || '',
    alertType: 'emergency',
    severity: 'critical',
    message: '',
    description: '',
    notifyTeam: true,
    callEmergency: false
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState(patientName || '');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId && patientName) {
      setAlertData(prev => ({
        ...prev,
        patientId,
        patientName
      }));
      setSearchQuery(patientName);
    }
  }, [patientId, patientName]);

  if (!isOpen) return null;

  const emergencyTypes = [
    {
      value: 'medical_emergency',
      label: 'Medical Emergency',
      description: 'Immediate medical attention required',
      severity: 'critical',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'obstetric_emergency',
      label: 'Obstetric Emergency',
      description: 'Pregnancy-related emergency',
      severity: 'critical',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'hemorrhage',
      label: 'Hemorrhage',
      description: 'Severe bleeding requiring immediate attention',
      severity: 'critical',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'preeclampsia',
      label: 'Severe Preeclampsia',
      description: 'Dangerous increase in blood pressure',
      severity: 'critical',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'fetal_distress',
      label: 'Fetal Distress',
      description: 'Concerns about baby\'s wellbeing',
      severity: 'critical',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'urgent_consultation',
      label: 'Urgent Consultation',
      description: 'Immediate doctor consultation needed',
      severity: 'warning',
      icon: Bell,
      color: 'orange'
    }
  ];

  const searchPatients = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await patientsAPI.getPatients({ search: query });
      setPatients(response.data?.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setAlertData(prev => ({
      ...prev,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`
    }));
    setSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setIsSearching(false);
  };

  const handleAlertTypeChange = (type: string) => {
    const selectedType = emergencyTypes.find(t => t.value === type);
    setAlertData(prev => ({
      ...prev,
      alertType: type,
      severity: selectedType?.severity || 'critical',
      message: selectedType?.label || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!alertData.patientId || !alertData.message) {
        setError('Please select a patient and alert type');
        setLoading(false);
        return;
      }

      const emergencyAlert = {
        type: alertData.alertType,
        severity: alertData.severity,
        message: alertData.message,
        description: alertData.description,
        patientId: alertData.patientId,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      const response = await alertsAPI.createAlert(emergencyAlert);
      
      if (response.success) {
        // If emergency services should be called, show notification
        if (alertData.callEmergency) {
          alert('Emergency services will be contacted immediately!');
        }
        
        onClose();
        resetForm();
      } else {
        setError(response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setError('Failed to send emergency alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAlertData({
      patientId: '',
      patientName: '',
      alertType: 'emergency',
      severity: 'critical',
      message: '',
      description: '',
      notifyTeam: true,
      callEmergency: false
    });
    setSearchQuery('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'border-red-300 hover:border-red-400 hover:bg-red-50',
      orange: 'border-orange-300 hover:border-orange-400 hover:bg-orange-50',
      yellow: 'border-yellow-300 hover:border-yellow-400 hover:bg-yellow-50'
    };
    return colorMap[color] || colorMap.red;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Emergency Alert</h2>
                <p className="text-sm text-gray-600">Send urgent notification to medical team</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setSearchQuery(query);
                      setIsSearching(true);
                      if (!query) {
                        setAlertData(prev => ({ ...prev, patientId: '', patientName: '' }));
                        setPatients([]);
                      } else {
                        searchPatients(query);
                      }
                    }}
                    placeholder="Search for patient by name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />

                  {/* Search Results */}
                  {isSearching && searchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-3 text-gray-600">Searching...</div>
                      ) : patients.length > 0 ? (
                        patients.map((patient) => (
                          <button
                            key={patient._id}
                            type="button"
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                ID: {patient._id.slice(-8)}
                              </p>
                            </div>
                            <User className="w-4 h-4 text-gray-400" />
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-600">No patients found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Emergency Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleAlertTypeChange(type.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      alertData.alertType === type.value
                        ? 'border-red-500 bg-red-50'
                        : getTypeColor(type.color)
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <type.icon className={`w-5 h-5 mt-0.5 ${
                        type.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getSeverityColor(type.severity)}`}>
                          {type.severity}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                value={alertData.description}
                onChange={(e) => setAlertData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide additional details about the emergency situation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Notification Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notification Options
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={alertData.notifyTeam}
                    onChange={(e) => setAlertData(prev => ({ ...prev, notifyTeam: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Notify entire medical team immediately
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={alertData.callEmergency}
                    onChange={(e) => setAlertData(prev => ({ ...prev, callEmergency: e.target.checked }))}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Contact emergency services (911)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Summary */}
            {alertData.patientName && alertData.message && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Alert Summary
                </h3>
                <div className="space-y-1 text-sm text-red-800">
                  <p><strong>Patient:</strong> {alertData.patientName}</p>
                  <p><strong>Emergency Type:</strong> {alertData.message}</p>
                  <p><strong>Severity:</strong> {alertData.severity}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>Will be sent immediately upon confirmation</span>
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
              This will send an immediate alert to the medical team
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !alertData.patientId || !alertData.message}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Sending...' : 'Send Emergency Alert'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlertModal;
