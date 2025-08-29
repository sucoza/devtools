import type { ExportData } from '../types/common';
import { formatDateTime } from './formatters';

/**
 * Common export utilities for all TanStack DevTools plugins
 */

export type ExportFormat = 'json' | 'csv' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  pretty?: boolean;
  includeMetadata?: boolean;
}

/**
 * Export data to file download
 */
export function exportData<T>(
  data: T,
  pluginName: string,
  pluginVersion: string,
  options: ExportOptions
): void {
  const exportData: ExportData<T> = {
    plugin: pluginName,
    version: pluginVersion,
    timestamp: Date.now(),
    data,
    ...(options.includeMetadata && {
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        exportTime: formatDateTime(Date.now())
      }
    })
  };

  let content: string;
  let mimeType: string;
  let defaultFilename: string;

  switch (options.format) {
    case 'json':
      content = JSON.stringify(exportData, null, options.pretty ? 2 : 0);
      mimeType = 'application/json';
      defaultFilename = `${pluginName}-export-${Date.now()}.json`;
      break;

    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv';
      defaultFilename = `${pluginName}-export-${Date.now()}.csv`;
      break;

    case 'txt':
      content = convertToText(exportData);
      mimeType = 'text/plain';
      defaultFilename = `${pluginName}-export-${Date.now()}.txt`;
      break;

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  const filename = options.filename || defaultFilename;
  downloadFile(content, filename, mimeType);
}

/**
 * Convert data to CSV format
 */
function convertToCSV<T>(data: T): string {
  if (!Array.isArray(data)) {
    throw new Error('CSV export requires array data');
  }

  if (data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });

  const headers = Array.from(allKeys);
  const csvRows = [headers.join(',')];

  data.forEach(item => {
    const row = headers.map(header => {
      if (typeof item === 'object' && item !== null) {
        const value = (item as any)[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape CSV values
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }
      return '';
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Convert data to text format
 */
function convertToText<T>(exportData: ExportData<T>): string {
  const lines = [
    `Plugin: ${exportData.plugin}`,
    `Version: ${exportData.version}`,
    `Export Time: ${formatDateTime(exportData.timestamp)}`,
    '',
    'Data:',
    '=' .repeat(50),
    JSON.stringify(exportData.data, null, 2)
  ];

  if (exportData.metadata) {
    lines.push('', 'Metadata:', '=' .repeat(50));
    Object.entries(exportData.metadata).forEach(([key, value]) => {
      lines.push(`${key}: ${value}`);
    });
  }

  return lines.join('\n');
}

/**
 * Trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy data to clipboard
 */
export function copyToClipboard<T>(
  data: T,
  format: 'json' | 'text' = 'json'
): Promise<void> {
  const content = format === 'json' 
    ? JSON.stringify(data, null, 2)
    : String(data);

  return navigator.clipboard.writeText(content);
}

/**
 * Import data from JSON string
 */
export function importFromJSON<T>(jsonString: string): ExportData<T> {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate basic structure
    if (!parsed.plugin || !parsed.version || !parsed.timestamp || !parsed.data) {
      throw new Error('Invalid export data structure');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}