import React, { useState } from 'react';
import { AccessibilityDevToolsPanel, createAccessibilityDevToolsEventClient } from '@sucoza/accessibility-devtools-plugin';

// Initialize the accessibility event client
const accessibilityClient = createAccessibilityDevToolsEventClient();

/**
 * Example app demonstrating the Accessibility DevTools plugin
 */
function App() {
  const [showDevTools, setShowDevTools] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Example Content with Accessibility Issues */}
      <div className="container mx-auto py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accessibility Test Page
          </h1>
          <p className="text-gray-600">
            This page contains various accessibility issues for testing the DevTools plugin.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Section with good accessibility */}
          <section className="bg-white rounded-lg shadow p-6" role="region" aria-labelledby="good-section">
            <h2 id="good-section" className="text-xl font-semibold text-gray-900 mb-4">
              Good Accessibility Examples
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name-input"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  aria-describedby="name-help"
                />
                <p id="name-help" className="text-sm text-gray-500 mt-1">
                  Please enter your first and last name
                </p>
              </div>

              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-describedby="submit-desc"
              >
                Submit Form
              </button>
              <p id="submit-desc" className="sr-only">
                Click to submit the form with your information
              </p>
            </div>
          </section>

          {/* Section with accessibility issues */}
          <section className="bg-white rounded-lg shadow p-6">
            {/* Missing heading */}
            <div className="text-xl font-semibold text-gray-900 mb-4">
              Bad Accessibility Examples (Issues to Find)
            </div>

            <div className="space-y-4">
              {/* Poor color contrast */}
              <div>
                <label className="block text-sm font-medium" style={{ color: '#ccc' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter email"
                // Missing id and aria-describedby
                />
                <p style={{ color: '#ddd' }} className="text-sm mt-1">
                  We'll never share your email
                </p>
              </div>

              {/* Missing alt text */}
              <div>
                <img
                  src="https://via.placeholder.com/150x100/cccccc/ffffff?text=No+Alt+Text"
                  className="w-32 h-20 object-cover rounded"
                // Missing alt attribute
                />
              </div>

              {/* Button with poor accessibility */}
              <div
                className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer inline-block"
                onClick={() => alert('This should be a button!')}
              // Missing role, tabindex, keyboard handling
              >
                Click Me (Not Actually a Button)
              </div>

              {/* Form without labels */}
              <div>
                <input type="text" placeholder="First Name" className="mr-2 px-2 py-1 border" />
                <input type="text" placeholder="Last Name" className="mr-2 px-2 py-1 border" />
                <input type="submit" value="Submit" className="px-2 py-1 bg-gray-500 text-white" />
              </div>

              {/* Link with poor description */}
              <div>
                <a href="#" className="text-blue-500">
                  Click here
                </a> to learn more about our services.
              </div>

              {/* Missing form labels and fieldsets */}
              <form>
                <div className="space-y-2">
                  <div>
                    <input type="radio" name="gender" value="male" />
                    <span className="ml-1">Male</span>
                  </div>
                  <div>
                    <input type="radio" name="gender" value="female" />
                    <span className="ml-1">Female</span>
                  </div>
                  <div>
                    <input type="radio" name="gender" value="other" />
                    <span className="ml-1">Other</span>
                  </div>
                </div>
              </form>

              {/* Inaccessible custom dropdown */}
              <div className="relative">
                <div
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer"
                  onClick={() => { }}
                // Missing ARIA attributes, keyboard support
                >
                  Select an option
                </div>
                {/* Hidden dropdown content */}
                <div className="absolute hidden bg-white border border-gray-300 rounded-md mt-1 w-full">
                  <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 1</div>
                  <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 2</div>
                  <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 3</div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation with issues */}
          <nav className="bg-white rounded-lg shadow p-6">
            {/* Missing nav landmark or role */}
            <div className="text-lg font-semibold mb-4">Site Navigation</div>
            <ul className="flex space-x-4">
              <li><a href="#" className="text-blue-500">Home</a></li>
              <li><a href="#" className="text-blue-500">About</a></li>
              <li><a href="#" className="text-blue-500">Services</a></li>
              <li><a href="#" className="text-blue-500">Contact</a></li>
            </ul>
          </nav>

          {/* Table with accessibility issues */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Table</h2>
            <table className="w-full">
              {/* Missing table headers */}
              <tr>
                <td className="border px-4 py-2 font-medium">Name</td>
                <td className="border px-4 py-2 font-medium">Age</td>
                <td className="border px-4 py-2 font-medium">City</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">John Doe</td>
                <td className="border px-4 py-2">30</td>
                <td className="border px-4 py-2">New York</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Jane Smith</td>
                <td className="border px-4 py-2">25</td>
                <td className="border px-4 py-2">Los Angeles</td>
              </tr>
            </table>
          </section>
        </div>

        {/* Toggle DevTools */}
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showDevTools ? 'Hide' : 'Show'} DevTools
          </button>
        </div>
      </div>

      {/* Accessibility DevTools Panel */}
      {showDevTools && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Accessibility DevTools</h2>
              <button
                onClick={() => setShowDevTools(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="h-full">
              <AccessibilityDevToolsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;