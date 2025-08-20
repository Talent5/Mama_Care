import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'warning' | 'error';
  message: string;
  onClose: () => void;
  duration?: number;
}

const FloatingNotification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  onClose, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div 
      className={`fixed top-20 right-6 z-50 p-4 rounded-lg border shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getColors()}`}
      style={{ minWidth: '300px' }}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FloatingNotification;
