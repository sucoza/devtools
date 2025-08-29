import React, { useState } from 'react';
import { SecurityAuditPanel } from '../../src/components/SecurityAuditPanel';

export function App() {
  const [userInput, setUserInput] = useState('');

  // Intentionally vulnerable function for testing
  const handleUpdateContent = () => {
    // XSS vulnerability - directly inserting user input
    const element = document.getElementById('dynamic-content');
    if (element) {
      element.innerHTML = userInput;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main App Content */}
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Security Audit Panel Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Application</h2>
          <p className="text-gray-600 mb-4">
            This demo application contains intentional security vulnerabilities for testing the Security Audit Panel.
          </p>
          
          {/* Vulnerable form without CSRF token */}
          <form method="post" action="/submit" className="mb-6">
            <div className="mb-4">
              <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                User Input (XSS Test):
              </label>
              <input
                type="text"
                id="userInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Try entering: &lt;script&gt;alert('XSS')&lt;/script&gt;"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleUpdateContent}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update Content (Vulnerable)
            </button>
            <button
              type="submit"
              className="ml-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Submit Form (No CSRF Token)
            </button>
          </form>
          
          {/* Dynamic content area */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Dynamic Content:</h3>
            <div
              id="dynamic-content"
              className="p-4 bg-gray-50 border border-gray-200 rounded min-h-[100px]"
            >
              Content will appear here when updated...
            </div>
          </div>
          
          {/* Inline event handlers (vulnerable) */}
          <div className="mb-4">
            <button
              onClick={() => alert('Inline click handler')}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2"
            >
              Button with Inline Handler
            </button>
            
            <img
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRkY2QjY5Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+SW1nPC90ZXh0Pgo8L3N2Zz4K"
              onError={() => console.log('Image error')}
              alt="Test"
              className="inline-block"
            />
          </div>
          
          {/* Local storage with secrets */}
          <div className="mb-4">
            <button
              onClick={() => {
                localStorage.setItem('api_key', 'sk_test_1234567890abcdef');
                localStorage.setItem('user_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Store Secrets in LocalStorage (Vulnerable)
            </button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Use the Security Audit Panel
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Look for the "Security Audit Panel" tab</li>
            <li>Click "Start Scan" to detect security vulnerabilities</li>
            <li>Review the findings in the Vulnerabilities tab</li>
            <li>Configure scanners in the Settings tab</li>
            <li>Export reports from the Reports tab</li>
          </ol>
        </div>
      </div>

      {/* DevTools Panel (only visible in development) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-0 right-0 w-1/2 h-1/2 border-l border-t border-gray-300 bg-white shadow-lg">
          <SecurityAuditPanel />
        </div>
      )}
    </div>
  );
}