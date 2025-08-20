import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
    />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
        <Skeleton className="w-12 sm:w-16 h-3 sm:h-4" />
      </div>
      <div className="mb-4">
        <Skeleton className="w-16 sm:w-20 h-6 sm:h-8 mb-2" />
        <Skeleton className="w-24 sm:w-32 h-3 sm:h-4" />
      </div>
      <div className="flex items-end gap-0.5 sm:gap-1 h-6 sm:h-8">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="flex-1 h-3 sm:h-4" />
        ))}
      </div>
    </div>
  );
};

export const ChartCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Skeleton className="w-32 sm:w-40 h-5 sm:h-6" />
        <Skeleton className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <Skeleton className="w-full h-32 sm:h-40" />
    </div>
  );
};

export const QuickActionSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border-2 border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="w-24 h-4 mb-2" />
          <Skeleton className="w-32 h-3" />
        </div>
      </div>
    </div>
  );
};
