import React, { useState, useEffect } from 'react'

export function Dashboard() {
  const [metrics, setMetrics] = useState({
    users: 1234,
    revenue: 45678,
    orders: 89,
    growth: 12.5,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px',
          }} />
          <p style={{ color: '#718096' }}>Loading dashboard...</p>
        </div>
      </div>
    )
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
        📊 Dashboard
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
      }}>
        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white',
        }}>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>Active Users</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.users.toLocaleString()}</p>
        </div>

        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '8px',
          color: 'white',
        }}>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>Revenue</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${metrics.revenue.toLocaleString()}</p>
        </div>

        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '8px',
          color: 'white',
        }}>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>Orders</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.orders}</p>
        </div>

        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '8px',
          color: 'white',
        }}>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>Growth</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>+{metrics.growth}%</p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}