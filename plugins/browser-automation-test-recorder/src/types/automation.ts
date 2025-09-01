/**
 * Browser Automation Core Types
 * Defines the core types for browser automation and test recording
 */

/**
 * Browser event types that can be recorded
 */
export type EventType = 
  // Mouse events
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'mouseover'
  | 'mouseout'
  | 'mousemove'
  | 'contextmenu'
  | 'wheel'
  
  // Keyboard events
  | 'keydown'
  | 'keyup'
  | 'keypress'
  | 'input'
  
  // Form events
  | 'change'
  | 'submit'
  | 'focus'
  | 'blur'
  | 'select'
  
  // Navigation events
  | 'navigation'
  | 'reload'
  | 'back'
  | 'forward'
  
  // Window events
  | 'resize'
  | 'scroll'
  | 'load'
  | 'unload'
  | 'beforeunload'
  
  // Touch events (mobile)
  | 'touchstart'
  | 'touchend'
  | 'touchmove'
  | 'touchcancel'
  
  // Drag and drop
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'dragover'
  | 'dragenter'
  | 'dragleave'
  | 'drop'
  
  // Custom events
  | 'wait'
  | 'assertion'
  | 'screenshot'
  | 'custom';

/**
 * Recorded browser event
 */
export interface RecordedEvent {
  // Basic event information
  id: string;
  type: EventType;
  timestamp: number;
  sequence: number;
  
  // Target element information
  target: RecordedEventTarget;
  
  // Event-specific data
  data: EventData;
  
  // Context information
  context: EventContext;
  
  // Metadata
  metadata: EventMetadata;
}

/**
 * Event target information
 */
export interface RecordedEventTarget {
  // Element identification
  selector: string;
  xpath?: string;
  textContent?: string;
  
  // Element attributes
  tagName: string;
  id?: string;
  className?: string;
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  
  // Element position and size
  boundingRect: DOMRect;
  
  // Element hierarchy
  path: ElementPathNode[];
  
  // Alternative selectors for reliability
  alternativeSelectors: string[];
}

/**
 * Element path node for building selector paths
 */
export interface ElementPathNode {
  tagName: string;
  id?: string;
  className?: string;
  attributes: Record<string, string>;
  index: number;
  selector: string;
}

/**
 * Event-specific data
 */
export type EventData = 
  | MouseEventData
  | KeyboardEventData
  | FormEventData
  | NavigationEventData
  | ScrollEventData
  | WaitEventData
  | AssertionEventData
  | CustomEventData;

/**
 * Mouse event data
 */
export interface MouseEventData {
  type: 'mouse';
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  detail: number; // click count
}

/**
 * Keyboard event data
 */
export interface KeyboardEventData {
  type: 'keyboard';
  key: string;
  code: string;
  keyCode: number;
  charCode: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  inputValue?: string; // For input events
}

/**
 * Form event data
 */
export interface FormEventData {
  type: 'form';
  eventType: 'change' | 'submit' | 'focus' | 'blur' | 'select';
  value?: string;
  selectedOptions?: string[];
  files?: FileInfo[];
  formData?: Record<string, unknown>;
}

/**
 * File information for file input events
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Navigation event data
 */
export interface NavigationEventData {
  type: 'navigation';
  url: string;
  title: string;
  referrer: string;
  method?: string;
  headers?: Record<string, string>;
  timestamp: number;
}

/**
 * Scroll event data
 */
export interface ScrollEventData {
  type: 'scroll';
  scrollX: number;
  scrollY: number;
  scrollTop: number;
  scrollLeft: number;
  element?: 'window' | 'element';
}

/**
 * Wait event data
 */
export interface WaitEventData {
  type: 'wait';
  duration: number;
  reason: 'manual' | 'element' | 'navigation' | 'timeout' | 'network';
  condition?: string;
}

/**
 * Assertion event data
 */
export interface AssertionEventData {
  type: 'assertion';
  assertionType: string;
  expected: unknown;
  actual?: unknown;
  message: string;
  passed?: boolean;
}

/**
 * Custom event data
 */
export interface CustomEventData {
  type: 'custom';
  eventType: string;
  payload: Record<string, unknown>;
}

/**
 * Event context information
 */
export interface EventContext {
  // Page context
  url: string;
  title: string;
  
  // Viewport information
  viewport: ViewportInfo;
  
  // Browser context
  userAgent: string;
  
  // Performance context
  performance?: PerformanceInfo;
  
  // Network context
  network?: NetworkInfo;
  
  // Console context
  console?: ConsoleInfo;
}

/**
 * Viewport information
 */
export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  isLandscape: boolean;
  isMobile: boolean;
}

/**
 * Performance information
 */
export interface PerformanceInfo {
  // Timing information
  domContentLoaded?: number;
  loadComplete?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  
  // Memory information
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  
  // Network timing
  responseStart?: number;
  responseEnd?: number;
  domainLookupStart?: number;
  domainLookupEnd?: number;
  connectStart?: number;
  connectEnd?: number;
}

/**
 * Network information
 */
export interface NetworkInfo {
  requests: NetworkRequest[];
  totalRequests: number;
  failedRequests: number;
  totalBytes: number;
}

/**
 * Network request information
 */
export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestSize: number;
  responseSize: number;
  startTime: number;
  endTime: number;
  failed: boolean;
  errorText?: string;
}

/**
 * Console information
 */
export interface ConsoleInfo {
  messages: ConsoleMessage[];
  errorCount: number;
  warningCount: number;
}

/**
 * Console message
 */
export interface ConsoleMessage {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  args: unknown[];
  timestamp: number;
  source?: string;
  line?: number;
  column?: number;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  // Screenshot information
  screenshot?: ScreenshotInfo;
  
  // Recording session info
  sessionId: string;
  recordingMode: string;
  
  // Reliability metrics
  reliability: ReliabilityMetrics;
  
  // User annotations
  annotations: EventAnnotation[];
  
  // Grouping information
  group?: EventGroup;
  
  // Custom properties
  custom: Record<string, unknown>;
}

/**
 * Screenshot information
 */
export interface ScreenshotInfo {
  id: string;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage: boolean;
  element?: string; // selector of highlighted element
  data?: string; // base64 data
  path?: string; // file path
  size: number;
  dimensions: { width: number; height: number };
}

/**
 * Reliability metrics for event replay
 */
export interface ReliabilityMetrics {
  // Selector reliability
  selectorScore: number;
  alternativesCount: number;
  
  // Element stability
  elementStable: boolean;
  positionStable: boolean;
  attributesStable: boolean;
  
  // Timing reliability
  timingVariability: number;
  networkDependency: boolean;
  
  // Confidence score (0-1)
  confidence: number;
}

/**
 * Event annotation for user comments/labels
 */
export interface EventAnnotation {
  id: string;
  type: 'comment' | 'label' | 'todo' | 'issue';
  content: string;
  author?: string;
  timestamp: number;
}

/**
 * Event grouping for logical test steps
 */
export interface EventGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  collapsed: boolean;
  events: string[]; // event IDs
}

/**
 * Selector generation options
 */
export interface SelectorOptions {
  // Base configuration
  mode?: SelectorMode;
  strategy?: SelectorStrategy;
  timeout?: number;
  retries?: number;
  
  // Selector types to generate
  includeId?: boolean;
  includeClass?: boolean;
  includeAttributes?: boolean;
  includeText?: boolean;
  includePosition?: boolean;
  
  // Selector optimization
  optimize?: boolean;
  unique?: boolean;
  stable?: boolean;
  
  // Fallback options
  generateAlternatives?: boolean;
  maxAlternatives?: number;
  
  // Priority settings
  priority?: ('id' | 'data-testid' | 'aria-label' | 'text' | 'css' | 'xpath')[];
  
  // Custom options
  customAttributes?: string[];
  ignoreAttributes?: string[];
  
  // Framework-specific options
  testIdAttribute?: string;
  ariaLabelFallback?: boolean;
}

/**
 * Selector modes
 */
export type SelectorMode = 
  | 'auto'       // Automatic best selector
  | 'css'        // CSS selectors only
  | 'xpath'      // XPath selectors only
  | 'text'       // Text-based selectors
  | 'data-testid' // Test ID attributes
  | 'custom';    // Custom strategy

/**
 * Selector strategies
 */
export interface SelectorStrategy {
  priority: ('id' | 'data-testid' | 'aria-label' | 'text' | 'css' | 'xpath')[];
  fallback: boolean;
  optimize: boolean;
  includePosition: boolean;
}

/**
 * Chrome DevTools Protocol types for low-level browser communication
 */

/**
 * CDP DOM node information
 */
export interface CDPDOMNode {
  nodeId: number;
  parentId?: number;
  backendNodeId: number;
  nodeType: number;
  nodeName: string;
  localName: string;
  nodeValue: string;
  childNodeCount?: number;
  children?: CDPDOMNode[];
  attributes?: string[];
  documentURL?: string;
  baseURL?: string;
  publicId?: string;
  systemId?: string;
  xmlVersion?: string;
  name?: string;
  value?: string;
  pseudoType?: string;
  shadowRootType?: string;
  frameId?: string;
  contentDocument?: CDPDOMNode;
  shadowRoots?: CDPDOMNode[];
  templateContent?: CDPDOMNode;
  pseudoElements?: CDPDOMNode[];
  importedDocument?: CDPDOMNode;
  distributedNodes?: CDPBackendNode[];
  isSVG?: boolean;
}

/**
 * CDP backend node reference
 */
export interface CDPBackendNode {
  nodeType: number;
  nodeName: string;
  backendNodeId: number;
}

/**
 * CDP runtime object
 */
export interface CDPRemoteObject {
  type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint';
  subtype?: string;
  className?: string;
  value?: unknown;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
  preview?: CDPObjectPreview;
  customPreview?: CDPCustomPreview;
}

/**
 * CDP object preview
 */
export interface CDPObjectPreview {
  type: string;
  subtype?: string;
  description?: string;
  overflow: boolean;
  properties: CDPPropertyPreview[];
  entries?: CDPEntryPreview[];
}

/**
 * CDP property preview
 */
export interface CDPPropertyPreview {
  name: string;
  type: string;
  value?: string;
  valuePreview?: CDPObjectPreview;
  subtype?: string;
}

/**
 * CDP entry preview
 */
export interface CDPEntryPreview {
  key?: CDPObjectPreview;
  value: CDPObjectPreview;
}

/**
 * CDP custom preview
 */
export interface CDPCustomPreview {
  header: string;
  bodyGetterId?: string;
}

/**
 * Event execution result
 */
export interface EventExecutionResult {
  success: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
  assertions?: AssertionResult[];
}

/**
 * Assertion result
 */
export interface AssertionResult {
  type: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  message: string;
}

/**
 * Browser automation engine interface
 */
export interface AutomationEngine {
  // Engine information
  name: string;
  version: string;
  capabilities: string[];
  
  // Connection management
  connect(options: ConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Event recording
  startRecording(options: RecordingOptions): Promise<void>;
  stopRecording(): Promise<RecordedEvent[]>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  
  // Event playback
  playEvents(events: RecordedEvent[], options: PlaybackOptions): Promise<void>;
  stepEvent(event: RecordedEvent): Promise<EventExecutionResult>;
  
  // Element interaction
  findElement(selector: string): Promise<CDPRemoteObject | null>;
  generateSelector(element: CDPRemoteObject, options: SelectorOptions): Promise<string>;
  highlightElement(selector: string): Promise<void>;
  takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotInfo>;
  
  // Page interaction
  navigate(url: string): Promise<void>;
  reload(): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  
  // Utilities
  waitForElement(selector: string, timeout: number): Promise<boolean>;
  waitForNavigation(timeout: number): Promise<void>;
  executeScript(script: string): Promise<unknown>;
}

/**
 * Connection options for automation engine
 */
export interface ConnectionOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  target?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Recording options
 */
export interface RecordingOptions {
  captureScreenshots: boolean;
  captureSelectors: boolean;
  captureTimings: boolean;
  captureConsole: boolean;
  captureNetwork: boolean;
  capturePerformance: boolean;
  ignoredEvents: EventType[];
  selectorOptions: SelectorOptions;
  debounceMs: number;
  maxEvents: number;
  recordInitialNavigation?: boolean;
}

/**
 * Playback options
 */
export interface PlaybackOptions {
  speed: number;
  timeout: number;
  continueOnError: boolean;
  screenshotOnError: boolean;
  highlightElements: boolean;
  waitBetweenEvents: number;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage?: boolean;
  element?: string;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

/**
 * Collaboration system types for team-based test automation
 */

/**
 * User information for collaboration features
 */
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  team: string;
  status: 'online' | 'offline' | 'busy';
  lastActivity: number;
  permissions: UserPermissions;
}

/**
 * User roles in the collaboration system
 */
export type UserRole = 'viewer' | 'editor' | 'reviewer' | 'admin' | 'owner';

/**
 * User permissions for collaboration features
 */
export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canReview: boolean;
  canComment: boolean;
  canDelete: boolean;
  canManageTeam: boolean;
  canApproveTests: boolean;
  canPublishTests: boolean;
  customPermissions: Record<string, boolean>;
}

/**
 * Team/organization information
 */
export interface CollaborationTeam {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: CollaborationUser[];
  settings: TeamSettings;
  createdAt: number;
  updatedAt: number;
  owner: string; // User ID
}

/**
 * Team settings for collaboration
 */
export interface TeamSettings {
  defaultPermissions: UserPermissions;
  requireReview: boolean;
  allowPublicSharing: boolean;
  retentionDays: number;
  maxTestsPerUser: number;
  integrations: TeamIntegrations;
  notifications: NotificationSettings;
}

/**
 * Team integrations with external services
 */
export interface TeamIntegrations {
  slack?: SlackIntegration;
  jira?: JiraIntegration;
  github?: GitHubIntegration;
  custom: Record<string, unknown>;
}

/**
 * Slack integration settings
 */
export interface SlackIntegration {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  notifications: string[];
}

/**
 * Jira integration settings
 */
export interface JiraIntegration {
  enabled: boolean;
  serverUrl: string;
  projectKey: string;
  apiToken: string;
  linkTests: boolean;
}

/**
 * GitHub integration settings
 */
export interface GitHubIntegration {
  enabled: boolean;
  repository: string;
  branch: string;
  token: string;
  syncTests: boolean;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  slack: boolean;
  events: NotificationEvent[];
}

/**
 * Types of notification events
 */
export type NotificationEvent = 
  | 'test_shared'
  | 'test_commented'
  | 'review_requested'
  | 'review_completed'
  | 'test_approved'
  | 'test_rejected'
  | 'team_member_added'
  | 'library_updated';

/**
 * Shareable test recording with collaboration metadata
 */
export interface SharedTestRecording {
  id: string;
  originalId: string; // Original recording ID
  shareId: string; // Public sharing ID
  name: string;
  description?: string;
  events: RecordedEvent[];
  metadata: SharedTestMetadata;
  sharing: SharingSettings;
  collaborators: CollaborationUser[];
  comments: TestComment[];
  reviews: TestReview[];
  versions: TestVersion[];
  createdAt: number;
  updatedAt: number;
  createdBy: string; // User ID
}

/**
 * Metadata for shared test recordings
 */
export interface SharedTestMetadata {
  sessionId: string;
  url: string;
  title: string;
  viewport: ViewportInfo;
  userAgent: string;
  duration: number;
  eventCount: number;
  tags: string[];
  category: string;
  framework: string;
  language: string;
  complexity: 'simple' | 'medium' | 'complex';
  browserSupport: string[];
  dependencies: string[];
}

/**
 * Sharing settings for test recordings
 */
export interface SharingSettings {
  visibility: 'private' | 'team' | 'public';
  allowFork: boolean;
  allowEdit: boolean;
  allowComment: boolean;
  allowDownload: boolean;
  expiresAt?: number;
  password?: string;
  requireLogin: boolean;
  permissions: Record<string, UserPermissions>; // User ID -> Permissions
}

/**
 * Test comment with threading support
 */
export interface TestComment {
  id: string;
  parentId?: string; // For threaded comments
  testId: string;
  eventId?: string; // Comment on specific event
  content: string;
  author: CollaborationUser;
  mentions: string[]; // User IDs
  attachments: CommentAttachment[];
  reactions: CommentReaction[];
  createdAt: number;
  updatedAt: number;
  edited: boolean;
  position?: CommentPosition;
}

/**
 * Position information for visual comments
 */
export interface CommentPosition {
  x: number;
  y: number;
  elementSelector?: string;
  screenshotId?: string;
}

/**
 * Comment attachment (files, links, etc.)
 */
export interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'link';
  url: string;
  size?: number;
  mimeType?: string;
}

/**
 * Comment reaction (emoji responses)
 */
export interface CommentReaction {
  emoji: string;
  users: string[]; // User IDs
  count: number;
}

/**
 * Test review for approval workflow
 */
export interface TestReview {
  id: string;
  testId: string;
  reviewer: CollaborationUser;
  status: ReviewStatus;
  requestedAt: number;
  completedAt?: number;
  comments: string[];
  criteria: ReviewCriteria;
  checklist: ReviewChecklistItem[];
  changes: ReviewChange[];
  assignedBy: string; // User ID
}

/**
 * Review status values
 */
export type ReviewStatus = 
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

/**
 * Review criteria configuration
 */
export interface ReviewCriteria {
  functionalCorrectness: boolean;
  selectorReliability: boolean;
  performanceImpact: boolean;
  codeQuality: boolean;
  documentation: boolean;
  browserCompatibility: boolean;
  custom: Record<string, boolean>;
}

/**
 * Review checklist item
 */
export interface ReviewChecklistItem {
  id: string;
  description: string;
  required: boolean;
  checked: boolean;
  comments?: string;
}

/**
 * Review change suggestion
 */
export interface ReviewChange {
  id: string;
  eventId: string;
  type: 'modify' | 'remove' | 'add';
  description: string;
  before?: RecordedEvent;
  after?: RecordedEvent;
  applied: boolean;
}

/**
 * Test version for version control
 */
export interface TestVersion {
  id: string;
  version: string; // semver format
  name: string;
  description?: string;
  events: RecordedEvent[];
  author: CollaborationUser;
  createdAt: number;
  tags: string[];
  changelog: VersionChange[];
  parentVersion?: string;
}

/**
 * Version change entry
 */
export interface VersionChange {
  type: 'added' | 'modified' | 'removed' | 'fixed';
  description: string;
  eventIds?: string[];
}

/**
 * Team test library for centralized test management
 */
export interface TestLibrary {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  categories: TestCategory[];
  tests: LibraryTest[];
  templates: TestTemplate[];
  settings: LibrarySettings;
  stats: LibraryStats;
  createdAt: number;
  updatedAt: number;
}

/**
 * Test category in the library
 */
export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string; // For nested categories
  testCount: number;
}

/**
 * Library test entry
 */
export interface LibraryTest {
  id: string;
  name: string;
  description?: string;
  recording: SharedTestRecording;
  category: string;
  tags: string[];
  author: CollaborationUser;
  maintainers: CollaborationUser[];
  usage: TestUsageStats;
  quality: TestQualityMetrics;
  status: LibraryTestStatus;
  visibility: 'public' | 'team' | 'private';
  createdAt: number;
  updatedAt: number;
}

/**
 * Library test status
 */
export type LibraryTestStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'deprecated'
  | 'archived';

/**
 * Test usage statistics
 */
export interface TestUsageStats {
  views: number;
  downloads: number;
  forks: number;
  stars: number;
  runs: number;
  successRate: number;
  lastUsed: number;
  popularityScore: number;
}

/**
 * Test quality metrics
 */
export interface TestQualityMetrics {
  reliabilityScore: number;
  maintainabilityScore: number;
  complexityScore: number;
  documentationScore: number;
  testCoverage: number;
  browserCompatibility: number;
  performanceScore: number;
  overallScore: number;
}

/**
 * Test template for reusable patterns
 */
export interface TestTemplate {
  id: string;
  name: string;
  description?: string;
  pattern: EventPattern[];
  parameters: TemplateParameter[];
  usage: TemplateUsageStats;
  author: CollaborationUser;
  createdAt: number;
  updatedAt: number;
}

/**
 * Event pattern for templates
 */
export interface EventPattern {
  type: EventType;
  target?: ElementPattern;
  data?: any;
  optional: boolean;
  parameterized: string[]; // Parameter names
}

/**
 * Element pattern for templates
 */
export interface ElementPattern {
  selector?: string;
  attributes?: Record<string, string>;
  textContent?: string;
  parameterized: string[];
}

/**
 * Template parameter definition
 */
export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'selector';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: ParameterValidation;
}

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[]; // Allowed values
}

/**
 * Template usage statistics
 */
export interface TemplateUsageStats {
  uses: number;
  lastUsed: number;
  successRate: number;
  rating: number;
  reviews: number;
}

/**
 * Library settings
 */
export interface LibrarySettings {
  approvalRequired: boolean;
  allowPublicContribution: boolean;
  autoQualityCheck: boolean;
  retentionPolicy: RetentionPolicy;
  categories: TestCategory[];
  integrations: LibraryIntegrations;
}

/**
 * Retention policy for test library
 */
export interface RetentionPolicy {
  enabled: boolean;
  archiveAfterDays: number;
  deleteAfterDays: number;
  preservePopular: boolean;
  popularityThreshold: number;
}

/**
 * Library integrations
 */
export interface LibraryIntegrations {
  ci: CIIntegration[];
  testRunners: TestRunnerIntegration[];
  repositories: RepositoryIntegration[];
}

/**
 * CI integration settings
 */
export interface CIIntegration {
  type: 'jenkins' | 'github_actions' | 'gitlab_ci' | 'azure_devops';
  enabled: boolean;
  webhook?: string;
  config: Record<string, unknown>;
}

/**
 * Test runner integration
 */
export interface TestRunnerIntegration {
  type: 'playwright' | 'cypress' | 'selenium' | 'puppeteer';
  enabled: boolean;
  config: Record<string, unknown>;
}

/**
 * Repository integration
 */
export interface RepositoryIntegration {
  type: 'github' | 'gitlab' | 'bitbucket';
  enabled: boolean;
  repository: string;
  branch: string;
  path: string;
  config: Record<string, unknown>;
}

/**
 * Library statistics
 */
export interface LibraryStats {
  totalTests: number;
  activeTests: number;
  draftTests: number;
  reviewTests: number;
  archivedTests: number;
  totalCategories: number;
  totalTemplates: number;
  totalDownloads: number;
  averageRating: number;
  topContributors: string[]; // User IDs
  popularTags: string[];
  monthlyGrowth: number;
}

/**
 * Collaboration activity feed item
 */
export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  actor: CollaborationUser;
  target: ActivityTarget;
  metadata: Record<string, unknown>;
  timestamp: number;
  read: boolean;
}

/**
 * Activity types for the feed
 */
export type ActivityType =
  | 'test_created'
  | 'test_shared'
  | 'test_forked'
  | 'test_commented'
  | 'test_reviewed'
  | 'test_approved'
  | 'test_published'
  | 'team_joined'
  | 'library_updated';

/**
 * Activity target information
 */
export interface ActivityTarget {
  type: 'test' | 'comment' | 'review' | 'team' | 'library';
  id: string;
  name: string;
  url?: string;
}

/**
 * Notification for real-time updates
 */
export interface CollaborationNotification {
  id: string;
  userId: string;
  type: NotificationEvent;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  actionUrl?: string;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Test case for automation testing
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  events: string[]; // Event IDs
  assertions: TestAssertion[];
  metadata: TestCaseMetadata;
  createdAt: number;
  updatedAt: number;
}

/**
 * Assertion types
 */
export type AssertionType = 
  | 'text-equals'
  | 'text-contains'
  | 'text-matches'
  | 'value-equals'
  | 'attribute-equals'
  | 'visible'
  | 'hidden'
  | 'enabled'
  | 'disabled'
  | 'count-equals'
  | 'exists'
  | 'url-equals'
  | 'url-contains'
  | 'title-equals'
  | 'custom';

/**
 * Test assertion for validation
 */
export interface TestAssertion {
  id: string;
  type: AssertionType;
  selector: string;
  expected: unknown;
  description: string;
}

/**
 * Test case metadata
 */
export interface TestCaseMetadata {
  sessionId: string;
  eventCount: number;
  duration: number;
  url: string;
  viewport: ViewportInfo;
  assertions: number;
  selectors: number;
  tags?: string[];
  category?: string;
}

/**
 * Generated test code
 */
export interface GeneratedTest {
  id: string;
  name: string;
  format: TestFormat;
  framework: TestFramework;
  code: string;
  metadata: TestCaseMetadata;
  createdAt: number;
}

/**
 * Test format types
 */
export type TestFormat = 
  | 'playwright'
  | 'puppeteer'
  | 'selenium'
  | 'cypress'
  | 'testcafe'
  | 'webdriver'
  | 'typescript'
  | 'javascript'
  | 'custom';

/**
 * Test framework types
 */
export type TestFramework = 
  | 'jest'
  | 'mocha'
  | 'jasmine'
  | 'qunit'
  | 'vitest'
  | 'playwright'
  | 'custom';

/**
 * Recording session for organized testing
 */
export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  url: string;
  viewport: ViewportInfo;
  userAgent: string;
  events: string[]; // Event IDs
  metadata: Record<string, unknown>;
}

/**
 * Element information for DevTools integration
 */
export interface ElementInfo {
  selector: string;
  xpath?: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  attributes: Record<string, string>;
  boundingRect: DOMRect;
  isVisible: boolean;
}

/**
 * Action timing information
 */
export interface ActionTiming {
  startTime: number;
  endTime: number;
  duration: number;
  networkDelay?: number;
  renderDelay?: number;
}

/**
 * CSS Selector type
 */
export interface CSSSelector {
  type: 'css';
  value: string;
  specificity: number;
  reliability: number;
}

/**
 * XPath Selector type
 */
export interface XPathSelector {
  type: 'xpath';
  value: string;
  reliability: number;
}

/**
 * Data Test ID Selector type
 */
export interface DataTestIdSelector {
  type: 'data-testid';
  value: string;
  attribute: string;
  reliability: number;
}

/**
 * Aria Selector type
 */
export interface AriaSelector {
  type: 'aria';
  value: string;
  attribute: string;
  reliability: number;
}