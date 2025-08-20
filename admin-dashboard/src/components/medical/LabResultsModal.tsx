import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';

interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  testDate: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  performedBy: string;
  notes?: string;
}

interface LabResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
}

const LabResultsModal: React.FC<LabResultsModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName
}) => {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [searchQuery, setSearchQuery] = useState(patientName || '');
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'abnormal' | 'critical' | 'pending'>('all');
  const [filterTestType, setFilterTestType] = useState<string>('all');
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [viewingResult, setViewingResult] = useState<LabResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Mock lab results data - in real app, this would come from API
      const mockResults: LabResult[] = [
        {
          id: '1',
          patientId: 'pat1',
          patientName: 'Mary Chikwanha',
          testType: 'Blood Pressure',
          testDate: '2024-08-18',
          result: '180/110 mmHg',
          normalRange: '90-120/60-80 mmHg',
          status: 'critical',
          performedBy: 'Nurse Sarah',
          notes: 'Urgent follow-up required'
        },
        {
          id: '2',
          patientId: 'pat2',
          patientName: 'Grace Mutapa',
          testType: 'Glucose Tolerance Test',
          testDate: '2024-08-18',
          result: '220 mg/dL',
          normalRange: '70-100 mg/dL',
          status: 'abnormal',
          performedBy: 'Lab Tech John',
          notes: 'Possible gestational diabetes'
        },
        {
          id: '3',
          patientId: 'pat3',
          patientName: 'Faith Moyo',
          testType: 'Hemoglobin Level',
          testDate: '2024-08-17',
          result: '11.2 g/dL',
          normalRange: '12.0-15.5 g/dL',
          status: 'normal',
          performedBy: 'Lab Tech Mary'
        },
        {
          id: '4',
          patientId: 'pat4',
          patientName: 'Ruth Sibanda',
          testType: 'Urine Analysis',
          testDate: '2024-08-17',
          result: 'Protein +2',
          normalRange: 'Negative',
          status: 'abnormal',
          performedBy: 'Lab Tech John',
          notes: 'Possible preeclampsia risk'
        },
        {
          id: '5',
          patientId: 'pat5',
          patientName: 'Blessing Mujuru',
          testType: 'Blood Count (CBC)',
          testDate: '2024-08-16',
          result: 'Pending',
          normalRange: 'Various ranges',
          status: 'pending',
          performedBy: 'Lab Tech Sarah'
        },
        {
          id: '6',
          patientId: 'pat1',
          patientName: 'Mary Chikwanha',
          testType: 'Fetal Heart Rate',
          testDate: '2024-08-15',
          result: '155 bpm',
          normalRange: '120-160 bpm',
          status: 'normal',
          performedBy: 'Dr. Mundwa'
        }
      ];
      
      setLabResults(mockResults);
      if (patientId && patientName) {
        setSelectedPatientId(patientId);
        setSearchQuery(patientName);
      }
    }
  }, [isOpen, patientId, patientName]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewingResult) {
          setViewingResult(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, viewingResult, onClose]);

  const filteredResults = labResults.filter(result => {
    const matchesPatient = selectedPatientId ? result.patientId === selectedPatientId : true;
    const matchesStatus = filterStatus === 'all' ? true : result.status === filterStatus;
    const matchesTestType = filterTestType === 'all' ? true : result.testType.toLowerCase().includes(filterTestType.toLowerCase());
    const matchesSearch = result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.testType.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPatient && matchesStatus && matchesTestType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'abnormal': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'abnormal': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'normal': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const testTypes = ['Blood Pressure', 'Glucose Test', 'Hemoglobin', 'Urine Analysis', 'Blood Count', 'Fetal Heart Rate'];

  const handleDownloadResult = (result: LabResult) => {
    // Mock download functionality
    alert(`Downloading ${result.testType} results for ${result.patientName}`);
  };

  const handleViewResult = (result: LabResult) => {
    setViewingResult(result);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lab Results</h2>
                <p className="text-sm text-gray-600">View and manage patient test results</p>
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

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Patient Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    // In real app, would implement patient search here
                  }}
                  placeholder="Search patient..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="critical">Critical</option>
                <option value="abnormal">Abnormal</option>
                <option value="normal">Normal</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Test Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
              <select
                value={filterTestType}
                onChange={(e) => setFilterTestType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tests</option>
                {testTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterTestType('all');
                  setSelectedPatientId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full" style={{ maxHeight: 'calc(90vh - 300px)' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient & Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Performer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{result.patientName}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{result.testType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{result.result}</div>
                        <div className="text-sm text-gray-500">Normal: {result.normalRange}</div>
                        {result.notes && (
                          <div className="text-sm text-blue-600 mt-1">{result.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="w-3 h-3" />
                          {new Date(result.testDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">by {result.performedBy}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewResult(result)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadResult(result)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredResults.length} of {labResults.length} results
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Result Detail Modal */}
      {viewingResult && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingResult(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Test Result Details</h3>
                <button
                  onClick={() => setViewingResult(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <p className="text-gray-900">{viewingResult.patientName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Test Type</label>
                    <p className="text-gray-900">{viewingResult.testType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Result</label>
                    <p className="text-gray-900">{viewingResult.result}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Normal Range</label>
                    <p className="text-gray-900">{viewingResult.normalRange}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">{new Date(viewingResult.testDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performed By</label>
                    <p className="text-gray-900">{viewingResult.performedBy}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(viewingResult.status)}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewingResult.status)}`}>
                      {viewingResult.status}
                    </span>
                  </div>
                </div>
                {viewingResult.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg mt-1">{viewingResult.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadResult(viewingResult)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              <button
                onClick={() => setViewingResult(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResultsModal;
