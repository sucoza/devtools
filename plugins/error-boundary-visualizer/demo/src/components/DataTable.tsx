import React, { useState } from 'react'

interface TableRow {
  id: number
  name: string
  status: 'active' | 'pending' | 'inactive'
  date: string
  amount: number
}

export function DataTable() {
  const [data] = useState<TableRow[]>([
    { id: 1, name: 'Order #1234', status: 'active', date: '2024-03-01', amount: 156.00 },
    { id: 2, name: 'Order #1235', status: 'pending', date: '2024-03-02', amount: 234.50 },
    { id: 3, name: 'Order #1236', status: 'active', date: '2024-03-03', amount: 89.99 },
    { id: 4, name: 'Order #1237', status: 'inactive', date: '2024-03-04', amount: 456.75 },
  ])

  const [sortField, setSortField] = useState<keyof TableRow | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof TableRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0
    
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getStatusColor = (status: TableRow['status']) => {
    switch (status) {
      case 'active': return '#48bb78'
      case 'pending': return '#ed8936'
      case 'inactive': return '#9ca3af'
      default: return '#718096'
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
        📋 Data Table
      </h2>

      <div style={{
        overflowX: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr>
              <th
                onClick={() => handleSort('name')}
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#718096',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                NAME {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('status')}
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#718096',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                STATUS {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('date')}
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#718096',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                DATE {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('amount')}
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#718096',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                AMOUNT {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr key={row.id}>
                <td style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#2d3748',
                }}>
                  {row.name}
                </td>
                <td style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: `${getStatusColor(row.status)}20`,
                    color: getStatusColor(row.status),
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#718096',
                }}>
                  {row.date}
                </td>
                <td style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#2d3748',
                  textAlign: 'right',
                  fontWeight: '500',
                }}>
                  ${row.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}