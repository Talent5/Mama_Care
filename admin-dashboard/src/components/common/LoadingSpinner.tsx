import React from 'react';
import { Heart } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-[#4ea674]`}></div>
        <Heart className={`${sizeClasses[size]} absolute inset-0 text-[#4ea674] animate-pulse`} />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
