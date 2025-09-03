import React from 'react';
import { 
  Type, 
  Database, 
  Settings, 
  Zap, 
  List, 
  Square,
  ArrowRight,
  AlertTriangle,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ScrollableContainer, Badge, Alert } from '@sucoza/shared-components';
import type { GraphQLTypeInfo, GraphQLFieldInfo } from '../../types';

interface TypeDetailsProps {
  type: GraphQLTypeInfo;
  onTypeSelect: (typeName: string) => void;
}

export const TypeDetails: React.FC<TypeDetailsProps> = ({ type, onTypeSelect }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const getTypeIcon = (kind: string) => {
    if (kind.includes('OBJECT')) return <Type size={20} style={{ color: COLORS.accent.blue }} />;
    if (kind.includes('SCALAR')) return <Database size={20} style={{ color: COLORS.accent.green }} />;
    if (kind.includes('ENUM')) return <List size={20} style={{ color: COLORS.accent.yellow }} />;
    if (kind.includes('INTERFACE')) return <Settings size={20} style={{ color: COLORS.accent.purple }} />;
    if (kind.includes('UNION')) return <Zap size={20} style={{ color: COLORS.accent.red }} />;
    if (kind.includes('INPUT')) return <Square size={20} style={{ color: COLORS.text.secondary }} />;
    return <Type size={20} style={{ color: COLORS.text.muted }} />;
  };

  const getTypeKindLabel = (kind: string) => {
    if (kind.includes('OBJECT')) return 'Object Type';
    if (kind.includes('SCALAR')) return 'Scalar Type';
    if (kind.includes('ENUM')) return 'Enum Type';
    if (kind.includes('INTERFACE')) return 'Interface Type';
    if (kind.includes('UNION')) return 'Union Type';
    if (kind.includes('INPUT')) return 'Input Type';
    return 'Type';
  };

  const handleCopyField = async (fieldName: string) => {
    try {
      await navigator.clipboard.writeText(fieldName);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.warn('Failed to copy field name:', error);
    }
  };

  const parseTypeString = (typeString: string) => {
    // Extract the core type name from GraphQL type strings like "String!" or "[User!]!"
    const match = typeString.match(/([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : typeString;
  };

  const isBuiltinType = (typeName: string) => {
    return ['String', 'Int', 'Float', 'Boolean', 'ID'].includes(typeName);
  };

  const renderTypeLink = (typeString: string) => {
    const coreType = parseTypeString(typeString);
    
    if (isBuiltinType(coreType)) {
      return (
        <span style={{
          color: COLORS.accent.green,
          fontFamily: TYPOGRAPHY.fontFamily.mono
        }}>
          {typeString}
        </span>
      );
    }
    
    return (
      <button
        onClick={() => onTypeSelect(coreType)}
        style={{
          color: COLORS.accent.blue,
          fontFamily: TYPOGRAPHY.fontFamily.mono,
          textDecoration: 'none',
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
        onFocus={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onBlur={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {typeString}
      </button>
    );
  };

  const renderField = (field: GraphQLFieldInfo) => (
    <div key={field.name} style={{
      border: `1px solid ${COLORS.border.primary}`,
      borderRadius: RADIUS.lg,
      padding: SPACING['2xl'],
      backgroundColor: COLORS.background.secondary
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <button
              onClick={() => handleCopyField(field.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                borderRadius: RADIUS.sm,
                padding: `${SPACING.sm} ${SPACING.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.background.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary
              }}>
                {field.name}
              </span>
              {copiedField === field.name ? (
                <Check size={14} style={{ color: COLORS.accent.green }} />
              ) : (
                <Copy size={14} style={{ color: COLORS.text.muted }} />
              )}
            </button>
            <ArrowRight size={14} style={{ color: COLORS.text.muted }} />
            {renderTypeLink(field.type)}
            {field.isDeprecated && (
              <span title="Deprecated"><AlertTriangle size={14} style={{ color: COLORS.status.warning }} /></span>
            )}
          </div>
          
          {field.description && (
            <p style={{
              marginTop: SPACING.md,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary
            }}>
              {field.description}
            </p>
          )}

          {field.isDeprecated && field.deprecationReason && (
            <div style={{
              marginTop: SPACING.md,
              padding: SPACING.md,
              backgroundColor: COLORS.background.warning,
              border: `1px solid ${COLORS.border.warning}`,
              borderRadius: RADIUS.md
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                color: COLORS.text.warning
              }}>
                <AlertTriangle size={14} />
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium
                }}>Deprecated</span>
              </div>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.text.warning,
                marginTop: SPACING.sm
              }}>
                {field.deprecationReason}
              </p>
            </div>
          )}

          {field.args && field.args.length > 0 && (
            <div style={{ marginTop: SPACING.lg }}>
              <h5 style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.md
              }}>
                Arguments:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                {field.args.map((arg) => (
                  <div key={arg.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.md,
                    fontSize: TYPOGRAPHY.fontSize.sm
                  }}>
                    <span style={{
                      fontFamily: TYPOGRAPHY.fontFamily.mono,
                      color: COLORS.text.secondary
                    }}>
                      {arg.name}:
                    </span>
                    {renderTypeLink(arg.type)}
                    {arg.defaultValue !== undefined && (
                      <span style={{ color: COLORS.text.muted }}>
                        = {JSON.stringify(arg.defaultValue)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: SPACING['2xl'],
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
          {getTypeIcon(type.kind)}
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.text.primary
            }}>
              {type.name}
            </h2>
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary
            }}>
              {getTypeKindLabel(type.kind)}
            </p>
          </div>
        </div>
        
        {type.description && (
          <Alert
            type="info"
            message={type.description}
            style={{ marginTop: SPACING.lg }}
          />
        )}
      </div>

      {/* Content */}
      <ScrollableContainer style={{
        flex: 1,
        padding: SPACING['2xl'],
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING['3xl']
      }}>
        {/* Fields */}
        {type.fields && type.fields.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg
            }}>
              Fields ({type.fields.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
              {type.fields.map(renderField)}
            </div>
          </div>
        )}

        {/* Enum Values */}
        {type.enumValues && type.enumValues.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg
            }}>
              Enum Values ({type.enumValues.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: SPACING.lg
            }}>
              {type.enumValues.map((enumValue) => (
                <div 
                  key={enumValue.name}
                  style={{
                    border: `1px solid ${COLORS.border.primary}`,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    backgroundColor: COLORS.background.secondary
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                    <span style={{
                      fontFamily: TYPOGRAPHY.fontFamily.mono,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary
                    }}>
                      {enumValue.name}
                    </span>
                    {enumValue.isDeprecated && (
                      <span title="Deprecated"><AlertTriangle size={14} style={{ color: COLORS.status.warning }} /></span>
                    )}
                  </div>
                  
                  {enumValue.description && (
                    <p style={{
                      marginTop: SPACING.sm,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.secondary
                    }}>
                      {enumValue.description}
                    </p>
                  )}

                  {enumValue.isDeprecated && enumValue.deprecationReason && (
                    <div style={{
                      marginTop: SPACING.md,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.warning
                    }}>
                      Deprecated: {enumValue.deprecationReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Fields */}
        {type.inputFields && type.inputFields.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg
            }}>
              Input Fields ({type.inputFields.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
              {type.inputFields.map((inputField) => (
                <div 
                  key={inputField.name}
                  style={{
                    border: `1px solid ${COLORS.border.primary}`,
                    borderRadius: RADIUS.lg,
                    padding: SPACING['2xl'],
                    backgroundColor: COLORS.background.secondary
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                    <span style={{
                      fontFamily: TYPOGRAPHY.fontFamily.mono,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary
                    }}>
                      {inputField.name}:
                    </span>
                    {renderTypeLink(inputField.type)}
                    {inputField.defaultValue !== undefined && (
                      <span style={{ color: COLORS.text.muted }}>
                        = {JSON.stringify(inputField.defaultValue)}
                      </span>
                    )}
                  </div>
                  
                  {inputField.description && (
                    <p style={{
                      marginTop: SPACING.md,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.secondary
                    }}>
                      {inputField.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Possible Types (for Unions) */}
        {type.possibleTypes && type.possibleTypes.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg
            }}>
              Possible Types ({type.possibleTypes.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
              {type.possibleTypes.map((possibleType) => (
                <Badge
                  key={possibleType.name}
                  variant="primary"
                  size="md"
                  interactive
                  onClick={() => onTypeSelect(possibleType.name)}
                >
                  {possibleType.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interfaces */}
        {type.interfaces && type.interfaces.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg
            }}>
              Implements ({type.interfaces.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
              {type.interfaces.map((interfaceType) => (
                <Badge
                  key={interfaceType.name}
                  variant="secondary"
                  size="md"
                  interactive
                  onClick={() => onTypeSelect(interfaceType.name)}
                  style={{ backgroundColor: COLORS.accent.purple + '20', color: COLORS.accent.purple }}
                >
                  {interfaceType.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
};