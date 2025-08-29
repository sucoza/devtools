import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Badge } from './Badge';
import { AlertBox } from './AlertBox';

export function ExampleComponents() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-6)'
        }}>
          Design System Components
        </h2>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-neutral-500)',
          marginBottom: 'var(--spacing-8)'
        }}>
          This example application demonstrates various components using design tokens.
          Open the DevTools panel to analyze the design system consistency.
        </p>
      </section>

      {/* Buttons Section */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Buttons
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-4)', 
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-6)'
        }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="warning">Warning Button</Button>
          <Button variant="error">Error Button</Button>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-4)', 
          flexWrap: 'wrap'
        }}>
          <Button size="small" variant="primary">Small</Button>
          <Button size="medium" variant="primary">Medium</Button>
          <Button size="large" variant="primary">Large</Button>
        </div>
      </section>

      {/* Cards Section */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Cards
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 'var(--spacing-6)'
        }}>
          <Card title="Feature Card" variant="default">
            <p style={{ 
              color: 'var(--color-neutral-500)', 
              fontSize: 'var(--font-size-sm)',
              margin: 0
            }}>
              This is a default card with some example content to demonstrate typography and spacing.
            </p>
          </Card>
          <Card title="Premium Feature" variant="elevated">
            <p style={{ 
              color: 'var(--color-neutral-500)', 
              fontSize: 'var(--font-size-sm)',
              margin: 0
            }}>
              This card has elevated styling with enhanced shadows and borders.
            </p>
          </Card>
          <Card title="Interactive Card" variant="interactive">
            <p style={{ 
              color: 'var(--color-neutral-500)', 
              fontSize: 'var(--font-size-sm)',
              margin: '0 0 var(--spacing-3) 0'
            }}>
              This card responds to hover interactions.
            </p>
            <Button size="small" variant="primary">Learn More</Button>
          </Card>
        </div>
      </section>

      {/* Form Elements Section */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Form Elements
        </h3>
        <div style={{ display: 'grid', gap: 'var(--spacing-4)', maxWidth: '400px' }}>
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="Enter your email"
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password"
          />
          <Input 
            label="Full Name" 
            type="text" 
            placeholder="Enter your full name"
            error="This field is required"
          />
        </div>
      </section>

      {/* Badges Section */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Badges
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-3)', 
          flexWrap: 'wrap'
        }}>
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
        </div>
      </section>

      {/* Alerts Section */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Alert Messages
        </h3>
        <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
          <AlertBox variant="info" title="Information">
            This is an informational message with some helpful details.
          </AlertBox>
          <AlertBox variant="success" title="Success">
            Your action was completed successfully!
          </AlertBox>
          <AlertBox variant="warning" title="Warning">
            Please review this information before proceeding.
          </AlertBox>
          <AlertBox variant="error" title="Error">
            Something went wrong. Please try again.
          </AlertBox>
        </div>
      </section>

      {/* Inconsistent Styling Examples */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-4)'
        }}>
          Inconsistent Styling Examples
        </h3>
        <p style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-neutral-500)',
          marginBottom: 'var(--spacing-4)'
        }}>
          These elements intentionally use inconsistent values to demonstrate the DevTools' issue detection.
        </p>
        <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
          {/* Non-tokenized spacing */}
          <div style={{
            background: 'white',
            padding: '13px 17px', // Inconsistent spacing
            borderRadius: '3px', // Non-standard border radius
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '15px', // Non-standard font size
              color: '#374151' 
            }}>
              This element uses non-tokenized spacing and sizing values.
            </p>
          </div>
          
          {/* Custom colors */}
          <div style={{
            background: '#FF6B6B', // Custom color not in design system
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--border-radius)',
            color: 'white'
          }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              This element uses a custom color not defined in the design tokens.
            </p>
          </div>
          
          {/* Mixed spacing units */}
          <div style={{
            background: 'var(--color-neutral-100)',
            padding: '20px', // px instead of rem/token
            marginTop: '1.5em', // em instead of token
            borderRadius: 'var(--border-radius)'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-neutral-500)'
            }}>
              This element mixes different spacing units (px, em) instead of using tokens.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}