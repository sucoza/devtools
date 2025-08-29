import { useState, useCallback, useMemo } from 'react';
import type { ChartDataPoint, ChartSeries } from '../components/PerformanceChart';

export interface UsePerformanceDataOptions {
  maxDataPoints?: number;
  timeWindowMs?: number;
}

export interface UsePerformanceDataReturn {
  series: ChartSeries[];
  addDataPoint: (seriesName: string, value: number, metadata?: Record<string, any>) => void;
  createSeries: (name: string, color: string, unit?: string, formatter?: (value: number) => string) => void;
  clearSeries: (seriesName?: string) => void;
  getLatestValue: (seriesName: string) => number | undefined;
  getAverageValue: (seriesName: string, timeRangeMs?: number) => number | undefined;
}

/**
 * Shared performance data management hook for all DevTools plugins
 * Provides consistent data collection and chart series management
 */
export function usePerformanceData({
  maxDataPoints = 100,
  timeWindowMs = 5 * 60 * 1000 // 5 minutes default
}: UsePerformanceDataOptions = {}): UsePerformanceDataReturn {
  
  const [seriesMap, setSeriesMap] = useState<Map<string, ChartSeries>>(new Map());

  const series = useMemo(() => Array.from(seriesMap.values()), [seriesMap]);

  const createSeries = useCallback((
    name: string, 
    color: string, 
    unit?: string, 
    formatter?: (value: number) => string
  ) => {
    setSeriesMap(prev => {
      const newMap = new Map(prev);
      newMap.set(name, {
        name,
        color,
        unit,
        formatter,
        data: []
      });
      return newMap;
    });
  }, []);

  const addDataPoint = useCallback((
    seriesName: string, 
    value: number, 
    metadata?: Record<string, any>
  ) => {
    const timestamp = Date.now();
    
    setSeriesMap(prev => {
      const newMap = new Map(prev);
      const existingSeries = newMap.get(seriesName);
      
      if (!existingSeries) {
        console.warn(`Series "${seriesName}" not found. Create it first with createSeries().`);
        return prev;
      }

      const newDataPoint: ChartDataPoint = {
        timestamp,
        value,
        metadata
      };

      // Add new point and maintain time window and max points
      let newData = [...existingSeries.data, newDataPoint];
      
      // Remove points outside time window
      const cutoffTime = timestamp - timeWindowMs;
      newData = newData.filter(point => point.timestamp >= cutoffTime);
      
      // Limit to max data points (keep most recent)
      if (newData.length > maxDataPoints) {
        newData = newData.slice(-maxDataPoints);
      }

      newMap.set(seriesName, {
        ...existingSeries,
        data: newData
      });

      return newMap;
    });
  }, [maxDataPoints, timeWindowMs]);

  const clearSeries = useCallback((seriesName?: string) => {
    setSeriesMap(prev => {
      if (seriesName) {
        const newMap = new Map(prev);
        const series = newMap.get(seriesName);
        if (series) {
          newMap.set(seriesName, { ...series, data: [] });
        }
        return newMap;
      } else {
        // Clear all series data
        const newMap = new Map();
        for (const [name, series] of prev.entries()) {
          newMap.set(name, { ...series, data: [] });
        }
        return newMap;
      }
    });
  }, []);

  const getLatestValue = useCallback((seriesName: string): number | undefined => {
    const series = seriesMap.get(seriesName);
    const latestPoint = series?.data[series.data.length - 1];
    return latestPoint?.value;
  }, [seriesMap]);

  const getAverageValue = useCallback((
    seriesName: string, 
    timeRangeMs: number = timeWindowMs
  ): number | undefined => {
    const series = seriesMap.get(seriesName);
    if (!series?.data.length) return undefined;

    const cutoffTime = Date.now() - timeRangeMs;
    const recentPoints = series.data.filter(point => point.timestamp >= cutoffTime);
    
    if (recentPoints.length === 0) return undefined;

    const sum = recentPoints.reduce((acc, point) => acc + point.value, 0);
    return sum / recentPoints.length;
  }, [seriesMap, timeWindowMs]);

  return {
    series,
    addDataPoint,
    createSeries,
    clearSeries,
    getLatestValue,
    getAverageValue
  };
}