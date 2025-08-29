import React from 'react';
import { 
  Copy, 
  Check, 
  Play, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Loader,
  Settings,
  Zap,
  Eye,
  Network,
  Code,
  FileText,
  TrendingUp
} from 'lucide-react';
import type { GraphQLOperation, NetworkInfo } from '../../types';

interface OperationDetailsProps {
  operation: GraphQLOperation;
  networkInfo?: NetworkInfo;
  onCopyQuery: (query: string) => void;
  onReplayOperation?: (operation: GraphQLOperation) => void;
}

export const OperationDetails: React.FC<OperationDetailsProps> = ({
  operation,
  networkInfo,
  onCopyQuery,
  onReplayOperation
}) => {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'query' | 'variables' | 'response' | 'network'>('query');

  const handleCopy = async (content: string, section: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onCopyQuery(content);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.warn('Failed to copy content:', error);
    }
  };

  const getOperationIcon = () => {
    switch (operation.operationType) {
      case 'mutation':
        return <Settings size={24} className="text-purple-500" />;
      case 'subscription':
        return <Zap size={24} className="text-orange-500" />;
      default:
        return <Eye size={24} className="text-blue-500" />;
    }
  };

  const getStatusIcon = () => {
    switch (operation.status) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'pending':
        return <Loader size={20} className="text-yellow-500 animate-spin" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const prettifyJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'variables':
        return <Settings size={16} />;
      case 'response':
        return <FileText size={16} />;
      case 'network':
        return <Network size={16} />;
      default:
        return <Code size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getOperationIcon()}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {operation.operationName || `${operation.operationType}Operation`}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {operation.operationType.charAt(0).toUpperCase() + operation.operationType.slice(1)} Operation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onReplayOperation && operation.status !== 'pending' && (
              <button
                onClick={() => onReplayOperation(operation)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Play size={16} />
                Replay
              </button>
            )}
          </div>
        </div>

        {/* Status and metrics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`font-medium capitalize ${
              operation.status === 'success' ? 'text-green-700 dark:text-green-300' :
              operation.status === 'error' ? 'text-red-700 dark:text-red-300' :
              'text-yellow-700 dark:text-yellow-300'
            }`}>
              {operation.status}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock size={16} />
            <span>{formatTimestamp(operation.timestamp)}</span>
          </div>
          
          {operation.executionTime && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp size={16} />
              <span>{formatExecutionTime(operation.executionTime)}</span>
            </div>
          )}
          
          {networkInfo && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Network size={16} />
              <span>{formatBytes(networkInfo.requestSize + networkInfo.responseSize)}</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {operation.error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Operation Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {operation.error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {([
            { key: 'query', label: 'Query', available: true },
            { key: 'variables', label: 'Variables', available: operation.variables && Object.keys(operation.variables).length > 0 },
            { key: 'response', label: 'Response', available: operation.response !== undefined },
            { key: 'network', label: 'Network', available: networkInfo !== undefined }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              disabled={!tab.available}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {getTabIcon(tab.key)}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'query' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                GraphQL Query
              </h3>
              <button
                onClick={() => handleCopy(operation.query, 'query')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                {copiedSection === 'query' ? <Check size={16} /> : <Copy size={16} />}
                Copy
              </button>
            </div>
            <pre className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto border border-gray-200 dark:border-gray-700">
              <code className="text-gray-900 dark:text-gray-100">
                {operation.query}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'variables' && operation.variables && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Variables
              </h3>
              <button
                onClick={() => handleCopy(prettifyJSON(operation.variables), 'variables')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                {copiedSection === 'variables' ? <Check size={16} /> : <Copy size={16} />}
                Copy
              </button>
            </div>
            <pre className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto border border-gray-200 dark:border-gray-700">
              <code className="text-gray-900 dark:text-gray-100">
                {prettifyJSON(operation.variables)}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'response' && operation.response && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Response
              </h3>
              <button
                onClick={() => handleCopy(prettifyJSON(operation.response), 'response')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                {copiedSection === 'response' ? <Check size={16} /> : <Copy size={16} />}
                Copy
              </button>
            </div>
            <pre className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto border border-gray-200 dark:border-gray-700 max-h-96">
              <code className="text-gray-900 dark:text-gray-100">
                {prettifyJSON(operation.response)}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'network' && networkInfo && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Network Information
            </h3>
            
            <div className="space-y-4">
              {/* Request Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Request</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">URL:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{networkInfo.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Method:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{networkInfo.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{formatBytes(networkInfo.requestSize)}</span>
                  </div>
                </div>
              </div>

              {/* Response Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Response</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{formatBytes(networkInfo.responseSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{formatBytes(networkInfo.requestSize + networkInfo.responseSize)}</span>
                  </div>
                </div>
              </div>

              {/* Headers */}
              {Object.keys(networkInfo.headers).length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Headers</h4>
                    <button
                      onClick={() => handleCopy(prettifyJSON(networkInfo.headers), 'headers')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 overflow-auto max-h-32">
                    <code>{prettifyJSON(networkInfo.headers)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};