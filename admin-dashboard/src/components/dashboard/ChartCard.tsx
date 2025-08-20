import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type: 'bar' | 'doughnut' | 'line';
}

const ChartCard: React.FC<ChartCardProps> = ({ title, data, type }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const renderBarChart = () => (
    <div className="space-y-2 sm:space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2 sm:gap-3">
          <div className="w-16 sm:w-20 text-xs sm:text-sm text-gray-600 font-medium truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3 min-w-0">
            <div
              className="h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, (item.value / maxValue) * 100)}%`,
                backgroundColor: item.color || '#4ea674'
              }}
            />
          </div>
          <div className="w-8 sm:w-12 text-xs sm:text-sm font-medium text-gray-900 text-right">
            {item.value}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderDoughnutChart = () => {
    const total = data.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0) || 1; // Ensure non-zero total
    let currentAngle = 0;
    
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            {data.map((item, index) => {
              const value = Number.isFinite(item.value) ? item.value : 0;
              const strokeDasharray = Math.max(0, (value / total) * 283);
              const strokeDashoffset = Math.max(0, 283 - currentAngle);
              currentAngle += strokeDasharray;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={item.color || '#4ea674'}
                  strokeWidth="8"
                  strokeDasharray={`${strokeDasharray.toFixed(2)} 283`}
                  strokeDashoffset={strokeDashoffset.toFixed(2)}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{total.toFixed(0)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 sm:space-y-2 w-full sm:w-auto">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 justify-between sm:justify-start">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color || '#4ea674' }}
                />
                <span className="text-xs sm:text-sm text-gray-600 truncate">{item.label}</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0">
                {Number.isFinite(item.value) ? item.value.toFixed(0) : '0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((item, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (item.value / maxValue) * 80
    }));

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="relative h-24 sm:h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ea674" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#4ea674" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path
              d={`${pathData} L 100 100 L 0 100 Z`}
              fill="url(#lineGradient)"
              className="transition-all duration-500"
            />
            <path
              d={pathData}
              fill="none"
              stroke="#4ea674"
              strokeWidth="2"
              className="transition-all duration-500"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="2"
                fill="#4ea674"
                className="transition-all duration-500 hover:r-3"
              />
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:justify-between gap-2 text-xs text-gray-500">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="truncate">{item.label}</div>
              <div className="font-medium text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-[#4ea674] group h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{title}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#4ea674] animate-pulse"></div>
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4ea674] transition-colors" />
        </div>
      </div>
      
      <div className="flex-grow">
        {type === 'bar' && renderBarChart()}
        {type === 'doughnut' && renderDoughnutChart()}
        {type === 'line' && renderLineChart()}
      </div>
    </div>
  );
};

export default ChartCard;