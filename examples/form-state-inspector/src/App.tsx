import React, { useState, useEffect, useRef } from 'react';
import { 
  registerForm, 
  updateField, 
  validateField, 
  resetForm,
  formReplayEngine,
  trackHTMLForm 
} from '@sucoza/form-state-inspector-devtools-plugin';

function App() {
  // Example 1: Manual tracking with custom form
  const [manualForm, setManualForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    bio: '',
    newsletter: false,
    terms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const htmlFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Register the manual form
    registerForm('manual-form');

    // Initialize field states
    Object.keys(manualForm).forEach(fieldName => {
      updateField('manual-form', fieldName, {
        value: manualForm[fieldName as keyof typeof manualForm],
        type: typeof manualForm[fieldName as keyof typeof manualForm] === 'boolean' ? 'checkbox' : 'text',
        isDirty: false,
        isTouched: false,
        isPristine: true,
        isValid: true,
        validation: { state: 'valid' }
      });
    });

    return () => {
      // Cleanup on unmount
      // unregisterForm('manual-form');
    };
  }, []);

  useEffect(() => {
    // Track HTML form when it's rendered
    if (htmlFormRef.current) {
      trackHTMLForm(htmlFormRef.current, 'html-native-form');
    }
  }, []);

  const handleManualFieldChange = (fieldName: string, value: any) => {
    setManualForm(prev => ({ ...prev, [fieldName]: value }));
    
    // Update field in DevTools
    updateField('manual-form', fieldName, {
      value,
      isDirty: true,
      isPristine: false,
      isTouched: true
    });

    // Validate field
    validateField('manual-form', fieldName, (val) => {
      // Custom validation logic
      if (fieldName === 'email' && !val.includes('@')) {
        return { state: 'invalid', message: 'Invalid email address' };
      }
      if (fieldName === 'password' && val.length < 8) {
        return { state: 'invalid', message: 'Password must be at least 8 characters' };
      }
      if (fieldName === 'confirmPassword' && val !== manualForm.password) {
        return { state: 'invalid', message: 'Passwords do not match' };
      }
      if (fieldName === 'age' && (parseInt(val) < 18 || parseInt(val) > 120)) {
        return { state: 'invalid', message: 'Age must be between 18 and 120' };
      }
      if (fieldName === 'username' && val.length < 3) {
        return { state: 'invalid', message: 'Username must be at least 3 characters' };
      }
      return { state: 'valid' };
    }).then(() => {
      // Update local error state if needed
      const fieldErrors = { ...errors };
      if (fieldName === 'email' && !value.includes('@')) {
        fieldErrors.email = 'Invalid email address';
      } else {
        delete fieldErrors.email;
      }
      setErrors(fieldErrors);
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Manual form submitted:', manualForm);
    alert('Form submitted! Check the DevTools to see the submission event.');
  };

  const handleReset = () => {
    setManualForm({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      bio: '',
      newsletter: false,
      terms: false
    });
    setErrors({});
    resetForm('manual-form');
  };

  const handleFillMockData = async () => {
    await formReplayEngine.fillWithMockData('manual-form', { validate: true });
    // Update local state to reflect mock data
    setManualForm({
      username: 'testuser123',
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      age: '25',
      bio: 'This is a test bio',
      newsletter: true,
      terms: true
    });
  };

  const handleReplay = async () => {
    await formReplayEngine.replayForm('manual-form', {
      speed: 2,
      onComplete: () => {
        console.log('Replay completed!');
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Form State Inspector Demo</h1>
      <p>Open the DevTools to see the Form State Inspector in action!</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px' }}>
        {/* Manual Tracking Form */}
        <div>
          <h2>Manual Tracking Form</h2>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                value={manualForm.username}
                onChange={(e) => handleManualFieldChange('username', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
              {errors.username && <span style={{ color: 'red', fontSize: '12px' }}>{errors.username}</span>}
            </div>

            <div>
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={manualForm.email}
                onChange={(e) => handleManualFieldChange('email', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
              {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email}</span>}
            </div>

            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={manualForm.password}
                onChange={(e) => handleManualFieldChange('password', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
              {errors.password && <span style={{ color: 'red', fontSize: '12px' }}>{errors.password}</span>}
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                id="confirmPassword"
                type="password"
                value={manualForm.confirmPassword}
                onChange={(e) => handleManualFieldChange('confirmPassword', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
              {errors.confirmPassword && <span style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword}</span>}
            </div>

            <div>
              <label htmlFor="age">Age:</label>
              <input
                id="age"
                type="number"
                value={manualForm.age}
                onChange={(e) => handleManualFieldChange('age', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                min="18"
                max="120"
              />
            </div>

            <div>
              <label htmlFor="bio">Bio:</label>
              <textarea
                id="bio"
                value={manualForm.bio}
                onChange={(e) => handleManualFieldChange('bio', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                rows={4}
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualForm.newsletter}
                  onChange={(e) => handleManualFieldChange('newsletter', e.target.checked)}
                />
                Subscribe to newsletter
              </label>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualForm.terms}
                  onChange={(e) => handleManualFieldChange('terms', e.target.checked)}
                  required
                />
                I agree to the terms and conditions
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Submit
              </button>
              <button type="button" onClick={handleReset} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Reset
              </button>
              <button type="button" onClick={handleFillMockData} style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Fill Mock Data
              </button>
              <button type="button" onClick={handleReplay} style={{ padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Replay
              </button>
            </div>
          </form>
        </div>

        {/* Native HTML Form with Auto-tracking */}
        <div>
          <h2>Native HTML Form (Auto-tracked)</h2>
          <form ref={htmlFormRef} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="fullname">Full Name:</label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
                aria-label="Full Name"
              />
            </div>

            <div>
              <label htmlFor="phone">Phone:</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                placeholder="123-456-7890"
                aria-label="Phone Number"
              />
            </div>

            <div>
              <label htmlFor="birthdate">Birth Date:</label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                aria-label="Birth Date"
              />
            </div>

            <div>
              <label htmlFor="country">Country:</label>
              <select
                id="country"
                name="country"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
                aria-label="Country"
              >
                <option value="">Select a country</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
              </select>
            </div>

            <div>
              <label htmlFor="website">Website:</label>
              <input
                id="website"
                name="website"
                type="url"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder="https://example.com"
                aria-label="Website URL"
              />
            </div>

            <div>
              <label htmlFor="color">Favorite Color:</label>
              <input
                id="color"
                name="color"
                type="color"
                style={{ width: '100%', padding: '4px', marginTop: '5px' }}
                aria-label="Favorite Color"
              />
            </div>

            <div>
              <label htmlFor="rating">Rating (1-10):</label>
              <input
                id="rating"
                name="rating"
                type="range"
                min="1"
                max="10"
                style={{ width: '100%', marginTop: '5px' }}
                aria-label="Rating"
              />
            </div>

            <fieldset>
              <legend>Gender:</legend>
              <label>
                <input type="radio" name="gender" value="male" />
                Male
              </label>
              <label style={{ marginLeft: '15px' }}>
                <input type="radio" name="gender" value="female" />
                Female
              </label>
              <label style={{ marginLeft: '15px' }}>
                <input type="radio" name="gender" value="other" />
                Other
              </label>
            </fieldset>

            <div>
              <label htmlFor="comments">Comments:</label>
              <textarea
                id="comments"
                name="comments"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                rows={4}
                aria-label="Comments"
                aria-describedby="comments-help"
              />
              <small id="comments-help" style={{ color: '#666' }}>
                Please provide any additional comments
              </small>
            </div>

            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Submit Native Form
            </button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✅ Real-time field value tracking</li>
          <li>✅ Validation state visualization</li>
          <li>✅ Dirty/touched/pristine state indicators</li>
          <li>✅ Form performance metrics</li>
          <li>✅ Field history timeline</li>
          <li>✅ Auto-fill testing with mock data</li>
          <li>✅ Form submission tracking</li>
          <li>✅ Accessibility audit (check DevTools)</li>
          <li>✅ Form replay functionality</li>
          <li>✅ Native HTML form auto-tracking</li>
        </ul>
      </div>
    </div>
  );
}

export default App;