import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportData {
  totalPatients?: number;
  activePatients?: number;
  highRiskPatients?: number;
  ancCompletionRate?: number;
  todaysAppointments?: number;
  pendingAppointments?: number;
  riskDistribution?: {
    low: number;
    medium: number;
    high: number;
  };
  ancVisitsByStage?: Record<string, number>;
  monthlyTrends?: Array<{
    _id: string;
    count: number;
  }>;
  [key: string]: unknown;
}

interface ExportButtonProps {
  data: ExportData;
  filename?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename = 'dashboard-data' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToJSON = () => {
    setExporting(true);
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const convertToCSV = (data: ExportData) => {
    if (!data) return '';
    
    const headers = ['Metric', 'Value', 'Type'];
    const rows = [
      ['Total Patients', data.totalPatients, 'Count'],
      ['Active Patients', data.activePatients, 'Count'],
      ['High Risk Patients', data.highRiskPatients, 'Count'],
      ['ANC Completion Rate', `${data.ancCompletionRate}%`, 'Percentage'],
      ['Today\'s Appointments', data.todaysAppointments, 'Count'],
      ['Pending Appointments', data.pendingAppointments, 'Count']
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  };

  const exportOptions = [
    {
      label: 'Export as JSON',
      icon: FileText,
      action: exportToJSON,
      description: 'Complete data structure'
    },
    {
      label: 'Export as CSV',
      icon: FileSpreadsheet,
      action: exportToCSV,
      description: 'Spreadsheet format'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#4ea674] transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {exporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Export Options
            </div>
            {exportOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <option.icon className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;
