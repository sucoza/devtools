import React, { useState } from 'react';
import { Camera, Monitor, GitCompare, Settings, Play } from 'lucide-react';
import { PluginPanel } from './index';

function App() {
  const [activeDemo, setActiveDemo] = useState<'plugin' | 'layouts'>('plugin');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Visual Regression Monitor
                </h1>
                <p className="text-sm text-gray-500">
                  DevTools Plugin Example
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveDemo('plugin')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDemo === 'plugin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                DevTools Plugin
              </button>
              <button
                onClick={() => setActiveDemo('layouts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDemo === 'layouts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Test Layouts
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeDemo === 'plugin' ? (
          <PluginDemo />
        ) : (
          <LayoutsDemo />
        )}
      </main>
    </div>
  );
}

function PluginDemo() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-96">
        <PluginPanel />
      </div>
      
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Plugin Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Camera className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Screenshot Capture</h4>
              <p className="text-sm text-gray-600">
                Capture screenshots with Playwright integration across multiple viewports
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GitCompare className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Visual Comparison</h4>
              <p className="text-sm text-gray-600">
                Advanced pixel-by-pixel comparison with configurable thresholds
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Monitor className="w-6 h-6 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Responsive Testing</h4>
              <p className="text-sm text-gray-600">
                Test across breakpoints with automated responsive comparisons
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Play className="w-6 h-6 text-orange-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Animation Analysis</h4>
              <p className="text-sm text-gray-600">
                Frame-by-frame analysis of UI animations and transitions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutsDemo() {
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'list' | 'card'>('grid');
  
  const layouts = [
    { id: 'grid', name: 'Grid Layout', icon: Monitor },
    { id: 'list', name: 'List Layout', icon: Settings },
    { id: 'card', name: 'Card Layout', icon: Camera },
  ];

  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is item ${i + 1} with some example content that demonstrates the layout.`,
    image: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=400&h=300&auto=format&fit=crop`,
  }));

  return (
    <div className="space-y-8">
      {/* Layout Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Test Different Layouts
        </h3>
        <p className="text-gray-600 mb-6">
          Switch between different layout patterns to test visual regression detection.
          Use the DevTools plugin above to capture and compare these layouts.
        </p>
        
        <div className="flex gap-2">
          {layouts.map(layout => {
            const Icon = layout.icon;
            return (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLayout === layout.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {layout.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-6">
          Current Layout: {layouts.find(l => l.id === selectedLayout)?.name}
        </h4>
        
        {selectedLayout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-3" />
                <h5 className="font-medium text-gray-900">{item.title}</h5>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {selectedLayout === 'list' && (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedLayout === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-500" />
                <div className="p-6">
                  <h5 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h5>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Primary
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Secondary
                    </button>
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

export default App;