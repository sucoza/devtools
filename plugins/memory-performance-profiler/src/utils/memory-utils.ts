/**
 * Memory utility functions for formatting, calculations, and analysis
 */

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format bytes per second to human-readable rate
 */
export function formatBytesPerSecond(bytesPerSecond: number, decimals: number = 1): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];

  const i = Math.floor(Math.log(Math.abs(bytesPerSecond)) / Math.log(k));

  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate memory utilization percentage
 */
export function calculateMemoryUtilization(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(used / limit, 1);
}

/**
 * Determine memory pressure level based on utilization
 */
export function getMemoryPressureLevel(utilization: number): 'low' | 'medium' | 'high' {
  if (utilization > 0.8) return 'high';
  if (utilization > 0.6) return 'medium';
  return 'low';
}

/**
 * Calculate memory growth rate from timeline data
 */
export function calculateGrowthRate(
  timeline: Array<{ timestamp: number; usedMemory: number }>,
  windowSize: number = 5
): number {
  if (timeline.length < 2) return 0;

  const recentPoints = timeline.slice(-windowSize);
  if (recentPoints.length < 2) return 0;

  const firstPoint = recentPoints[0];
  const lastPoint = recentPoints[recentPoints.length - 1];
  
  const timeDiff = (lastPoint.timestamp - firstPoint.timestamp) / 1000; // seconds
  const memoryDiff = lastPoint.usedMemory - firstPoint.usedMemory;

  return timeDiff > 0 ? memoryDiff / timeDiff : 0;
}

/**
 * Detect memory leak patterns using statistical analysis
 */
export function detectMemoryLeakPattern(
  timeline: Array<{ timestamp: number; usedMemory: number }>,
  minPoints: number = 10,
  growthThreshold: number = 1024 * 10 // 10KB per sample
): {
  isLeak: boolean;
  confidence: number;
  growthRate: number;
  patternType: 'linear' | 'exponential' | 'periodic' | 'none';
} {
  if (timeline.length < minPoints) {
    return { isLeak: false, confidence: 0, growthRate: 0, patternType: 'none' };
  }

  // Linear regression analysis
  const n = timeline.length;
  const sumX = timeline.reduce((sum, _, index) => sum + index, 0);
  const sumY = timeline.reduce((sum, point) => sum + point.usedMemory, 0);
  const sumXY = timeline.reduce((sum, point, index) => sum + index * point.usedMemory, 0);
  const sumXX = timeline.reduce((sum, _, index) => sum + index * index, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared for confidence
  const meanY = sumY / n;
  const ssRes = timeline.reduce((sum, point, index) => {
    const predicted = slope * index + intercept;
    return sum + Math.pow(point.usedMemory - predicted, 2);
  }, 0);
  const ssTot = timeline.reduce((sum, point) => {
    return sum + Math.pow(point.usedMemory - meanY, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  // Analyze growth pattern
  let patternType: 'linear' | 'exponential' | 'periodic' | 'none' = 'none';
  let confidence = Math.max(0, rSquared);

  if (slope > growthThreshold && rSquared > 0.7) {
    patternType = 'linear';
    confidence = rSquared;
  } else {
    // Check for exponential growth
    const logValues = timeline.map(point => Math.log(Math.max(point.usedMemory, 1)));
    const logSumY = logValues.reduce((sum, val) => sum + val, 0);
    const logSumXY = logValues.reduce((sum, val, index) => sum + index * val, 0);
    const logSlope = (n * logSumXY - sumX * logSumY) / (n * sumXX - sumX * sumX);
    
    if (logSlope > 0.01 && timeline[timeline.length - 1].usedMemory > timeline[0].usedMemory * 1.5) {
      patternType = 'exponential';
      confidence = Math.min(0.9, confidence + 0.2);
    }
  }

  const isLeak = slope > growthThreshold && confidence > 0.6;

  return {
    isLeak,
    confidence,
    growthRate: slope,
    patternType
  };
}

/**
 * Calculate memory fragmentation estimate
 */
export function estimateFragmentation(
  usedMemory: number,
  totalMemory: number,
  allocationCount: number
): number {
  if (totalMemory === 0 || allocationCount === 0) return 0;
  
  const utilization = usedMemory / totalMemory;
  const averageAllocationSize = usedMemory / allocationCount;
  
  // Simple fragmentation estimate based on allocation patterns
  const fragmentationFactor = Math.max(0, 1 - (averageAllocationSize / (totalMemory / 1000)));
  
  return Math.min(1, fragmentationFactor * (1 - utilization));
}

/**
 * Calculate memory efficiency score (0-1)
 */
export function calculateMemoryEfficiency(
  usedMemory: number,
  totalMemory: number,
  renderCount: number,
  componentCount: number
): number {
  if (totalMemory === 0 || componentCount === 0) return 0;

  const utilization = usedMemory / totalMemory;
  const memoryPerComponent = usedMemory / componentCount;
  const memoryPerRender = renderCount > 0 ? usedMemory / renderCount : usedMemory;

  // Normalize factors (lower is better for efficiency)
  const utilizationScore = Math.max(0, 1 - Math.pow(utilization, 2)); // Quadratic penalty for high utilization
  const componentScore = Math.max(0, 1 - (memoryPerComponent / (1024 * 1024))); // 1MB per component baseline
  const renderScore = Math.max(0, 1 - (memoryPerRender / (1024 * 100))); // 100KB per render baseline

  // Weighted average
  return (utilizationScore * 0.4 + componentScore * 0.3 + renderScore * 0.3);
}

/**
 * Predict future memory usage based on current trends
 */
export function predictMemoryUsage(
  timeline: Array<{ timestamp: number; usedMemory: number }>,
  futureSeconds: number
): {
  predicted: number;
  confidence: number;
  method: 'linear' | 'exponential' | 'average';
} {
  if (timeline.length < 3) {
    return { predicted: 0, confidence: 0, method: 'average' };
  }

  const recentPoints = timeline.slice(-Math.min(timeline.length, 20)); // Use last 20 points
  const leakAnalysis = detectMemoryLeakPattern(recentPoints);

  if (leakAnalysis.isLeak && leakAnalysis.confidence > 0.7) {
    // Use trend-based prediction
    const currentMemory = timeline[timeline.length - 1].usedMemory;
    const predicted = currentMemory + (leakAnalysis.growthRate * futureSeconds);
    
    return {
      predicted: Math.max(0, predicted),
      confidence: leakAnalysis.confidence,
      method: leakAnalysis.patternType === 'exponential' ? 'exponential' : 'linear'
    };
  } else {
    // Use simple average
    const avgMemory = recentPoints.reduce((sum, p) => sum + p.usedMemory, 0) / recentPoints.length;
    return {
      predicted: avgMemory,
      confidence: 0.5,
      method: 'average'
    };
  }
}

/**
 * Generate memory usage summary statistics
 */
export function generateMemoryStats(
  timeline: Array<{ timestamp: number; usedMemory: number; totalMemory?: number }>
): {
  current: number;
  min: number;
  max: number;
  average: number;
  median: number;
  standardDeviation: number;
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  };
  duration: number;
} {
  if (timeline.length === 0) {
    return {
      current: 0,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      standardDeviation: 0,
      trend: { direction: 'stable', strength: 0 },
      duration: 0
    };
  }

  const memoryValues = timeline.map(p => p.usedMemory);
  const sortedValues = [...memoryValues].sort((a, b) => a - b);
  
  const current = memoryValues[memoryValues.length - 1];
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const average = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];

  // Calculate standard deviation
  const variance = memoryValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / memoryValues.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate trend
  const leakAnalysis = detectMemoryLeakPattern(timeline);
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(leakAnalysis.growthRate) > 1024) { // 1KB threshold
    direction = leakAnalysis.growthRate > 0 ? 'increasing' : 'decreasing';
  }

  const duration = timeline.length > 1 
    ? timeline[timeline.length - 1].timestamp - timeline[0].timestamp 
    : 0;

  return {
    current,
    min,
    max,
    average,
    median,
    standardDeviation,
    trend: {
      direction,
      strength: leakAnalysis.confidence
    },
    duration
  };
}

/**
 * Compare two memory snapshots
 */
export function compareMemorySnapshots(
  snapshot1: { usedMemory: number; timestamp: number },
  snapshot2: { usedMemory: number; timestamp: number }
): {
  memoryDelta: number;
  timeDelta: number;
  rate: number;
  percentageChange: number;
} {
  const memoryDelta = snapshot2.usedMemory - snapshot1.usedMemory;
  const timeDelta = snapshot2.timestamp - snapshot1.timestamp;
  const rate = timeDelta > 0 ? memoryDelta / (timeDelta / 1000) : 0; // bytes per second
  const percentageChange = snapshot1.usedMemory > 0 ? (memoryDelta / snapshot1.usedMemory) * 100 : 0;

  return {
    memoryDelta,
    timeDelta,
    rate,
    percentageChange
  };
}