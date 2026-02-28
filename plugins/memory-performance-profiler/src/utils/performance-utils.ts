/**
 * Performance utility functions for Core Web Vitals and metrics analysis
 */

/**
 * Core Web Vitals thresholds
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // milliseconds
  FID: { good: 100, needsImprovement: 300 }, // milliseconds  
  CLS: { good: 0.1, needsImprovement: 0.25 }, // unitless
  FCP: { good: 1800, needsImprovement: 3000 }, // milliseconds
  TTFB: { good: 800, needsImprovement: 1800 } // milliseconds
} as const;

export type CoreWebVitalScore = 'good' | 'needs-improvement' | 'poor';

/**
 * Get Core Web Vital score based on value and metric type
 */
export function getCoreWebVitalScore(
  value: number, 
  metric: keyof typeof CORE_WEB_VITALS_THRESHOLDS
): CoreWebVitalScore {
  const thresholds = CORE_WEB_VITALS_THRESHOLDS[metric];
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculatePerformanceScore(metrics: {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}): number {
  const scores: number[] = [];
  
  if (metrics.lcp !== undefined) {
    const score = getCoreWebVitalScore(metrics.lcp, 'LCP');
    scores.push(score === 'good' ? 100 : score === 'needs-improvement' ? 60 : 30);
  }
  
  if (metrics.fid !== undefined) {
    const score = getCoreWebVitalScore(metrics.fid, 'FID');
    scores.push(score === 'good' ? 100 : score === 'needs-improvement' ? 60 : 30);
  }
  
  if (metrics.cls !== undefined) {
    const score = getCoreWebVitalScore(metrics.cls, 'CLS');
    scores.push(score === 'good' ? 100 : score === 'needs-improvement' ? 60 : 30);
  }
  
  if (metrics.fcp !== undefined) {
    const score = getCoreWebVitalScore(metrics.fcp, 'FCP');
    scores.push(score === 'good' ? 100 : score === 'needs-improvement' ? 70 : 40);
  }
  
  if (metrics.ttfb !== undefined) {
    const score = getCoreWebVitalScore(metrics.ttfb, 'TTFB');
    scores.push(score === 'good' ? 100 : score === 'needs-improvement' ? 70 : 40);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
}

/**
 * Analyze performance trends over time
 */
export function analyzePerformanceTrends(
  performanceHistory: Array<{
    timestamp: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
  }>,
  windowSize: number = 10
): {
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  metrics: {
    [K in keyof typeof CORE_WEB_VITALS_THRESHOLDS]?: {
      trend: 'improving' | 'declining' | 'stable';
      changeRate: number;
    };
  };
} {
  if (performanceHistory.length < windowSize) {
    return { trend: 'stable', confidence: 0, metrics: {} };
  }

  const recentData = performanceHistory.slice(-windowSize);
  const metrics: any = {};
  const trendScores: number[] = [];

  // Analyze each metric
  (['LCP', 'FID', 'CLS', 'FCP'] as const).forEach(metricKey => {
    const key = metricKey.toLowerCase() as keyof (typeof recentData)[0];
    const values = recentData
      .map(d => d[key])
      .filter(v => v !== undefined) as number[];

    if (values.length >= 3) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const changeRate = firstValue === 0 ? 0 : (lastValue - firstValue) / firstValue;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      
      // For metrics where lower is better (LCP, FID, FCP)
      if (['LCP', 'FID', 'FCP'].includes(metricKey)) {
        if (changeRate < -0.1) trend = 'improving';
        else if (changeRate > 0.1) trend = 'declining';
      } 
      // For CLS where lower is better too
      else if (metricKey === 'CLS') {
        if (changeRate < -0.1) trend = 'improving';
        else if (changeRate > 0.1) trend = 'declining';
      }

      metrics[metricKey] = { trend, changeRate };
      
      // Score the trend (-1 for declining, 0 for stable, 1 for improving)
      const trendScore = trend === 'improving' ? 1 : trend === 'declining' ? -1 : 0;
      trendScores.push(trendScore);
    }
  });

  // Overall trend
  const averageTrendScore = trendScores.length > 0 
    ? trendScores.reduce((sum, score) => sum + score, 0) / trendScores.length 
    : 0;

  let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (averageTrendScore > 0.3) overallTrend = 'improving';
  else if (averageTrendScore < -0.3) overallTrend = 'declining';

  const confidence = trendScores.length > 0 ? Math.abs(averageTrendScore) : 0;

  return { trend: overallTrend, confidence, metrics };
}

/**
 * Generate performance recommendations based on metrics
 */
export function generatePerformanceRecommendations(metrics: {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}): Array<{
  metric: string;
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}> {
  const recommendations: Array<{
    metric: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }> = [];

  // LCP recommendations
  if (metrics.lcp !== undefined && metrics.lcp > CORE_WEB_VITALS_THRESHOLDS.LCP.good) {
    const priority = metrics.lcp > CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement ? 'high' : 'medium';
    recommendations.push({
      metric: 'LCP',
      issue: `Largest Contentful Paint is ${(metrics.lcp / 1000).toFixed(1)}s`,
      recommendation: 'Optimize images, implement lazy loading, reduce server response times, and remove unused JavaScript',
      priority,
      impact: 'Improves perceived loading performance and user experience'
    });
  }

  // FID recommendations  
  if (metrics.fid !== undefined && metrics.fid > CORE_WEB_VITALS_THRESHOLDS.FID.good) {
    const priority = metrics.fid > CORE_WEB_VITALS_THRESHOLDS.FID.needsImprovement ? 'high' : 'medium';
    recommendations.push({
      metric: 'FID',
      issue: `First Input Delay is ${metrics.fid.toFixed(0)}ms`,
      recommendation: 'Reduce JavaScript execution time, implement code splitting, and optimize third-party scripts',
      priority,
      impact: 'Improves interactivity and responsiveness to user inputs'
    });
  }

  // CLS recommendations
  if (metrics.cls !== undefined && metrics.cls > CORE_WEB_VITALS_THRESHOLDS.CLS.good) {
    const priority = metrics.cls > CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement ? 'high' : 'medium';
    recommendations.push({
      metric: 'CLS',
      issue: `Cumulative Layout Shift is ${metrics.cls.toFixed(3)}`,
      recommendation: 'Add explicit dimensions to images and videos, reserve space for dynamic content, and avoid inserting content above existing content',
      priority,
      impact: 'Reduces visual instability and improves user experience'
    });
  }

  // FCP recommendations
  if (metrics.fcp !== undefined && metrics.fcp > CORE_WEB_VITALS_THRESHOLDS.FCP.good) {
    const priority = metrics.fcp > CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement ? 'high' : 'medium';
    recommendations.push({
      metric: 'FCP',
      issue: `First Contentful Paint is ${(metrics.fcp / 1000).toFixed(1)}s`,
      recommendation: 'Optimize critical rendering path, reduce render-blocking resources, and implement resource hints',
      priority,
      impact: 'Improves perceived loading speed and user engagement'
    });
  }

  // TTFB recommendations
  if (metrics.ttfb !== undefined && metrics.ttfb > CORE_WEB_VITALS_THRESHOLDS.TTFB.good) {
    const priority = metrics.ttfb > CORE_WEB_VITALS_THRESHOLDS.TTFB.needsImprovement ? 'high' : 'medium';
    recommendations.push({
      metric: 'TTFB',
      issue: `Time to First Byte is ${(metrics.ttfb / 1000).toFixed(1)}s`,
      recommendation: 'Optimize server performance, implement caching, use a CDN, and reduce database query times',
      priority,
      impact: 'Improves initial server response time and overall loading speed'
    });
  }

  return recommendations;
}

/**
 * Calculate render performance metrics
 */
export function calculateRenderPerformance(
  renderTimes: number[],
  targetFPS: number = 60
): {
  averageRenderTime: number;
  p95RenderTime: number;
  jankCount: number;
  averageFPS: number;
  efficiency: number;
} {
  if (renderTimes.length === 0) {
    return {
      averageRenderTime: 0,
      p95RenderTime: 0,
      jankCount: 0,
      averageFPS: 0,
      efficiency: 0
    };
  }

  const sortedTimes = [...renderTimes].sort((a, b) => a - b);
  const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p95RenderTime = sortedTimes[p95Index] || 0;

  // Calculate jank (frames taking longer than 16.67ms for 60fps)
  const frameThreshold = 1000 / targetFPS; // 16.67ms for 60fps
  const jankCount = renderTimes.filter(time => time > frameThreshold).length;

  // Calculate average FPS
  const averageFPS = averageRenderTime > 0 ? 1000 / averageRenderTime : 0;

  // Calculate efficiency (0-1 score)
  const efficiency = Math.max(0, 1 - (jankCount / renderTimes.length));

  return {
    averageRenderTime,
    p95RenderTime,
    jankCount,
    averageFPS: Math.min(averageFPS, targetFPS),
    efficiency
  };
}

/**
 * Detect performance regressions
 */
export function detectPerformanceRegression(
  baselineMetrics: { lcp?: number; fid?: number; cls?: number },
  currentMetrics: { lcp?: number; fid?: number; cls?: number },
  thresholdPercent: number = 10
): {
  hasRegression: boolean;
  regressions: Array<{
    metric: string;
    baselineValue: number;
    currentValue: number;
    percentageChange: number;
  }>;
} {
  const regressions: Array<{
    metric: string;
    baselineValue: number;
    currentValue: number;
    percentageChange: number;
  }> = [];

  // Check each metric for regression
  (['lcp', 'fid', 'cls'] as const).forEach(metric => {
    const baseline = baselineMetrics[metric];
    const current = currentMetrics[metric];

    if (baseline !== undefined && current !== undefined && baseline > 0) {
      const percentageChange = ((current - baseline) / baseline) * 100;
      
      // Performance regression if current is significantly worse than baseline
      if (percentageChange > thresholdPercent) {
        regressions.push({
          metric: metric.toUpperCase(),
          baselineValue: baseline,
          currentValue: current,
          percentageChange
        });
      }
    }
  });

  return {
    hasRegression: regressions.length > 0,
    regressions
  };
}

/**
 * Format performance metric values for display
 */
export function formatPerformanceMetric(
  value: number, 
  metric: keyof typeof CORE_WEB_VITALS_THRESHOLDS
): string {
  switch (metric) {
    case 'LCP':
    case 'FID':
    case 'FCP':
    case 'TTFB':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
    case 'CLS':
      return value.toFixed(3);
    default:
      return value.toString();
  }
}

/**
 * Calculate performance budget status
 */
export function calculatePerformanceBudgetStatus(
  metrics: { lcp?: number; fid?: number; cls?: number },
  budget: { lcp?: number; fid?: number; cls?: number }
): {
  isWithinBudget: boolean;
  violations: Array<{
    metric: string;
    actual: number;
    budget: number;
    overage: number;
  }>;
} {
  const violations: Array<{
    metric: string;
    actual: number;
    budget: number;
    overage: number;
  }> = [];

  (['lcp', 'fid', 'cls'] as const).forEach(metric => {
    const actual = metrics[metric];
    const budgetValue = budget[metric];

    if (actual !== undefined && budgetValue !== undefined && actual > budgetValue) {
      violations.push({
        metric: metric.toUpperCase(),
        actual,
        budget: budgetValue,
        overage: actual - budgetValue
      });
    }
  });

  return {
    isWithinBudget: violations.length === 0,
    violations
  };
}