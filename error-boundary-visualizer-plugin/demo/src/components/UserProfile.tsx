import React, { useState } from 'react'

export function UserProfile() {
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Administrator',
    avatar: '👤',
    joined: '2024-01-15',
    status: 'online',
  })

  const [showDetails, setShowDetails] = useState(false)

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
        👤 User Profile
      </h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginRight: '15px',
        }}>
          {user.avatar}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '18px',
            color: '#2d3748',
            marginBottom: '5px',
          }}>
            {user.name}
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#718096',
          }}>
            {user.role}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '5px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#48bb78',
              marginRight: '5px',
            }} />
            <span style={{
              fontSize: '12px',
              color: '#48bb78',
            }}>
              {user.status}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          padding: '10px',
          background: showDetails ? '#edf2f7' : 'transparent',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#4a5568',
          transition: 'all 0.2s',
        }}
      >
        {showDetails ? 'Hide' : 'Show'} Details
      </button>

      {showDetails && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          background: '#f7fafc',
          borderRadius: '6px',
        }}>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', color: '#718096' }}>Email</p>
            <p style={{ fontSize: '14px', color: '#2d3748' }}>{user.email}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#718096' }}>Member Since</p>
            <p style={{ fontSize: '14px', color: '#2d3748' }}>{user.joined}</p>
          </div>
        </div>
      )}
    </div>
  )
}