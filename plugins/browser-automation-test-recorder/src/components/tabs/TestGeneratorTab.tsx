import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Code, Download, Upload, FileText, Settings, Play, Copy, Eye, 
  Palette, Zap, RefreshCw, ChevronDown, ChevronRight, Terminal,
  Layers, Package, Globe, Smartphone
} from 'lucide-react';

import type { TabComponentProps, TestFormat, TestFramework } from '../../types';
import { CodeGenerator } from '../../core/code-generator';
import { TemplateEngine } from '../../core/templates/template-engine';

interface GeneratedTestFile {
  filename: string;
  content: string;
  type: 'test' | 'page-object' | 'helper' | 'config';
  language: string;
  framework: string;
}

interface CodePreviewState {
  generatedFiles: GeneratedTestFile[];
  activeFile: string | null;
  isGenerating: boolean;
  error: string | null;
  lastGenerated: number;
}

/**
 * Enhanced Test generation and export tab component
 */
export default function TestGeneratorTab({ state, dispatch, compact }: TabComponentProps) {
  const { settings } = state;
  const hasEvents = state.events.length > 0;
  
  // Enhanced state management
  const [previewState, setPreviewState] = useState<CodePreviewState>({
    generatedFiles: [],
    activeFile: null,
    isGenerating: false,
    error: null,
    lastGenerated: 0
  });
  
  const [selectedFramework, setSelectedFramework] = useState<TestFormat>('playwright');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('typescript');
  const [codeGenOptions, setCodeGenOptions] = useState({
    includeAssertions: true,
    includeComments: true,
    includeSetup: true,
    pageObjectModel: false,
    optimizeSelectors: true,
    groupActions: true,
    generateHelpers: false
  });
  
  const [expandedSections, setExpandedSections] = useState({
    options: true,
    preview: true,
    templates: false,
    advanced: false
  });

  // Generate test code
  const handleGenerateTest = async () => {
    if (!hasEvents) return;
    
    setPreviewState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const codeGenerator = new CodeGenerator({
        format: selectedFramework,
        framework: 'jest',
        language: selectedLanguage as any,
        includeAssertions: codeGenOptions.includeAssertions,
        includeComments: codeGenOptions.includeComments,
        includeSetup: codeGenOptions.includeSetup,
        optimizeSelectors: codeGenOptions.optimizeSelectors,
        groupActions: codeGenOptions.groupActions,
        pageObjectModel: codeGenOptions.pageObjectModel,
      });

      const generatedTest = await codeGenerator.generateTest(state.events, {
        format: selectedFramework,
        framework: 'jest',
        includeAssertions: codeGenOptions.includeAssertions,
        groupActions: codeGenOptions.groupActions,
        addComments: codeGenOptions.includeComments,
        optimizeSelectors: codeGenOptions.optimizeSelectors,
      });

      // Simulate file generation (normally would come from generators)
      const files: GeneratedTestFile[] = [
        {
          filename: `test.${selectedLanguage === 'typescript' ? 'ts' : 'js'}`,
          content: generatedTest.code,
          type: 'test',
          language: selectedLanguage,
          framework: selectedFramework
        }
      ];

      if (codeGenOptions.pageObjectModel) {
        files.push({
          filename: `page-objects/HomePage.${selectedLanguage === 'typescript' ? 'ts' : 'js'}`,
          content: '// Generated Page Object\nexport class HomePage {\n  // Page object implementation\n}',
          type: 'page-object',
          language: selectedLanguage,
          framework: selectedFramework
        });
      }

      if (codeGenOptions.generateHelpers) {
        files.push({
          filename: `utils/test-helpers.${selectedLanguage === 'typescript' ? 'ts' : 'js'}`,
          content: '// Generated test helpers\nexport class TestHelpers {\n  // Helper methods\n}',
          type: 'helper',
          language: selectedLanguage,
          framework: selectedFramework
        });
      }

      setPreviewState({
        generatedFiles: files,
        activeFile: files[0].filename,
        isGenerating: false,
        error: null,
        lastGenerated: Date.now()
      });

      // Dispatch the generated test
      dispatch({
        type: 'test/generate',
        payload: {
          format: selectedFramework,
          framework: 'jest',
          includeAssertions: codeGenOptions.includeAssertions,
          groupActions: codeGenOptions.groupActions,
          addComments: codeGenOptions.includeComments,
          optimizeSelectors: codeGenOptions.optimizeSelectors,
        },
      });

    } catch (error) {
      setPreviewState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate test code'
      }));
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async (filename?: string) => {
    const file = filename 
      ? previewState.generatedFiles.find(f => f.filename === filename)
      : previewState.generatedFiles.find(f => f.filename === previewState.activeFile);
      
    if (file) {
      await navigator.clipboard.writeText(file.content);
      // Show success feedback
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get available languages for framework
  const getAvailableLanguages = (framework: TestFormat) => {
    const languageMap: Record<TestFormat, string[]> = {
      playwright: ['javascript', 'typescript'],
      cypress: ['javascript', 'typescript'],
      selenium: ['javascript', 'typescript', 'python', 'csharp'],
      puppeteer: ['javascript', 'typescript'],
      testcafe: ['javascript', 'typescript'],
      webdriver: ['javascript'],
      custom: ['javascript', 'typescript']
    };
    return languageMap[framework] || ['javascript'];
  };

  // Auto-adjust language when framework changes
  useEffect(() => {
    const availableLanguages = getAvailableLanguages(selectedFramework);
    if (!availableLanguages.includes(selectedLanguage)) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [selectedFramework, selectedLanguage]);

  return (
    <div className="test-generator-tab">
      {/* Framework & Language Selection */}
      <div className="framework-section">
        <div className="section-header" onClick={() => toggleSection('options')}>
          {expandedSections.options ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h3>Framework & Options</h3>
        </div>
        
        {expandedSections.options && (
          <div className="framework-content">
            <div className="framework-grid">
              <div className="framework-selector">
                <label>Framework:</label>
                <div className="framework-options">
                  {(['playwright', 'cypress', 'selenium', 'puppeteer'] as TestFormat[]).map(framework => (
                    <button
                      key={framework}
                      className={`framework-button ${selectedFramework === framework ? 'active' : ''}`}
                      onClick={() => setSelectedFramework(framework)}
                    >
                      <div className="framework-icon">
                        {framework === 'playwright' && <Globe size={20} />}
                        {framework === 'cypress' && <Zap size={20} />}
                        {framework === 'selenium' && <Package size={20} />}
                        {framework === 'puppeteer' && <Terminal size={20} />}
                      </div>
                      <span className="framework-name">{framework}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="language-selector">
                <label>Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="language-select"
                >
                  {getAvailableLanguages(selectedFramework).map(lang => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="generation-options">
              <div className="option-grid">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.includeComments}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      includeComments: e.target.checked
                    }))}
                  />
                  <span>Include comments</span>
                </label>

                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.includeAssertions}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      includeAssertions: e.target.checked
                    }))}
                  />
                  <span>Include assertions</span>
                </label>

                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.includeSetup}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      includeSetup: e.target.checked
                    }))}
                  />
                  <span>Setup/teardown</span>
                </label>

                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.pageObjectModel}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      pageObjectModel: e.target.checked
                    }))}
                  />
                  <span>Page Object Model</span>
                </label>

                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.optimizeSelectors}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      optimizeSelectors: e.target.checked
                    }))}
                  />
                  <span>Optimize selectors</span>
                </label>

                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={codeGenOptions.groupActions}
                    onChange={(e) => setCodeGenOptions(prev => ({
                      ...prev,
                      groupActions: e.target.checked
                    }))}
                  />
                  <span>Group actions</span>
                </label>
              </div>
            </div>

            <div className="generation-actions">
              <button
                onClick={handleGenerateTest}
                disabled={!hasEvents || previewState.isGenerating}
                className="primary-button"
              >
                {previewState.isGenerating ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code size={16} />
                    Generate Test
                  </>
                )}
              </button>

              <button
                onClick={() => dispatch({ type: 'test/export', payload: { format: 'json', includeMetadata: true, includeScreenshots: false, compress: false } })}
                disabled={!hasEvents}
                className="secondary-button"
              >
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Code Preview Section */}
      <div className="preview-section">
        <div className="section-header" onClick={() => toggleSection('preview')}>
          {expandedSections.preview ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h3>Generated Code</h3>
          {previewState.generatedFiles.length > 0 && (
            <div className="preview-info">
              {previewState.generatedFiles.length} file{previewState.generatedFiles.length > 1 ? 's' : ''} generated
            </div>
          )}
        </div>

        {expandedSections.preview && (
          <div className="preview-content">
            {previewState.error && (
              <div className="error-message">
                <span>⚠️ {previewState.error}</span>
              </div>
            )}

            {previewState.generatedFiles.length === 0 && !previewState.isGenerating ? (
              <div className="empty-preview">
                <Code size={48} opacity={0.3} />
                <p>No code generated yet.</p>
                <p>Configure your options and click "Generate Test" to see the code.</p>
              </div>
            ) : (
              <>
                {previewState.generatedFiles.length > 1 && (
                  <div className="file-tabs">
                    {previewState.generatedFiles.map(file => (
                      <button
                        key={file.filename}
                        className={`file-tab ${previewState.activeFile === file.filename ? 'active' : ''}`}
                        onClick={() => setPreviewState(prev => ({ ...prev, activeFile: file.filename }))}
                      >
                        <div className="file-icon">
                          {file.type === 'test' && <FileText size={14} />}
                          {file.type === 'page-object' && <Layers size={14} />}
                          {file.type === 'helper' && <Package size={14} />}
                          {file.type === 'config' && <Settings size={14} />}
                        </div>
                        <span className="file-name">{file.filename}</span>
                      </button>
                    ))}
                  </div>
                )}

                {previewState.activeFile && (
                  <div className="code-preview">
                    <div className="code-header">
                      <div className="code-title">
                        {previewState.activeFile}
                      </div>
                      <div className="code-actions">
                        <button
                          onClick={() => handleCopyCode()}
                          className="icon-button"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title="View in external editor"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="code-content">
                      <pre><code>
                        {previewState.generatedFiles.find(f => f.filename === previewState.activeFile)?.content}
                      </code></pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Generated Tests */}
      <div className="tests-section">
        <h3>Generated Tests</h3>
        
        {state.testCases.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} opacity={0.3} />
            <p>No tests generated yet.</p>
            <p>Record some events and generate your first test case.</p>
          </div>
        ) : (
          <div className="tests-list">
            {state.testCases.map(testCase => (
              <div key={testCase.id} className="test-item">
                <div className="test-header">
                  <div className="test-name">{testCase.name}</div>
                  <div className="test-date">
                    {new Date(testCase.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="test-description">{testCase.description}</div>
                <div className="test-meta">
                  Events: {testCase.events.length} | Assertions: {testCase.assertions.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Templates */}
      <div className="templates-section">
        <h3>Test Templates</h3>
        
        <div className="template-grid">
          <div className="template-item">
            <div className="template-name">Basic E2E Test</div>
            <div className="template-description">
              Simple end-to-end test with navigation and basic interactions
            </div>
          </div>

          <div className="template-item">
            <div className="template-name">Form Submission Test</div>
            <div className="template-description">
              Test template optimized for form filling and submission flows
            </div>
          </div>

          <div className="template-item">
            <div className="template-name">API Integration Test</div>
            <div className="template-description">
              Includes network request mocking and API response validation
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="placeholder-section">
        <p>Test generation functionality will include:</p>
        <ul>
          <li>Multiple test framework support (Playwright, Cypress, Selenium, etc.)</li>
          <li>Smart test case generation with logical grouping</li>
          <li>Automatic assertion generation based on page state</li>
          <li>Test optimization and deduplication</li>
          <li>Custom test templates and patterns</li>
          <li>Code preview and editing capabilities</li>
        </ul>
      </div>

      <style>{`
        .test-generator-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 100vh;
          overflow-y: auto;
        }

        .framework-section,
        .preview-section,
        .tests-section,
        .templates-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-primary, #ffffff);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }

        .section-header:hover {
          background: var(--bg-tertiary, #f0f0f0);
        }

        .framework-content,
        .preview-content {
          padding: 16px;
        }

        .framework-grid {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 16px;
          margin-bottom: 16px;
        }

        .framework-selector label,
        .language-selector label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .framework-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .framework-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border: 2px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          background: var(--bg-primary, #ffffff);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .framework-button:hover {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .framework-button.active {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary, #007bff);
          color: white;
        }

        .framework-icon {
          opacity: 0.7;
        }

        .framework-button.active .framework-icon {
          opacity: 1;
        }

        .framework-name {
          font-weight: 500;
          text-transform: capitalize;
        }

        .language-select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          font-size: 13px;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .option-label:hover {
          background: var(--bg-tertiary, #f0f0f0);
        }

        .option-label input[type="checkbox"] {
          margin: 0;
        }

        .generation-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #e1e5e9);
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-button {
          background: var(--bg-tertiary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #ced4da);
        }

        .secondary-button:hover:not(:disabled) {
          background: var(--bg-quaternary, #dee2e6);
          transform: translateY(-1px);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .preview-info {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          background: var(--bg-tertiary, #e9ecef);
          padding: 4px 8px;
          border-radius: 12px;
        }

        .error-message {
          padding: 12px;
          background: var(--color-error-light, #f8d7da);
          border: 1px solid var(--color-error, #dc3545);
          border-radius: 4px;
          color: var(--color-error-dark, #721c24);
          margin-bottom: 16px;
        }

        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary, #6c757d);
          text-align: center;
          min-height: 200px;
        }

        .empty-preview p {
          margin: 8px 0;
        }

        .file-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          padding-bottom: 0;
        }

        .file-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: var(--bg-tertiary, #f8f9fa);
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px 4px 0 0;
          font-size: 12px;
        }

        .file-tab:hover {
          background: var(--bg-quaternary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .file-tab.active {
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1a1a1a);
          border-bottom: 2px solid var(--color-primary, #007bff);
        }

        .file-icon {
          opacity: 0.7;
        }

        .file-tab.active .file-icon {
          opacity: 1;
        }

        .code-preview {
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          overflow: hidden;
        }

        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-tertiary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
        }

        .code-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .code-actions {
          display: flex;
          gap: 8px;
        }

        .icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: var(--bg-primary, #ffffff);
          color: var(--text-secondary, #6c757d);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .icon-button:hover {
          background: var(--bg-quaternary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .code-content {
          max-height: 400px;
          overflow: auto;
          background: var(--bg-primary, #ffffff);
        }

        .code-content pre {
          margin: 0;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-primary, #1a1a1a);
          background: transparent;
          overflow-x: auto;
        }

        .code-content code {
          font-family: inherit;
          white-space: pre-wrap;
          word-break: break-word;
        }

        h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .generation-options {
          margin-bottom: 16px;
        }

        .option-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .option-row label {
          min-width: 80px;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
        }

        .option-row select {
          flex: 1;
          max-width: 200px;
          padding: 6px 8px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          font-size: 13px;
        }

        .option-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
          cursor: pointer;
        }

        .generation-actions {
          display: flex;
          gap: 8px;
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: var(--bg-tertiary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #ced4da);
        }

        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary, #6c757d);
          text-align: center;
        }

        .empty-state p {
          margin: 8px 0;
        }

        .tests-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .test-item {
          padding: 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .test-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .test-date {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
        }

        .test-description {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          margin-bottom: 4px;
        }

        .test-meta {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .template-item {
          padding: 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .template-item:hover {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .template-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 4px;
        }

        .template-description {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-section p {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-section ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-section li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}