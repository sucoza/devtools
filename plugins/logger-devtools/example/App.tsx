import React, { useState } from 'react';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { LoggerDevToolsPanel } from '../LoggerDevToolsPanel';
import { logger } from '../DevToolsLogger';

// Create category-specific loggers
const apiLogger = logger.child({ category: 'API', context: { service: 'backend' } });
const uiLogger = logger.child({ category: 'UI', tags: ['frontend', 'react'] });
const performanceLogger = logger.child({ category: 'Performance' });

function ExampleComponent() {
  const [count, setCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const handleIncrement = () => {
    uiLogger.debug('Button clicked', { action: 'increment', previousValue: count });
    setCount(prev => {
      const newValue = prev + 1;
      uiLogger.info(`Count updated to ${newValue}`, { newValue, previousValue: prev });
      
      // Log performance metrics
      if (newValue % 10 === 0) {
        performanceLogger.warn('High count reached', { 
          count: newValue,
          threshold: 10,
          timestamp: Date.now() 
        });
      }
      
      return newValue;
    });
  };

  const simulateAPICall = async () => {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    apiLogger.info('API request started', { 
      requestId,
      endpoint: '/api/users',
      method: 'GET' 
    });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Randomly succeed or fail
      if (Math.random() > 0.7) {
        throw new Error('Network timeout');
      }
      
      const response = {
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      };
      
      apiLogger.info('API request successful', {
        requestId,
        response,
        duration: 1000
      });
      
      return response;
    } catch (err) {
      apiLogger.error('API request failed', err, { requestId });
      setError(err as Error);
      throw err;
    }
  };

  const testAllLogLevels = () => {
    logger.trace('This is a trace message', { detail: 'very verbose' });
    logger.debug('This is a debug message', { debugging: true });
    logger.info('This is an info message', { informational: 'data' });
    logger.warn('This is a warning message', { warning: 'be careful' });
    logger.error('This is an error message', new Error('Sample error'));
    logger.fatal('This is a fatal message', { critical: 'system failure' });
  };

  const testHighVolume = () => {
    const interval = setInterval(() => {
      for (let i = 0; i < 10; i++) {
        performanceLogger.debug(`High volume log ${i}`, { 
          index: i, 
          timestamp: performance.now() 
        });
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      performanceLogger.info('High volume test completed');
    }, 3000);
  };

  const testNestedData = () => {
    const complexData = {
      user: {
        id: 123,
        profile: {
          name: 'Test User',
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
              sms: true
            }
          }
        }
      },
      metadata: {
        timestamp: Date.now(),
        version: '1.0.0',
        features: ['logging', 'metrics', 'export']
      }
    };

    logger.info('Complex nested data example', complexData, {
      category: 'Data',
      tags: ['nested', 'complex', 'example']
    });
  };

  const testContextualLogging = () => {
    // Create a logger with specific context for a user session
    const sessionLogger = logger.child({
      category: 'Session',
      context: {
        userId: 123,
        sessionId: 'abc-def-ghi',
        browser: navigator.userAgent
      }
    });

    sessionLogger.info('User logged in');
    sessionLogger.debug('Loading user preferences');
    sessionLogger.warn('Session about to expire', { minutesRemaining: 5 });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Logger DevTools Demo</h1>
      
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Basic Logging</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleIncrement}>
            Increment Count ({count})
          </button>
          <button onClick={() => simulateAPICall().catch(() => {})}>
            Simulate API Call
          </button>
          <button onClick={testAllLogLevels}>
            Test All Log Levels
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#fee', borderRadius: '4px' }}>
            Error: {error.message}
            <button onClick={() => setError(null)} style={{ marginLeft: '10px' }}>
              Clear
            </button>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Advanced Features</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testHighVolume}>
            Test High Volume (3s)
          </button>
          <button onClick={testNestedData}>
            Test Nested Data
          </button>
          <button onClick={testContextualLogging}>
            Test Contextual Logging
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Logger Control</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => logger.setEnabled(false)}>
            Disable Logging
          </button>
          <button onClick={() => logger.setEnabled(true)}>
            Enable Logging
          </button>
          <button onClick={() => logger.setLevel('debug')}>
            Set Level: Debug
          </button>
          <button onClick={() => logger.setLevel('error')}>
            Set Level: Error
          </button>
          <button onClick={() => {
            logger.setCategoryConfig('API', { enabled: false });
          }}>
            Disable API Logs
          </button>
          <button onClick={() => {
            logger.setCategoryConfig('API', { enabled: true, level: 'info' });
          }}>
            Enable API Logs (Info+)
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Console Interception</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button onClick={() => logger.enableConsoleCapture()}>
            Enable Console Capture
          </button>
          <button onClick={() => logger.disableConsoleCapture()}>
            Disable Console Capture
          </button>
          <button onClick={() => logger.enableConsoleCapture({ 
            preserveOriginal: false,
            includeTrace: true 
          })}>
            Capture Only (No Console Output)
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => {
            console.log('This is a console.log message', { data: 'example' });
          }}>
            Test console.log
          </button>
          <button onClick={() => {
            console.warn('Warning from console!', { timestamp: Date.now() });
          }}>
            Test console.warn
          </button>
          <button onClick={() => {
            console.error('Error from console:', new Error('Example error'));
          }}>
            Test console.error
          </button>
          <button onClick={() => {
            console.debug('Debug info', { userId: 123, action: 'test' });
          }}>
            Test console.debug
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Enable Console Capture above to see these console calls in the DevTools logger panel.
          Intercepted logs are marked with a 📟 icon.
        </p>
      </section>

      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Performance Testing</h2>
        <button onClick={() => {
          const start = performance.now();
          for (let i = 0; i < 1000; i++) {
            logger.trace(`Performance test log ${i}`);
          }
          const duration = performance.now() - start;
          logger.info(`Logged 1000 entries in ${duration.toFixed(2)}ms`);
        }}>
          Log 1000 Entries
        </button>
      </section>
    </div>
  );
}

export function App() {
  // Initialize logger on app start
  React.useEffect(() => {
    logger.info('Application started', {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent
    });

    return () => {
      logger.info('Application shutting down');
      logger.forceFlush();
    };
  }, []);

  return (
    <>
      <ExampleComponent />
      
      {/* TanStack DevTools with Logger Plugin */}
      <TanStackDevtools
        plugins={[
          {
            name: 'Logger',
            render: () => <LoggerDevToolsPanel />,
          },
        ]}
      />
    </>
  );
}