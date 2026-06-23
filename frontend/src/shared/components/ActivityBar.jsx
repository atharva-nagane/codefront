import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ActivityBar = () => {
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  const items = [
    { path: '/', icon: '⬡', label: 'Problems' },
    { path: '/playground', icon: '▶', label: 'Playground' },
    { path: '/battle', icon: '⚔', label: 'Battle' },
    { path: '/leaderboard', icon: '◈', label: 'Leaderboard' },
  ]

  return (
    <div style={{ ...styles.bar, width: expanded ? '160px' : '48px' }}>
      <div style={styles.top}>
        {/* Toggle button */}
        <div style={styles.toggleBtn} onClick={() => setExpanded(!expanded)} title="Toggle sidebar">
          <span style={styles.toggleIcon}>{expanded ? '◀' : '▶'}</span>
          {expanded && <span style={styles.toggleLabel}>Collapse</span>}
        </div>

        {items.map(item => (
          <Link key={item.path} to={item.path} style={{
            ...styles.item,
            borderLeft: location.pathname === item.path
              ? '2px solid #00ff87'
              : '2px solid transparent',
            color: location.pathname === item.path ? '#f0f0f0' : '#555',
            justifyContent: expanded ? 'flex-start' : 'center',
            paddingLeft: expanded ? '0.85rem' : '0',
          }}
            title={!expanded ? item.label : ''}
          >
            <span style={styles.icon}>{item.icon}</span>
            {expanded && <span style={styles.label}>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* <div style={styles.bottom}>
        <Link to="/profile" style={{
          ...styles.item,
          justifyContent: expanded ? 'flex-start' : 'center',
          paddingLeft: expanded ? '0.85rem' : '0',
          color: '#555',
          borderLeft: '2px solid transparent',
        }} title={!expanded ? 'Settings' : ''}>
          <span style={styles.icon}>⚙</span>
          {expanded && <span style={styles.label}>Settings</span>}
        </Link>
      </div> */}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

const styles = {
  bar: {
    background: '#111',
    borderRight: '1px solid #1a1a1a',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0, overflow: 'hidden',
    transition: 'width 0.2s ease',
  },
  top: { display: 'flex', flexDirection: 'column' },
  bottom: { display: 'flex', flexDirection: 'column' },
  toggleBtn: {
    height: '36px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#333',
    borderBottom: '1px solid #1a1a1a',
    paddingLeft: '0',
    gap: '0.5rem',
  },
  toggleIcon: { fontSize: '0.6rem', color: '#333' },
  toggleLabel: { fontSize: '0.75rem', color: '#444', animation: 'fadeIn 0.2s ease' },
  item: {
    height: '44px', display: 'flex',
    alignItems: 'center', textDecoration: 'none',
    transition: 'color 0.15s', gap: '0.75rem',
    paddingRight: '0.5rem',
  },
  icon: { fontSize: '1rem', width: '48px', textAlign: 'center', flexShrink: 0 },
  label: { fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease' },
}

export default ActivityBar