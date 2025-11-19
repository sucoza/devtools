import React from 'react';
import { RefreshCw, AlertCircle, Loader, Database, TrendingUp } from 'lucide-react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, COMPONENT_STYLES } from '@sucoza/shared-components';
import { TypeList } from './TypeList';
import { TypeDetails } from './TypeDetails';
import type { SchemaInfo } from '../../types';

interface SchemaExplorerProps {
  schemaInfo: SchemaInfo;
  isLoading: boolean;
  error?: string;
  selectedType?: string;
  onTypeSelect: (typeName: string) => void;
  onIntrospectSchema: () => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemaInfo,
  isLoading,
  error,
  selectedType,
  onTypeSelect,
  onIntrospectSchema
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const selectedTypeInfo = selectedType 
    ? schemaInfo.types.find(type => type.name === selectedType)
    : undefined;

  const hasSchema = schemaInfo.schema !== null;

  const schemaStats = React.useMemo(() => {
    if (!hasSchema) return null;

    const stats = {
      totalTypes: schemaInfo.types.length,
      objectTypes: schemaInfo.types.filter(t => t.kind.includes('OBJECT')).length,
      scalarTypes: schemaInfo.types.filter(t => t.kind.includes('SCALAR')).length,
      enumTypes: schemaInfo.types.filter(t => t.kind.includes('ENUM')).length,
      interfaceTypes: schemaInfo.types.filter(t => t.kind.includes('INTERFACE')).length,
      unionTypes: schemaInfo.types.filter(t => t.kind.includes('UNION')).length,
      inputTypes: schemaInfo.types.filter(t => t.kind.includes('INPUT')).length,
      totalQueries: schemaInfo.queries.length,
      totalMutations: schemaInfo.mutations.length,
      totalSubscriptions: schemaInfo.subscriptions.length
    };

    return stats;
  }, [schemaInfo, hasSchema]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: SPACING['4xl'],
        textAlign: 'center'
      }}>
        <AlertCircle size={48} style={{ color: COLORS.status.error, marginBottom: SPACING['2xl'] }} />
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.primary,
          marginBottom: SPACING.md
        }}>
          Schema Error
        </h3>
        <p style={{
          color: COLORS.text.secondary,
          marginBottom: SPACING['2xl'],
          maxWidth: '20rem'
        }}>
          {error}
        </p>
        <button
          onClick={onIntrospectSchema}
          disabled={isLoading}
          style={{
            ...COMPONENT_STYLES.button.primary,
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.md,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw 
            size={16} 
            style={{
              animation: isLoading ? 'spin 1s linear infinite' : 'none'
            }}
          />
          Retry Introspection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: SPACING['4xl'],
        textAlign: 'center'
      }}>
        <Loader
          size={48}
          style={{
            color: COLORS.status.info,
            marginBottom: SPACING['2xl'],
            animation: 'spin 1s linear infinite'
          }}
        />
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.primary,
          marginBottom: SPACING.md
        }}>
          Loading Schema...
        </h3>
        <p style={{ color: COLORS.text.secondary }}>
          Performing GraphQL introspection
        </p>
      </div>
    );
  }

  if (!hasSchema) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: SPACING['4xl'],
        textAlign: 'center'
      }}>
        <Database size={48} style={{ color: COLORS.text.muted, marginBottom: SPACING['2xl'] }} />
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.primary,
          marginBottom: SPACING.md
        }}>
          No Schema Loaded
        </h3>
        <p style={{
          color: COLORS.text.secondary,
          marginBottom: SPACING['2xl'],
          maxWidth: '20rem'
        }}>
          Load a GraphQL schema to explore types, queries, mutations, and subscriptions.
        </p>
        <button
          onClick={onIntrospectSchema}
          style={{
            ...COMPONENT_STYLES.button.primary,
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.md
          }}
        >
          <RefreshCw size={16} />
          Introspect Schema
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left Panel - Type List */}
      <div style={{
        width: '320px',
        borderRight: `1px solid ${COLORS.border.primary}`,
        backgroundColor: COLORS.background.primary
      }}>
        {/* Schema Stats Header */}
        <div style={{
          padding: SPACING['2xl'],
          borderBottom: `1px solid ${COLORS.border.primary}`,
          backgroundColor: COLORS.background.secondary
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING.lg
          }}>
            <h3 style={{
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary
            }}>
              Schema Overview
            </h3>
            <button
              onClick={onIntrospectSchema}
              disabled={isLoading}
              style={{
                padding: SPACING.sm,
                color: COLORS.text.secondary,
                borderRadius: RADIUS.sm,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease'
              }}
              title="Refresh Schema"
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = COLORS.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = COLORS.text.secondary;
                }
              }}
            >
              <RefreshCw 
                size={16} 
                style={{
                  animation: isLoading ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </button>
          </div>
          
          {schemaStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: SPACING.lg,
              fontSize: TYPOGRAPHY.fontSize.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <TrendingUp size={14} style={{ color: COLORS.status.info }} />
                <span style={{ color: COLORS.text.secondary }}>
                  {schemaStats.totalTypes} types
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <Database size={14} style={{ color: COLORS.status.success }} />
                <span style={{ color: COLORS.text.secondary }}>
                  {schemaStats.totalQueries} queries
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: COLORS.text.accent,
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                <span style={{ color: COLORS.text.secondary }}>
                  {schemaStats.totalMutations} mutations
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: COLORS.status.warning,
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                <span style={{ color: COLORS.text.secondary }}>
                  {schemaStats.totalSubscriptions} subscriptions
                </span>
              </div>
            </div>
          )}
          
          {schemaInfo.lastUpdated && (
            <div style={{
              marginTop: SPACING.lg,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.muted
            }}>
              Updated {new Date(schemaInfo.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Type List */}
        <TypeList
          types={schemaInfo.types}
          selectedType={selectedType}
          onTypeSelect={onTypeSelect}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Right Panel - Type Details or Empty State */}
      <div style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
        {selectedTypeInfo ? (
          <TypeDetails
            type={selectedTypeInfo}
            onTypeSelect={onTypeSelect}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: SPACING['4xl'],
            textAlign: 'center'
          }}>
            <Database size={48} style={{ color: COLORS.text.muted, marginBottom: SPACING['2xl'] }} />
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.md
            }}>
              Select a Type
            </h3>
            <p style={{
              color: COLORS.text.secondary,
              maxWidth: '20rem'
            }}>
              Choose a type from the list to view its details, fields, and relationships.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};