import React, { useState } from 'react'

export function FormWithValidation() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validate()
    setErrors(validationErrors)
    
    if (Object.keys(validationErrors).length === 0) {
      // Simulate form submission
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', message: '' })
      }, 3000)
      
      // Uncomment to test form submission error
      // throw new Error('Form submission failed: Server error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{
        fontSize: '20px',
        marginBottom: '20px',
        color: '#2d3748',
      }}>
        📝 Contact Form
      </h2>

      {submitted ? (
        <div style={{
          padding: '20px',
          background: '#c6f6d5',
          borderRadius: '8px',
          color: '#22543d',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>✅ Success!</p>
          <p style={{ fontSize: '14px' }}>Your message has been sent successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              color: '#4a5568',
            }}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.name ? '#fc8181' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              placeholder="Enter your name"
            />
            {errors.name && (
              <p style={{
                marginTop: '5px',
                fontSize: '12px',
                color: '#e53e3e',
              }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              color: '#4a5568',
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.email ? '#fc8181' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p style={{
                marginTop: '5px',
                fontSize: '12px',
                color: '#e53e3e',
              }}>
                {errors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              color: '#4a5568',
            }}>
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errors.message ? '#fc8181' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                minHeight: '80px',
                resize: 'vertical',
              }}
              placeholder="Enter your message"
            />
            {errors.message && (
              <p style={{
                marginTop: '5px',
                fontSize: '12px',
                color: '#e53e3e',
              }}>
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  )
}