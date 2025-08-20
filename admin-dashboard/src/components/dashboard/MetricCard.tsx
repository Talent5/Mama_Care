import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  trend?: number[];
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  trend = []
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      default: return null;
    }
  };

  const ChangeIcon = getChangeIcon();

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-[#4ea674] group h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 sm:p-3 rounded-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: '#c0e6b9' }}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300" style={{ color: '#023337' }} />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-right min-w-0">
          {ChangeIcon && (
            <ChangeIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${getChangeColor()} flex-shrink-0`} />
          )}
          <span className={`text-xs sm:text-sm font-medium ${getChangeColor()} truncate`}>
            {change}
          </span>
        </div>
      </div>
      
      <div className="mb-4 flex-grow">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 leading-tight">{value}</h3>
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{title}</p>
      </div>

      {trend.length > 0 && (
        <div className="mt-auto">
          <div className="flex items-end gap-0.5 sm:gap-1 h-6 sm:h-8 mb-2">
            {trend.map((point, index) => (
              <div
                key={index}
                className="flex-1 rounded-t transition-all duration-300 hover:opacity-80 min-w-[2px]"
                style={{
                  backgroundColor: changeType === 'positive' ? '#4ea674' : changeType === 'negative' ? '#ef4444' : '#c0e6b9',
                  height: `${Math.max(15, (point / Math.max(...trend)) * 100)}%`
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="truncate">7 days ago</span>
            <span className="truncate">Today</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;