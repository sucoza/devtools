import React from 'react';
import { SettingsTab as SharedSettingsTab, SettingSection } from '@sucoza/shared-components';
import { RotateCcw, Download, Upload } from 'lucide-react';
import type { TabComponentProps } from '../../types';

/**
 * Settings and configuration tab component
 */
export default function SettingsTab({ state, dispatch, compact }: TabComponentProps) {
  const { settings } = state;

  const handleResetSettings = () => {
    dispatch({ type: 'settings/reset' });
  };

  const handleSettingChange = (sectionIndex: number, fieldKey: string, value: any) => {
    const sectionKeys = ['recordingOptions', 'selectorOptions', 'playbackOptions', 'uiOptions'];
    const sectionKey = sectionKeys[sectionIndex];
    
    if (sectionKey) {
      if (fieldKey === 'theme') {
        dispatch({ type: 'ui/theme/set', payload: value });
      } else {
        dispatch({
          type: 'settings/update',
          payload: {
            [sectionKey]: {
              ...settings[sectionKey as keyof typeof settings],
              [fieldKey]: value,
            },
          },
        });
      }
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'Recording Settings',
      fields: [
        {
          key: 'captureScreenshots',
          label: 'Capture Screenshots',
          type: 'boolean',
          value: settings.recordingOptions.captureScreenshots,
        },
        {
          key: 'captureConsole',
          label: 'Capture Console Logs',
          type: 'boolean',
          value: settings.recordingOptions.captureConsole,
        },
        {
          key: 'captureNetwork',
          label: 'Capture Network Requests',
          type: 'boolean',
          value: settings.recordingOptions.captureNetwork,
        },
        {
          key: 'debounceMs',
          label: 'Debounce',
          description: 'Time to wait before recording another event',
          type: 'number',
          value: settings.recordingOptions.debounceMs,
          min: 0,
          max: 5000,
          unit: 'ms',
        },
        {
          key: 'maxEvents',
          label: 'Max Events',
          description: 'Maximum number of events to record',
          type: 'number',
          value: settings.recordingOptions.maxEvents,
          min: 10,
          max: 10000,
        },
      ],
    },
    {
      title: 'Selector Settings',
      fields: [
        {
          key: 'mode',
          label: 'Selector Mode',
          type: 'select',
          value: settings.selectorOptions.mode,
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'CSS', value: 'css' },
            { label: 'XPath', value: 'xpath' },
            { label: 'Text', value: 'text' },
            { label: 'Test ID', value: 'data-testid' },
          ],
        },
        {
          key: 'timeout',
          label: 'Timeout',
          type: 'number',
          value: settings.selectorOptions.timeout,
          min: 1000,
          max: 30000,
          unit: 'ms',
        },
        {
          key: 'retries',
          label: 'Retries',
          type: 'number',
          value: settings.selectorOptions.retries,
          min: 0,
          max: 10,
        },
      ],
    },
    {
      title: 'Playback Settings',
      fields: [
        {
          key: 'defaultSpeed',
          label: 'Default Speed',
          type: 'range',
          value: settings.playbackOptions.defaultSpeed,
          min: 0.1,
          max: 3,
          step: 0.1,
          unit: 'x',
        },
        {
          key: 'waitTimeout',
          label: 'Wait Timeout',
          type: 'number',
          value: settings.playbackOptions.waitTimeout,
          min: 1000,
          max: 30000,
          unit: 'ms',
        },
        {
          key: 'screenshotOnError',
          label: 'Screenshot on Error',
          type: 'boolean',
          value: settings.playbackOptions.screenshotOnError,
        },
        {
          key: 'continueOnError',
          label: 'Continue on Error',
          type: 'boolean',
          value: settings.playbackOptions.continueOnError,
        },
      ],
    },
    {
      title: 'UI Settings',
      fields: [
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          value: settings.uiOptions.theme,
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
        },
        {
          key: 'showMinimap',
          label: 'Show Minimap',
          type: 'boolean',
          value: settings.uiOptions.showMinimap,
        },
        {
          key: 'showTimeline',
          label: 'Show Timeline',
          type: 'boolean',
          value: settings.uiOptions.showTimeline,
        },
        {
          key: 'autoScroll',
          label: 'Auto Scroll',
          type: 'boolean',
          value: settings.uiOptions.autoScroll,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <SharedSettingsTab sections={sections} onSettingChange={handleSettingChange} />
      
      {/* Custom Actions Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResetSettings}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>

          <button
            onClick={() => dispatch({ type: 'settings/export' })}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export Settings
          </button>

          <button
            onClick={() => {
              // This would trigger a file picker
              console.log('Import settings');
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            Import Settings
          </button>
        </div>
      </div>
    </div>
  );
}