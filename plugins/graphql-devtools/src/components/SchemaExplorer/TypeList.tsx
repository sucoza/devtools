import React from 'react';
import { Search, Type, Database, Settings, Zap, List, Square } from 'lucide-react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ScrollableContainer, Badge, COMPONENT_STYLES } from '@sucoza/shared-components';
import type { GraphQLTypeInfo } from '../../types';

interface TypeListProps {
  types: GraphQLTypeInfo[];
  selectedType?: string;
  onTypeSelect: (typeName: string) => void;
  searchTerm?: string;
  onSearchChange: (term: string) => void;
}

export const TypeList: React.FC<TypeListProps> = ({
  types,
  selectedType,
  onTypeSelect,
  searchTerm = '',
  onSearchChange
}) => {
  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeIcon = (kind: string) => {
    if (kind.includes('OBJECT')) return <Type size={16} style={{ color: COLORS.status.info }} />;
    if (kind.includes('SCALAR')) return <Database size={16} style={{ color: COLORS.status.success }} />;
    if (kind.includes('ENUM')) return <List size={16} style={{ color: COLORS.status.warning }} />;
    if (kind.includes('INTERFACE')) return <Settings size={16} style={{ color: COLORS.text.accent }} />;
    if (kind.includes('UNION')) return <Zap size={16} style={{ color: COLORS.status.error }} />;
    if (kind.includes('INPUT')) return <Square size={16} style={{ color: COLORS.text.secondary }} />;
    return <Type size={16} style={{ color: COLORS.text.muted }} />;
  };

  const getTypeKindLabel = (kind: string) => {
    if (kind.includes('OBJECT')) return 'Object';
    if (kind.includes('SCALAR')) return 'Scalar';
    if (kind.includes('ENUM')) return 'Enum';
    if (kind.includes('INTERFACE')) return 'Interface';
    if (kind.includes('UNION')) return 'Union';
    if (kind.includes('INPUT')) return 'Input';
    return 'Type';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search bar */}
      <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.border.primary}` }}>
        <div style={{ position: 'relative' }}>
          <Search 
            style={{ 
              position: 'absolute', 
              left: SPACING.lg, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: COLORS.text.muted 
            }} 
            size={16} 
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search types..."
            style={{
              width: '100%',
              paddingLeft: SPACING['3xl'],
              paddingRight: SPACING.lg,
              paddingTop: SPACING.md,
              paddingBottom: SPACING.md,
              border: `1px solid ${COLORS.border.secondary}`,
              borderRadius: RADIUS.md,
              backgroundColor: COLORS.background.primary,
              color: COLORS.text.primary,
              outline: 'none',
              fontSize: TYPOGRAPHY.fontSize.sm
            }}
          />
        </div>
      </div>

      {/* Type list */}
      <ScrollableContainer style={{ flex: 1 }}>
        {filteredTypes.length === 0 ? (
          <div style={{ 
            padding: SPACING['2xl'], 
            textAlign: 'center', 
            color: COLORS.text.muted,
            fontSize: TYPOGRAPHY.fontSize.sm
          }}>
            {searchTerm ? 'No types found matching your search' : 'No types available'}
          </div>
        ) : (
          <div style={{ padding: SPACING.md, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {filteredTypes.map((type) => {
              const isSelected = selectedType === type.name;
              return (
              <div
                key={type.name}
                onClick={() => onTypeSelect(type.name)}
                style={{
                  padding: SPACING.lg,
                  borderRadius: RADIUS.md,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isSelected ? COLORS.background.selected : 'transparent',
                  border: `1px solid ${isSelected ? COLORS.border.focus : 'transparent'}`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = COLORS.background.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.lg }}>
                  {getTypeIcon(type.kind)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                      <span style={{ 
                        fontWeight: TYPOGRAPHY.fontWeight.medium, 
                        color: COLORS.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {type.name}
                      </span>
                      <span style={{
                        ...COMPONENT_STYLES.tabs.badge.base,
                        fontSize: TYPOGRAPHY.fontSize.xs
                      }}>
                        {getTypeKindLabel(type.kind)}
                      </span>
                    </div>
                    {type.description && (
                      <p style={{ 
                        marginTop: SPACING.sm, 
                        fontSize: TYPOGRAPHY.fontSize.sm, 
                        color: COLORS.text.secondary,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {type.description}
                      </p>
                    )}
                    <div style={{ 
                      marginTop: SPACING.md, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: SPACING['2xl'], 
                      fontSize: TYPOGRAPHY.fontSize.xs, 
                      color: COLORS.text.muted 
                    }}>
                      {type.fields && type.fields.length > 0 && (
                        <span>{type.fields.length} fields</span>
                      )}
                      {type.enumValues && type.enumValues.length > 0 && (
                        <span>{type.enumValues.length} values</span>
                      )}
                      {type.inputFields && type.inputFields.length > 0 && (
                        <span>{type.inputFields.length} input fields</span>
                      )}
                      {type.possibleTypes && type.possibleTypes.length > 0 && (
                        <span>{type.possibleTypes.length} possible types</span>
                      )}
                      {type.interfaces && type.interfaces.length > 0 && (
                        <span>{type.interfaces.length} interfaces</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </ScrollableContainer>

      {/* Type count */}
      <div style={{ 
        padding: SPACING.lg, 
        borderTop: `1px solid ${COLORS.border.primary}`, 
        backgroundColor: COLORS.background.secondary 
      }}>
        <div style={{ 
          fontSize: TYPOGRAPHY.fontSize.sm, 
          color: COLORS.text.secondary 
        }}>
          {filteredTypes.length} of {types.length} types
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>
    </div>
  );
};