import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  Palette, 
  Type, 
  Ruler, 
  Box, 
  Zap,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useDesignSystemInspector, useFilteredData, useTokenStats } from '../../hooks';

export function TokensTab() {
  const { state, actions } = useDesignSystemInspector();
  const filteredData = useFilteredData(state);
  const tokenStats = useTokenStats(filteredData.tokens);
  const [selectedToken, setSelectedToken] = useState<string | undefined>(
    state.ui.selectedToken
  );
  const [groupBy, setGroupBy] = useState<'type' | 'category'>('type');

  const handleSelectToken = (tokenId: string | undefined) => {
    setSelectedToken(tokenId);
    actions.selectToken(tokenId);
  };

  const selectedTokenData = selectedToken 
    ? filteredData.tokens.find(t => t.id === selectedToken)
    : null;

  const groupedTokens = filteredData.tokens.reduce((groups, token) => {
    const key = groupBy === 'type' ? token.type : token.category;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(token);
    return groups;
  }, {} as Record<string, typeof filteredData.tokens>);

  const typeIcons = {
    color: Palette,
    typography: Type,
    spacing: Ruler,
    size: Box,
    shadow: Zap,
    border: Box,
  };

  return (
    <div className="flex h-full">
      {/* Token List */}
      <div className="flex-none w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tokens ({filteredData.tokens.length})
            </h3>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'type' | 'category')}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="type">Group by Type</option>
              <option value="category">Group by Category</option>
            </select>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {tokenStats.utilizationRate.toFixed(0)}%
              </div>
              <div className="text-gray-500 dark:text-gray-400">Utilization</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {tokenStats.validTokens}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Valid</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {Object.keys(groupedTokens).length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tokens found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedTokens).map(([group, tokens]) => (
                <TokenGroup
                  key={group}
                  title={group}
                  tokens={tokens}
                  selectedToken={selectedToken}
                  onSelectToken={handleSelectToken}
                  typeIcons={typeIcons}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Token Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedTokenData ? (
          <TokenDetails token={selectedTokenData} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a token</p>
              <p>Choose a design token from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenGroup({
  title,
  tokens,
  selectedToken,
  onSelectToken,
  typeIcons
}: {
  title: string;
  tokens: import('../../types').DesignToken[];
  selectedToken?: string;
  onSelectToken: (id: string) => void;
  typeIcons: Record<string, any>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <span className="font-medium text-gray-900 dark:text-white capitalize">
          {title} ({tokens.length})
        </span>
        <span className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {tokens.map((token) => (
            <TokenListItem
              key={token.id}
              token={token}
              isSelected={selectedToken === token.id}
              onSelect={onSelectToken}
              Icon={typeIcons[token.type] || Box}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TokenListItem({
  token,
  isSelected,
  onSelect,
  Icon
}: {
  token: import('../../types').DesignToken;
  isSelected: boolean;
  onSelect: (id: string) => void;
  Icon: any;
}) {
  const hasIssues = token.violations && token.violations.length > 0;

  return (
    <div
      className={clsx(
        'p-3 rounded-lg cursor-pointer transition-colors border',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
      onClick={() => onSelect(token.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Icon className={clsx(
            'w-4 h-4 mr-2 flex-none',
            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
          )} />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {token.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {token.value}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          {hasIssues && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          {token.isValid && !hasIssues && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            {token.usageCount}x
          </span>
        </div>
      </div>
      
      {token.type === 'color' && (
        <div className="flex items-center mt-2">
          <div 
            className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 mr-2"
            style={{ backgroundColor: token.value }}
          />
          <TokenPreview token={token} />
        </div>
      )}
      
      {(token.type === 'typography' || token.type === 'spacing') && (
        <div className="mt-2">
          <TokenPreview token={token} />
        </div>
      )}
    </div>
  );
}

function TokenPreview({ token }: { token: import('../../types').DesignToken }) {
  switch (token.type) {
    case 'color':
      const colorToken = token as import('../../types').ColorToken;
      return (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{colorToken.hex}</span>
          {colorToken.isAccessible !== undefined && (
            <span className={clsx(
              'px-1 py-0.5 rounded text-xs',
              colorToken.isAccessible
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            )}>
              {colorToken.isAccessible ? 'A11Y' : '!A11Y'}
            </span>
          )}
        </div>
      );
      
    case 'typography':
      const typographyToken = token as import('../../types').TypographyToken;
      return (
        <div 
          className="text-xs text-gray-700 dark:text-gray-300"
          style={{ 
            fontSize: '12px',
            fontFamily: typographyToken.fontFamily,
            fontWeight: typographyToken.fontWeight 
          }}
        >
          {typographyToken.fontSize} / {typographyToken.fontWeight}
        </div>
      );
      
    case 'spacing':
      const spacingToken = token as import('../../types').SpacingToken;
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {spacingToken.pixels}px ({spacingToken.rem.toFixed(2)}rem)
        </div>
      );
      
    default:
      return null;
  }
}

function TokenDetails({ 
  token 
}: { 
  token: import('../../types').DesignToken 
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'usage' | 'issues'>('overview');
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Box, count: undefined },
    { id: 'usage', label: 'Usage', icon: Zap, count: undefined },
    { id: 'issues', label: 'Issues', icon: AlertTriangle, count: token.violations?.length || 0 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TokenTypeIcon type={token.type} className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {token.name}
              </h2>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <span className={clsx(
                    'inline-block w-2 h-2 rounded-full mr-2',
                    token.isValid ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  {token.isValid ? 'Valid' : 'Invalid'}
                </span>
                <span>{token.usageCount} uses</span>
                <span className="capitalize">{token.category}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(token.value)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Value
            </button>
            <button
              onClick={() => copyToClipboard(token.name)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Name
            </button>
          </div>
        </div>
        
        {/* Token Preview */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <TokenLargePreview token={token} />
        </div>
        
        {/* Section Navigation */}
        <div className="flex space-x-1 mt-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.label}
              {section.count !== undefined && section.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs">
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'overview' && (
          <TokenOverview token={token} />
        )}
        {activeSection === 'usage' && (
          <TokenUsage token={token} />
        )}
        {activeSection === 'issues' && (
          <TokenIssues token={token} />
        )}
      </div>
    </div>
  );
}

function TokenTypeIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    color: Palette,
    typography: Type,
    spacing: Ruler,
    size: Box,
    shadow: Zap,
    border: Box,
  };
  
  const Icon = icons[type as keyof typeof icons] || Box;
  return <Icon className={className} />;
}

function TokenLargePreview({ token }: { token: import('../../types').DesignToken }) {
  switch (token.type) {
    case 'color':
      const colorToken = token as import('../../types').ColorToken;
      return (
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-600 flex-none"
            style={{ backgroundColor: colorToken.value }}
          />
          <div className="space-y-1">
            <div className="font-mono text-sm text-gray-900 dark:text-white">
              {colorToken.value}
            </div>
            <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
              HEX: {colorToken.hex}
            </div>
            <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
              RGB: {colorToken.rgb}
            </div>
            <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
              HSL: {colorToken.hsl}
            </div>
          </div>
        </div>
      );
      
    case 'typography':
      const typographyToken = token as import('../../types').TypographyToken;
      return (
        <div className="space-y-3">
          <div 
            className="text-2xl text-gray-900 dark:text-white"
            style={{ 
              fontSize: typographyToken.fontSize,
              fontWeight: typographyToken.fontWeight,
              fontFamily: typographyToken.fontFamily,
              lineHeight: typographyToken.lineHeight 
            }}
          >
            The quick brown fox jumps
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Size:</span>
              <span className="ml-2 font-mono">{typographyToken.fontSize}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Weight:</span>
              <span className="ml-2 font-mono">{typographyToken.fontWeight}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Line Height:</span>
              <span className="ml-2 font-mono">{typographyToken.lineHeight}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Family:</span>
              <span className="ml-2 font-mono text-xs">{typographyToken.fontFamily}</span>
            </div>
          </div>
        </div>
      );
      
    case 'spacing':
      const spacingToken = token as import('../../types').SpacingToken;
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <div 
              className="bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400"
              style={{ width: `${Math.min(spacingToken.pixels, 200)}px`, height: '32px' }}
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {spacingToken.pixels}px visual representation
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Pixels:</span>
              <span className="ml-2 font-mono">{spacingToken.pixels}px</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">REM:</span>
              <span className="ml-2 font-mono">{spacingToken.rem.toFixed(2)}rem</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Scale:</span>
              <span className="ml-2 font-mono">{spacingToken.scale}</span>
            </div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="font-mono text-lg text-gray-900 dark:text-white">
          {token.value}
        </div>
      );
  }
}

function TokenOverview({ token }: { token: import('../../types').DesignToken }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Token Information
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{token.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Value</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{token.value}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{token.type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{token.category}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Usage Count</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{token.usageCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
            <dd className={clsx(
              'mt-1 text-sm font-medium',
              token.isValid 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            )}>
              {token.isValid ? 'Valid' : 'Invalid'}
            </dd>
          </div>
        </dl>
      </div>
      
      {token.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h4>
          <p className="text-sm text-gray-900 dark:text-white">{token.description}</p>
        </div>
      )}
    </div>
  );
}

function TokenUsage({ token }: { token: import('../../types').DesignToken }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Usage Analysis
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {token.usageCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Times used in your application
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
        <div className="space-y-2 text-sm">
          {token.usageCount === 0 && (
            <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-yellow-800 dark:text-yellow-200">
                This token is not being used. Consider removing it or documenting its purpose.
              </span>
            </div>
          )}
          {token.usageCount === 1 && (
            <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Box className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-800 dark:text-blue-200">
                This token is only used once. Consider if it should be a token or just a value.
              </span>
            </div>
          )}
          {token.usageCount > 10 && (
            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-800 dark:text-green-200">
                This token is well-utilized across your application.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TokenIssues({ token }: { token: import('../../types').DesignToken }) {
  const issues = token.violations || [];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Issues ({issues.length})
        </h3>
        
        {issues.length === 0 ? (
          <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
            <span className="text-green-800 dark:text-green-200">
              No issues found with this token.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-none" />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      {issue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}