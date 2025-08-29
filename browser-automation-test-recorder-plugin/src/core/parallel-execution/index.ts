/**
 * Parallel Test Execution Module
 * Export all parallel execution and worker management components
 */

export { ExecutionManager } from './execution-manager';
export type {
  ExecutionJob,
  JobStatus,
  JobPriority,
  ExecutionConfig,
  BrowserConfig,
  DeviceEmulation,
  EnvironmentConfig,
  ParallelConfig,
  ShardConfig,
  JobMetadata,
  ExecutionResult,
  StepResult,
  Screenshot,
  VideoRecording,
  TraceFile,
  ExecutionMetrics,
  MemoryMetrics,
  PerformanceMetrics,
  ExecutionError,
  LogEntry,
  CoverageData,
  WorkerInfo,
  WorkerMetrics,
  ExecutionQueue,
  ExecutionSummary,
  ResourceUtilization,
} from './execution-manager';