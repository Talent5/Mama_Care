import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Heart, Users, Target } from 'lucide-react';

interface InsightData {
  totalPatients: number;
  highRiskPatients: number;
  ancCompletionRate: number;
  activePatients: number;
}

interface InsightsPanelProps {
  data: InsightData;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ data }) => {
  const insights = [
    {
      title: 'Patient Growth',
      value: '+15.3%',
      description: 'New registrations this month',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-500'
    },
    {
      title: 'ANC Compliance',
      value: `${data.ancCompletionRate}%`,
      description: 'Meeting WHO standards (>75%)',
      trend: data.ancCompletionRate > 75 ? 'up' : 'down',
      icon: Heart,
      color: data.ancCompletionRate > 75 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700',
      iconColor: data.ancCompletionRate > 75 ? 'text-green-500' : 'text-yellow-500'
    },
    {
      title: 'Risk Management',
      value: `${Math.round((data.highRiskPatients / data.totalPatients) * 100)}%`,
      description: 'High-risk patients monitored',
      trend: 'stable',
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-700',
      iconColor: 'text-orange-500'
    },
    {
      title: 'Engagement Rate',
      value: `${Math.round((data.activePatients / data.totalPatients) * 100)}%`,
      description: 'Active patient participation',
      trend: 'up',
      icon: Target,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-500'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Live Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${insight.color.split(' ')[0]} ${insight.color.split(' ')[1]}`}>
                <insight.icon className={`w-5 h-5 ${insight.iconColor}`} />
              </div>
              {getTrendIcon(insight.trend)}
            </div>
            
            <div className="mb-1">
              <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
              <div className="text-2xl font-bold text-gray-900 mb-1">{insight.value}</div>
              <p className="text-xs text-gray-500">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Health System Performance Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#e9f8e7] to-[#c0e6b9] rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Heart className="w-5 h-5 text-[#4ea674]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#023337]">System Health Score</h4>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[#023337]">
                {Math.round((data.ancCompletionRate + (data.activePatients / data.totalPatients) * 100) / 2)}%
              </div>
              <span className="text-sm text-[#4ea674] font-medium">Excellent Performance</span>
            </div>
            <p className="text-sm text-[#023337] opacity-80">
              Based on ANC compliance and patient engagement metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
