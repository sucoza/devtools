import React from 'react';
import { clsx } from 'clsx';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Palette,
  Type,
  Ruler,
  Zap
} from 'lucide-react';
import { useDesignSystemInspector } from '../../hooks';

export function DashboardTab() {
  const { state } = useDesignSystemInspector();
  const { stats } = state;
  
  const consistencyScore = Math.round(stats.consistencyScore);
  const accessibilityScore = Math.round(stats.accessibilityScore);
  const tokensUtilization = Math.round(stats.tokensUtilization);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const overviewCards = [
    {
      title: 'Consistency Score',
      value: `${consistencyScore}%`,
      icon: TrendingUp,
      color: getScoreColor(consistencyScore),
      bg: getScoreBg(consistencyScore),
      description: 'Overall design system consistency',
    },
    {
      title: 'Accessibility Score',
      value: `${accessibilityScore}%`,
      icon: CheckCircle,
      color: getScoreColor(accessibilityScore),
      bg: getScoreBg(accessibilityScore),
      description: 'WCAG compliance rating',
    },
    {
      title: 'Token Utilization',
      value: `${tokensUtilization}%`,
      icon: Zap,
      color: getScoreColor(tokensUtilization),
      bg: getScoreBg(tokensUtilization),
      description: 'Design tokens being used',
    },
    {
      title: 'Issues Found',
      value: stats.totalIssues,
      icon: AlertCircle,
      color: stats.totalIssues > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
      bg: stats.totalIssues > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900',
      description: 'Design inconsistencies detected',
    },
  ];

  const detailCards = [
    {
      title: 'Components',
      value: stats.totalComponents,
      icon: '🧩',
      description: 'React components analyzed',
    },
    {
      title: 'Design Tokens',
      value: stats.totalTokens,
      icon: '🎨',
      description: 'Tokens discovered in codebase',
    },
    {
      title: 'Last Analysis',
      value: stats.lastAnalysis ? formatTime(stats.lastAnalysis) : 'Never',
      icon: '🕒',
      description: 'Most recent scan completed',
    },
    {
      title: 'Analysis Time',
      value: `${Math.round(stats.analysisTime)}ms`,
      icon: '⚡',
      description: 'Time to complete last scan',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Design System Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your design system&apos;s health and consistency across your application.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className={clsx('p-2 rounded-lg', card.bg)}>
                <card.icon className={clsx('w-5 h-5', card.color)} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className={clsx('text-2xl font-bold', card.color)}>
                  {card.value}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consistency Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Consistency Breakdown
          </h3>
          <div className="space-y-3">
            <ConsistencyItem
              icon={<Palette className="w-4 h-4" />}
              label="Colors"
              score={85}
              description="Color token usage and accessibility"
            />
            <ConsistencyItem
              icon={<Type className="w-4 h-4" />}
              label="Typography"
              score={92}
              description="Font scale and text consistency"
            />
            <ConsistencyItem
              icon={<Ruler className="w-4 h-4" />}
              label="Spacing"
              score={78}
              description="Margin, padding, and layout spacing"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Details
          </h3>
          <div className="space-y-3">
            {detailCards.map((card) => (
              <div key={card.title} className="flex items-center">
                <span className="text-lg mr-3">{card.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {card.title}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {card.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommendations
        </h3>
        <div className="space-y-3">
          {stats.totalIssues > 0 && (
            <RecommendationItem
              type="warning"
              title="Address Consistency Issues"
              description={`You have ${stats.totalIssues} design inconsistencies that could be resolved.`}
              action="View Issues"
            />
          )}
          {tokensUtilization < 80 && (
            <RecommendationItem
              type="info"
              title="Improve Token Adoption"
              description="Consider creating more design tokens for commonly used values."
              action="View Tokens"
            />
          )}
          {stats.totalComponents < 10 && (
            <RecommendationItem
              type="info"
              title="Component Documentation"
              description="Document your components to improve design system adoption."
              action="View Components"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConsistencyItem({ 
  icon, 
  label, 
  score 
}: { 
  icon: React.ReactNode; 
  label: string; 
  score: number; 
  description: string; 
}) {
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="flex items-center">
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        {icon}
        <span className="ml-2 text-sm font-medium">{label}</span>
      </div>
      <div className="ml-auto flex items-center">
        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={clsx('text-sm font-semibold', scoreColor)}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function RecommendationItem({
  type,
  title,
  description,
  action
}: {
  type: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  action: string;
}) {
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  return (
    <div className={clsx('p-4 rounded-lg border', typeStyles[type])}>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
        {title}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {description}
      </p>
      <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 mt-2 font-medium">
        {action} →
      </button>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}