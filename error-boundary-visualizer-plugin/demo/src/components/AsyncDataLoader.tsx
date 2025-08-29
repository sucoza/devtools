import React, { useState, useEffect } from 'react'

export function AsyncDataLoader() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Randomly succeed or fail for demo
          if (Math.random() > 0.7) {
            reject(new Error('Failed to fetch data from API'))
          } else {
            resolve({
              users: 1234,
              posts: 5678,
              comments: 9012,
            })
          }
        }, 1500)
      }).then((result) => {
        setData(result)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Optionally throw to trigger error boundary
      // throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      minHeight: '200px',
    }}>
      <h2 style={{
        fontSize: '20px',
        marginBottom: '20px',
        color: '#2d3748',
      }}>
        🔄 Async Data Loader
      </h2>

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px',
          }} />
          <p style={{ color: '#718096' }}>Loading data...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px',
          background: '#fed7d7',
          borderRadius: '8px',
          color: '#c53030',
        }}>
          <p style={{ fontWeight: '500', marginBottom: '10px' }}>Error loading data:</p>
          <p style={{ fontSize: '14px' }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <div>
          <p style={{
            color: '#718096',
            fontSize: '14px',
            marginBottom: '15px',
          }}>
            Successfully loaded data from API
          </p>
          <div style={{
            display: 'grid',
            gap: '10px',
          }}>
            <div style={{
              padding: '10px',
              background: '#f7fafc',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#718096', fontSize: '14px' }}>Users:</span>
              <span style={{ color: '#2d3748', fontWeight: '500' }}>{data.users}</span>
            </div>
            <div style={{
              padding: '10px',
              background: '#f7fafc',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#718096', fontSize: '14px' }}>Posts:</span>
              <span style={{ color: '#2d3748', fontWeight: '500' }}>{data.posts}</span>
            </div>
            <div style={{
              padding: '10px',
              background: '#f7fafc',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#718096', fontSize: '14px' }}>Comments:</span>
              <span style={{ color: '#2d3748', fontWeight: '500' }}>{data.comments}</span>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '10px',
              background: 'transparent',
              color: '#667eea',
              border: '1px solid #667eea',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Refresh Data
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}