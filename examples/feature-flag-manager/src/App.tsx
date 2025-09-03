import React, { useState } from 'react';
import { 
  FeatureFlagManagerPanel, 
  createFeatureFlagDevToolsClient,
  useFeatureFlagManager 
} from '@sucoza/feature-flag-manager-devtools-plugin';

const client = createFeatureFlagDevToolsClient();

// Demo feature components that react to flag changes
const NewHeader: React.FC = () => (
  <header style={{ 
    background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)', 
    color: 'white', 
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px' 
  }}>
    <h1 style={{ margin: 0, fontSize: '24px' }}>🎉 New Modern Header Design!</h1>
    <p style={{ margin: '8px 0 0', opacity: 0.9 }}>Enhanced with better navigation and visual appeal</p>
  </header>
);

const OldHeader: React.FC = () => (
  <header style={{ 
    background: '#e5e7eb', 
    color: '#374151', 
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '20px' 
  }}>
    <h1 style={{ margin: 0, fontSize: '20px' }}>Classic Header</h1>
    <p style={{ margin: '4px 0 0' }}>Traditional design</p>
  </header>
);

const PaymentMethods: React.FC<{ variant: string }> = ({ variant }) => {
  const methods = {
    control: ['💳 Credit Card'],
    'apple-pay': ['💳 Credit Card', '📱 Apple Pay'],
    'all-methods': ['💳 Credit Card', '📱 Apple Pay', '🏦 Google Pay', '💰 PayPal']
  };
  
  return (
    <div style={{ 
      padding: '16px', 
      background: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 12px', color: '#111827' }}>Payment Methods</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(methods[variant as keyof typeof methods] || methods.control).map((method, index) => (
          <span 
            key={index}
            style={{ 
              padding: '6px 12px', 
              background: '#f3f4f6', 
              borderRadius: '16px',
              fontSize: '14px',
              border: '1px solid #d1d5db'
            }}
          >
            {method}
          </span>
        ))}
      </div>
    </div>
  );
};

const PremiumFeatures: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;
  
  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
      color: 'white',
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 12px' }}>✨ Premium Features Unlocked!</h3>
      <ul style={{ margin: '0', paddingLeft: '20px' }}>
        <li>Advanced analytics dashboard</li>
        <li>Priority customer support</li>
        <li>Custom integrations</li>
        <li>Enhanced security features</li>
      </ul>
    </div>
  );
};

const DemoApp: React.FC = () => {
  const { 
    state, 
    isReady, 
    evaluateFlag, 
    toggleFlag,
    setContext 
  } = useFeatureFlagManager({
    initialContext: {
      userId: 'demo-user-123',
      userSegment: 'developer',
      attributes: {
        plan: 'premium',
        region: 'us-east-1',
        betaUser: true
      }
    }
  });

  const [demoValues, setDemoValues] = useState({
    newHeader: false,
    paymentMethods: 'control',
    premiumFeatures: false,
    darkMode: false
  });

  // Update demo values when flags change
  React.useEffect(() => {
    if (!isReady || !state) return;

    const updateDemoValues = async () => {
      try {
        const newHeaderValue = await evaluateFlag('new-header-design');
        const paymentMethodsValue = await evaluateFlag('payment-methods');
        const premiumFeaturesValue = await evaluateFlag('premium-features');
        const darkModeValue = await evaluateFlag('dark-mode');

        setDemoValues({
          newHeader: !!newHeaderValue,
          paymentMethods: paymentMethodsValue || 'control',
          premiumFeatures: !!premiumFeaturesValue,
          darkMode: !!darkModeValue
        });
      } catch (error) {
        console.log('Some flags not available yet:', error);
      }
    };

    updateDemoValues();
  }, [state, isReady, evaluateFlag]);

  const handleQuickToggle = async (flagId: string) => {
    try {
      await toggleFlag(flagId);
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleUserSegmentChange = async (segment: string) => {
    try {
      await setContext({
        userId: 'demo-user-123',
        userSegment: segment,
        attributes: {
          plan: segment === 'premium-users' ? 'premium' : 'free',
          region: 'us-east-1',
          betaUser: segment === 'beta-users'
        }
      });
    } catch (error) {
      console.error('Failed to change user segment:', error);
    }
  };

  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '18px' 
      }}>
        Loading Feature Flag Manager...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      background: demoValues.darkMode 
        ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        color: demoValues.darkMode ? '#f3f4f6' : '#1f2937'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '24px', 
          borderRadius: '16px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
          color: '#1f2937'
        }}>
          <h1 style={{ 
            margin: '0 0 16px', 
            fontSize: '32px', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🚀 Feature Flag Manager Demo
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: '16px', lineHeight: '1.6' }}>
            This demo shows how feature flags control different parts of the application. 
            Use the DevTools panel below to experiment with different flag states and see the changes in real-time!
          </p>
          
          {/* Quick Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            <button
              onClick={() => handleQuickToggle('new-header-design')}
              style={{
                padding: '8px 16px',
                background: demoValues.newHeader ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {demoValues.newHeader ? '✅' : '❌'} New Header
            </button>
            
            <button
              onClick={() => handleQuickToggle('premium-features')}
              style={{
                padding: '8px 16px',
                background: demoValues.premiumFeatures ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {demoValues.premiumFeatures ? '✅' : '❌'} Premium Features
            </button>
            
            <button
              onClick={() => handleQuickToggle('dark-mode')}
              style={{
                padding: '8px 16px',
                background: demoValues.darkMode ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {demoValues.darkMode ? '🌙' : '☀️'} Dark Mode
            </button>
          </div>

          {/* User Segment Simulator */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Quick User Segments:</span>
            {['developer', 'beta-users', 'premium-users', 'us-users'].map(segment => (
              <button
                key={segment}
                onClick={() => handleUserSegmentChange(segment)}
                style={{
                  padding: '4px 8px',
                  background: state?.currentContext.userSegment === segment ? '#3b82f6' : '#e5e7eb',
                  color: state?.currentContext.userSegment === segment ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {segment}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Application Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 400px', 
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Main Content */}
          <div>
            {/* Header that changes based on flag */}
            {demoValues.newHeader ? <NewHeader /> : <OldHeader />}
            
            {/* Premium Features */}
            <PremiumFeatures enabled={demoValues.premiumFeatures} />
            
            {/* Payment Methods */}
            <PaymentMethods variant={demoValues.paymentMethods} />
            
            {/* Sample Content */}
            <div style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '12px'
            }}>
              <h2 style={{ margin: '0 0 16px', color: '#1f2937' }}>Welcome to our platform!</h2>
              <p style={{ margin: '0 0 16px', lineHeight: '1.6', color: '#374151' }}>
                This demo application showcases how feature flags can control different aspects 
                of your user experience. Each component above is controlled by different flags 
                that you can manipulate using the DevTools panel.
              </p>
              <div style={{ 
                padding: '16px', 
                background: '#f0f9ff', 
                borderLeft: '4px solid #0ea5e9',
                borderRadius: '4px'
              }}>
                <p style={{ margin: '0', fontSize: '14px', color: '#075985' }}>
                  💡 <strong>Try this:</strong> Open the DevTools panel on the right, 
                  switch between different user segments, toggle flags on/off, 
                  and watch how the application responds in real-time!
                </p>
              </div>
            </div>
          </div>

          {/* DevTools Panel */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '12px',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            maxHeight: '80vh',
            position: 'sticky',
            top: '20px'
          }}>
            <FeatureFlagManagerPanel 
              client={client} 
              defaultTab="dashboard"
              height={600}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return <DemoApp />;
};