/**
 * Parallel Test Execution Manager
 * Handles multi-browser parallel test execution with resource management
 */

import type { RecordedEvent } from '../../types';

export interface ExecutionJob {
  id: string;
  name: string;
  events: RecordedEvent[];
  config: ExecutionConfig;
  status: JobStatus;
  result?: ExecutionResult;
  startTime?: number;
  endTime?: number;
  workerId?: string;
  retryCount: number;
  maxRetries: number;
  priority: JobPriority;
  dependencies?: string[]; // Job IDs this depends on
  tags: string[];
  metadata: JobMetadata;
}

export type JobStatus = 
  | 'pending' 
  | 'queued' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout';

export type JobPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ExecutionConfig {
  browser: BrowserConfig;
  environment: EnvironmentConfig;
  timeout: number;
  retries: number;
  screenshots: boolean;
  video: boolean;
  tracing: boolean;
  parallelization: ParallelConfig;
}

export interface BrowserConfig {
  type: 'chromium' | 'firefox' | 'webkit' | 'chrome' | 'edge';
  version?: string;
  headless: boolean;
  viewport: { width: number; height: number };
  deviceEmulation?: DeviceEmulation;
  locale?: string;
  timezone?: string;
  userAgent?: string;
  extraArgs?: string[];
}

export interface DeviceEmulation {
  name: string;
  userAgent: string;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface EnvironmentConfig {
  baseUrl?: string;
  variables: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

export interface ParallelConfig {
  workers: number;
  sharding?: ShardConfig;
  distribution: 'round_robin' | 'load_balanced' | 'dependency_aware';
  isolation: 'context' | 'page' | 'browser';
}

export interface ShardConfig {
  total: number;
  current: number;
  strategy: 'sequential' | 'hash' | 'custom';
}

export interface JobMetadata {
  source: string;
  suite?: string;
  tags: string[];
  owner?: string;
  created: number;
  estimatedDuration?: number;
  dataSet?: string;
}

export interface ExecutionResult {
  success: boolean;
  duration: number;
  steps: StepResult[];
  screenshots: Screenshot[];
  videos: VideoRecording[];
  traces: TraceFile[];
  metrics: ExecutionMetrics;
  errors: ExecutionError[];
  logs: LogEntry[];
  coverage?: CoverageData;
}

export interface StepResult {
  stepId: string;
  eventId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  screenshot?: Screenshot;
  error?: ExecutionError;
  retries: number;
}

export interface Screenshot {
  id: string;
  stepId?: string;
  path: string;
  data?: string; // base64
  timestamp: number;
  fullPage: boolean;
  dimensions: { width: number; height: number };
}

export interface VideoRecording {
  id: string;
  jobId: string;
  path: string;
  duration: number;
  size: number;
  fps: number;
  resolution: { width: number; height: number };
}

export interface TraceFile {
  id: string;
  jobId: string;
  path: string;
  size: number;
  format: 'playwright' | 'chrome-devtools' | 'custom';
}

export interface ExecutionMetrics {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  retrySteps: number;
  averageStepDuration: number;
  maxStepDuration: number;
  networkRequests: number;
  networkFailures: number;
  consoleErrors: number;
  memoryUsage: MemoryMetrics;
  performance: PerformanceMetrics;
}

export interface MemoryMetrics {
  peak: number;
  average: number;
  final: number;
  gcCount: number;
}

export interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  totalBlockingTime?: number;
}

export interface ExecutionError {
  type: 'step' | 'browser' | 'network' | 'timeout' | 'assertion' | 'system';
  message: string;
  stack?: string;
  screenshot?: Screenshot;
  stepId?: string;
  timestamp: number;
  recoverable: boolean;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  source: string;
  stepId?: string;
  data?: any;
}

export interface CoverageData {
  type: 'js' | 'css';
  url: string;
  ranges: Array<{ start: number; end: number }>;
  text: string;
}

export interface WorkerInfo {
  id: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentJob?: string;
  browser: BrowserConfig;
  capabilities: string[];
  load: number; // 0-1
  startTime: number;
  lastHeartbeat: number;
  metrics: WorkerMetrics;
}

export interface WorkerMetrics {
  jobsCompleted: number;
  jobsFailed: number;
  totalExecutionTime: number;
  averageJobDuration: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ExecutionQueue {
  pending: ExecutionJob[];
  running: ExecutionJob[];
  completed: ExecutionJob[];
  failed: ExecutionJob[];
}

export interface ExecutionSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  totalDuration: number;
  averageJobDuration: number;
  successRate: number;
  throughput: number; // jobs per minute
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  workerUtilization: number; // 0-1
  memoryUtilization: number;
  cpuUtilization: number;
  networkUtilization: number;
}

export class ExecutionManager {
  private jobs = new Map<string, ExecutionJob>();
  private workers = new Map<string, WorkerInfo>();
  private queue: ExecutionQueue = {
    pending: [],
    running: [],
    completed: [],
    failed: [],
  };

  private isRunning = false;
  private maxConcurrentJobs = 4;
  private jobIdCounter = 0;
  private workerIdCounter = 0;

  private eventEmitter = new EventTarget();

  constructor(config?: { maxConcurrentJobs?: number }) {
    this.maxConcurrentJobs = config?.maxConcurrentJobs || 4;
    this.initializeWorkers();
    this.startQueueProcessor();
  }

  /**
   * Add job to execution queue
   */
  addJob(
    name: string,
    events: RecordedEvent[],
    config: ExecutionConfig,
    options: {
      priority?: JobPriority;
      dependencies?: string[];
      tags?: string[];
      maxRetries?: number;
      metadata?: Partial<JobMetadata>;
    } = {}
  ): string {
    const job: ExecutionJob = {
      id: `job_${++this.jobIdCounter}`,
      name,
      events,
      config,
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || config.retries,
      priority: options.priority || 'medium',
      dependencies: options.dependencies || [],
      tags: options.tags || [],
      metadata: {
        source: 'user',
        created: Date.now(),
        estimatedDuration: this.estimateJobDuration(events),
        tags: options.tags || [],
        ...options.metadata,
      },
    };

    this.jobs.set(job.id, job);
    this.queue.pending.push(job);
    
    this.emit('jobAdded', job);
    this.processQueue();
    
    return job.id;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'running') {
      // Signal worker to cancel
      const worker = this.workers.get(job.workerId!);
      if (worker) {
        this.cancelWorkerJob(worker.id);
      }
    }

    job.status = 'cancelled';
    this.moveJobToCompleted(job);
    this.emit('jobCancelled', job);
    
    return true;
  }

  /**
   * Retry failed job
   */
  retryJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') return false;

    if (job.retryCount >= job.maxRetries) return false;

    job.status = 'pending';
    job.retryCount++;
    job.result = undefined;
    job.startTime = undefined;
    job.endTime = undefined;
    job.workerId = undefined;

    // Move from failed to pending queue
    this.queue.failed = this.queue.failed.filter(j => j.id !== jobId);
    this.queue.pending.push(job);

    this.emit('jobRetry', job);
    this.processQueue();

    return true;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ExecutionJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  getJobs(filter?: { status?: JobStatus; tags?: string[] }): ExecutionJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }

    if (filter?.tags && filter.tags.length > 0) {
      jobs = jobs.filter(job => 
        filter.tags!.some(tag => job.tags.includes(tag))
      );
    }

    return jobs;
  }

  /**
   * Get execution summary
   */
  getSummary(): ExecutionSummary {
    const allJobs = Array.from(this.jobs.values());
    const completed = allJobs.filter(j => j.status === 'completed');
    const failed = allJobs.filter(j => j.status === 'failed');
    const cancelled = allJobs.filter(j => j.status === 'cancelled');

    const totalDuration = completed.reduce((sum, job) => {
      return sum + (job.result?.duration || 0);
    }, 0);

    const activeWorkers = Array.from(this.workers.values()).filter(w => w.status !== 'offline');
    const busyWorkers = activeWorkers.filter(w => w.status === 'busy');

    return {
      totalJobs: allJobs.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      cancelledJobs: cancelled.length,
      totalDuration,
      averageJobDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      successRate: allJobs.length > 0 ? completed.length / allJobs.length : 0,
      throughput: this.calculateThroughput(),
      resourceUtilization: {
        workerUtilization: activeWorkers.length > 0 ? busyWorkers.length / activeWorkers.length : 0,
        memoryUtilization: this.calculateMemoryUtilization(),
        cpuUtilization: this.calculateCpuUtilization(),
        networkUtilization: 0, // Would be calculated from actual metrics
      },
    };
  }

  /**
   * Add worker to the pool
   */
  addWorker(browserConfig: BrowserConfig, capabilities: string[] = []): string {
    const worker: WorkerInfo = {
      id: `worker_${++this.workerIdCounter}`,
      status: 'idle',
      browser: browserConfig,
      capabilities: [...capabilities, browserConfig.type],
      load: 0,
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
      metrics: {
        jobsCompleted: 0,
        jobsFailed: 0,
        totalExecutionTime: 0,
        averageJobDuration: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
    };

    this.workers.set(worker.id, worker);
    this.emit('workerAdded', worker);
    
    return worker.id;
  }

  /**
   * Remove worker from pool
   */
  removeWorker(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    if (worker.status === 'busy' && worker.currentJob) {
      // Cancel current job
      this.cancelJob(worker.currentJob);
    }

    worker.status = 'offline';
    this.workers.delete(workerId);
    this.emit('workerRemoved', worker);

    return true;
  }

  /**
   * Get worker information
   */
  getWorkers(): WorkerInfo[] {
    return Array.from(this.workers.values());
  }

  /**
   * Start execution manager
   */
  start(): void {
    this.isRunning = true;
    this.emit('managerStarted', {});
  }

  /**
   * Stop execution manager
   */
  stop(): void {
    this.isRunning = false;
    
    // Cancel all running jobs
    this.queue.running.forEach(job => {
      this.cancelJob(job.id);
    });

    this.emit('managerStopped', {});
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.addEventListener(event, callback as EventListener);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (data: any) => void): void {
    this.eventEmitter.removeEventListener(event, callback as EventListener);
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    // Create default workers for different browsers
    const browsers: BrowserConfig[] = [
      {
        type: 'chromium',
        headless: true,
        viewport: { width: 1280, height: 720 },
      },
      {
        type: 'firefox',
        headless: true,
        viewport: { width: 1280, height: 720 },
      },
    ];

    browsers.forEach(browserConfig => {
      this.addWorker(browserConfig);
    });
  }

  /**
   * Start queue processing loop
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.isRunning) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Process pending jobs in queue
   */
  private processQueue(): void {
    if (!this.isRunning) return;

    // Check for completed jobs
    this.queue.running.forEach(job => {
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        this.moveJobToCompleted(job);
      }
    });

    // Start new jobs if workers are available
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');

    const executableJobs = this.queue.pending
      .filter(job => this.canExecuteJob(job))
      .sort(this.compareJobPriority);

    const jobsToStart = Math.min(availableWorkers.length, executableJobs.length);

    for (let i = 0; i < jobsToStart; i++) {
      const job = executableJobs[i];
      const worker = this.findBestWorkerForJob(job, availableWorkers);

      if (worker) {
        this.startJob(job, worker);
      }
    }
  }

  /**
   * Check if job can be executed (dependencies met)
   */
  private canExecuteJob(job: ExecutionJob): boolean {
    if (job.dependencies && job.dependencies.length > 0) {
      return job.dependencies.every(depId => {
        const depJob = this.jobs.get(depId);
        return depJob && depJob.status === 'completed';
      });
    }
    return true;
  }

  /**
   * Compare jobs by priority for sorting
   */
  private compareJobPriority(a: ExecutionJob, b: ExecutionJob): number {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // Secondary sort by creation time
    return a.metadata.created - b.metadata.created;
  }

  /**
   * Find best worker for job based on capabilities and load
   */
  private findBestWorkerForJob(job: ExecutionJob, availableWorkers: WorkerInfo[]): WorkerInfo | null {
    // Filter workers by browser compatibility
    const compatibleWorkers = availableWorkers.filter(worker => {
      return worker.browser.type === job.config.browser.type;
    });

    if (compatibleWorkers.length === 0) {
      return availableWorkers[0] || null;
    }

    // Sort by load (prefer less loaded workers)
    compatibleWorkers.sort((a, b) => a.load - b.load);
    
    return compatibleWorkers[0];
  }

  /**
   * Start job execution on worker
   */
  private async startJob(job: ExecutionJob, worker: WorkerInfo): Promise<void> {
    job.status = 'running';
    job.startTime = Date.now();
    job.workerId = worker.id;

    worker.status = 'busy';
    worker.currentJob = job.id;
    worker.load = 1;

    // Move job from pending to running
    this.queue.pending = this.queue.pending.filter(j => j.id !== job.id);
    this.queue.running.push(job);

    this.emit('jobStarted', { job, worker });

    try {
      // Execute job (this would integrate with actual browser automation)
      const result = await this.executeJob(job);
      
      job.result = result;
      job.status = result.success ? 'completed' : 'failed';
      job.endTime = Date.now();

      // Update worker metrics
      worker.metrics.jobsCompleted++;
      worker.metrics.totalExecutionTime += result.duration;
      worker.metrics.averageJobDuration = 
        worker.metrics.totalExecutionTime / worker.metrics.jobsCompleted;

      this.emit('jobCompleted', { job, result });

    } catch {
      job.status = 'failed';
      job.endTime = Date.now();
      job.result = {
        success: false,
        duration: Date.now() - job.startTime!,
        steps: [],
        screenshots: [],
        videos: [],
        traces: [],
        metrics: this.createEmptyMetrics(),
        errors: [{
          type: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          recoverable: false,
        }],
        logs: [],
      };

      worker.metrics.jobsFailed++;
      this.emit('jobFailed', { job, error });
    } finally {
      // Reset worker
      worker.status = 'idle';
      worker.currentJob = undefined;
      worker.load = 0;
      worker.lastHeartbeat = Date.now();
    }
  }

  /**
   * Execute job (placeholder for actual browser automation)
   */
  private async executeJob(job: ExecutionJob): Promise<ExecutionResult> {
    // This would integrate with actual browser automation engines
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 4000));

    const success = Math.random() > 0.1; // 90% success rate

    return {
      success,
      duration: 1000 + Math.random() * 4000,
      steps: job.events.map((event, index) => ({
        stepId: `step_${index}`,
        eventId: event.id,
        status: success || index < job.events.length - 1 ? 'passed' : 'failed',
        duration: 100 + Math.random() * 500,
        retries: 0,
      })),
      screenshots: [],
      videos: [],
      traces: [],
      metrics: this.createEmptyMetrics(),
      errors: success ? [] : [{
        type: 'step',
        message: 'Step execution failed',
        timestamp: Date.now(),
        recoverable: true,
      }],
      logs: [],
    };
  }

  /**
   * Move job to appropriate completed queue
   */
  private moveJobToCompleted(job: ExecutionJob): void {
    this.queue.running = this.queue.running.filter(j => j.id !== job.id);
    
    if (job.status === 'completed') {
      this.queue.completed.push(job);
    } else if (job.status === 'failed') {
      this.queue.failed.push(job);
    }
  }

  /**
   * Cancel job on worker
   */
  private cancelWorkerJob(_workerId: string): void {
    // This would send cancellation signal to worker
    // console.log(`Cancelling job on worker ${workerId}`);
  }

  /**
   * Estimate job duration based on events
   */
  private estimateJobDuration(events: RecordedEvent[]): number {
    // Simple estimation: 500ms per event on average
    return events.length * 500;
  }

  /**
   * Calculate throughput (jobs per minute)
   */
  private calculateThroughput(): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentJobs = Array.from(this.jobs.values())
      .filter(job => job.endTime && job.endTime > oneHourAgo);
    
    return recentJobs.length;
  }

  /**
   * Calculate memory utilization
   */
  private calculateMemoryUtilization(): number {
    // Would calculate actual memory usage
    return Math.random() * 0.8; // Mock value
  }

  /**
   * Calculate CPU utilization
   */
  private calculateCpuUtilization(): number {
    // Would calculate actual CPU usage
    return Math.random() * 0.6; // Mock value
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): ExecutionMetrics {
    return {
      totalSteps: 0,
      passedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      retrySteps: 0,
      averageStepDuration: 0,
      maxStepDuration: 0,
      networkRequests: 0,
      networkFailures: 0,
      consoleErrors: 0,
      memoryUsage: {
        peak: 0,
        average: 0,
        final: 0,
        gcCount: 0,
      },
      performance: {},
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}