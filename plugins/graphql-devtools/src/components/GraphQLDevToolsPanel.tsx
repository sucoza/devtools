import React from 'react';
import { 
  Database, 
  Search, 
  History, 
  TrendingUp
} from 'lucide-react';
import {
  PluginPanel,
  EmptyState,
  ConfigMenu,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryBuilder } from './QueryBuilder';
import { QueryHistory } from './QueryHistory';
import { useGraphQLDevToolsStore } from '../core/devtools-store';
import { createGraphQLDevToolsClient } from '../core/devtools-client';

export const GraphQLDevToolsPanel: React.FC = () => {
  const state = useGraphQLDevToolsStore();
  const clientRef = React.useRef(createGraphQLDevToolsClient());
  const client = clientRef.current;

  const handleTabChange = (tab: typeof state.ui.activeTab) => {
    client.selectTab(tab);
  };

  const handleIntrospectSchema = () => {
    client.introspectSchema();
  };

  const handleTypeSelect = (typeName: string) => {
    client.selectType(typeName);
  };

  const handleOperationSelect = (id: string) => {
    client.selectOperation(id);
  };

  const handleOperationDelete = (_id: string) => {
    // Remove specific operation
    // This would need to be added to the client API
    // console.log('Delete operation:', id);
  };

  const handleClearOperations = () => {
    client.clearOperations();
  };

  const handleCopyOperation = (operation: any) => {
    navigator.clipboard.writeText(operation.query).catch(() => {});
  };

  const handleReplayOperation = async (_operation: any) => {
    // Replay the operation by executing it again
    try {
      // This would need endpoint configuration
      // console.log('Replay operation:', operation);
    } catch {
      // console.error('Failed to replay operation:', error);
    }
  };

  const handleUpdateQueryBuilder = (updates: any) => {
    // Apply updates to query builder state
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'operationType':
          client.setQueryBuilderOperationType(value as any);
          break;
        case 'selectedFields':
          // This would need more specific handling
          break;
        case 'variables':
          // This would need more specific handling
          break;
        case 'operationName':
          client.setQueryBuilderOperationName(value as string);
          break;
      }
    });
  };

  const handleGenerateQuery = () => {
    client.generateQuery();
  };

  const handleValidateQuery = () => {
    client.validateQueryBuilder();
  };

  const handleResetBuilder = () => {
    client.resetQueryBuilder();
  };

  const handleExecuteQuery = async (_query: string, _variables?: Record<string, any>) => {
    // This would need endpoint configuration
    // console.log('Execute query:', query, variables);
    throw new Error('Query execution requires endpoint configuration');
  };

  const handleToggleRecording = () => {
    client.toggleRecording();
  };

  const handleToggleFilters = () => {
    client.toggleFilters();
  };

  const handleUpdateFilters = (filters: any) => {
    client.updateFilters(filters);
  };

  const handleExportData = () => {
    const data = client.exportOperations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphql-devtools-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        client.importOperations(data);
      } catch {
        // console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const _getTabIcon = (tab: string) => {
    switch (tab) {
      case 'schema':
        return <Database size={16} />;
      case 'query-builder':
        return <Search size={16} />;
      case 'performance':
        return <TrendingUp size={16} />;
      default:
        return <History size={16} />;
    }
  };

  const filteredOperations = client.getFilteredOperations();

  const tabs = [
    {
      id: 'operations',
      label: 'Operations',
      icon: History,
      badge: state.operations.length > 0 ? { count: state.operations.length } : undefined,
      content: (
        <QueryHistory
          operations={filteredOperations}
          performance={state.performance}
          selectedOperation={state.ui.selectedOperation}
          onOperationSelect={handleOperationSelect}
          onOperationDelete={handleOperationDelete}
          onClearOperations={handleClearOperations}
          onCopyOperation={handleCopyOperation}
          onReplayOperation={handleReplayOperation}
          showFilters={state.ui.showFilters}
          onToggleFilters={handleToggleFilters}
          filters={state.ui.filters}
          onUpdateFilters={handleUpdateFilters}
        />
      )
    },
    {
      id: 'schema',
      label: 'Schema',
      icon: Database,
      badge: state.schema.types.length > 0 ? { count: state.schema.types.length } : undefined,
      content: (
        <SchemaExplorer
          schemaInfo={state.schema}
          isLoading={state.isLoadingSchema}
          error={state.schemaError}
          selectedType={state.ui.selectedType}
          onTypeSelect={handleTypeSelect}
          onIntrospectSchema={handleIntrospectSchema}
        />
      )
    },
    {
      id: 'query-builder',
      label: 'Query Builder',
      icon: Search,
      badge: state.queryBuilder.selectedFields.length > 0 ? { count: state.queryBuilder.selectedFields.length } : undefined,
      content: (
        <QueryBuilder
          schemaInfo={state.schema}
          queryBuilder={state.queryBuilder}
          onUpdateQueryBuilder={handleUpdateQueryBuilder}
          onGenerateQuery={handleGenerateQuery}
          onValidateQuery={handleValidateQuery}
          onResetBuilder={handleResetBuilder}
          onExecuteQuery={handleExecuteQuery}
          onCopyQuery={(query) => { navigator.clipboard.writeText(query).catch(() => {}); }}
          validationErrors={state.queryBuilder.validationErrors}
        />
      )
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      content: (
        <EmptyState
          title="Performance Dashboard"
          description="Detailed performance analytics and monitoring will be available in a future update. For now, basic performance metrics are available in the Operations tab."
          icon={<TrendingUp className="w-12 h-12 text-gray-400" />}
          action={{
            label: "View Operations",
            onClick: () => handleTabChange('operations'),
            variant: 'primary' as const
          }}
        />
      )
    }
  ];

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-recording',
      label: state.ui.isRecording ? 'Stop Recording' : 'Start Recording',
      icon: state.ui.isRecording ? '⏸️' : '▶️',
      onClick: handleToggleRecording,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'introspect-schema',
      label: 'Introspect Schema',
      icon: '🔍',
      onClick: handleIntrospectSchema
    },
    {
      id: 'clear-operations',
      label: 'Clear Operations',
      icon: '🗑️',
      onClick: handleClearOperations,
      shortcut: 'Ctrl+K',
      separator: true
    },
    {
      id: 'export-data',
      label: 'Export Operations',
      icon: '💾',
      onClick: handleExportData,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'import-data',
      label: 'Import Operations',
      icon: '📥',
      onClick: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          handleImportData(e as any);
        };
        input.click();
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        // TODO: Open settings modal
      },
      separator: true
    }
  ];

  const metrics = [
    { label: 'Operations', value: state.operations.length },
    { label: 'Schema Types', value: state.schema.types.length },
    { label: 'Selected Fields', value: state.queryBuilder.selectedFields.length },
    { label: 'Recording', value: state.ui.isRecording ? 'Active' : 'Inactive' }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PluginPanel
        title="GraphQL DevTools"
        icon={Database}
        subtitle="Schema exploration, query building & performance monitoring"
        tabs={tabs}
        activeTabId={state.ui.activeTab}
        onTabChange={handleTabChange}
        metrics={metrics}
        showMetrics={true}
        status={{
          isActive: state.ui.isRecording,
          label: state.ui.isRecording ? 'Recording' : 'Idle'
        }}
      />
      
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
};