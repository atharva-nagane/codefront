const IDELayout = ({ children, statusItems = [] }) => {
  return (
    <div style={styles.root}>
      <div style={styles.content}>
        {children}
      </div>
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusBrand}>
            <span style={{ color: '#00ff87' }}>&lt;</span>
            CodeFront
            <span style={{ color: '#00ff87' }}>/&gt;</span>
          </span>
          {statusItems.filter(i => i.position === 'left').map((item, i) => (
            <span key={i} style={{ ...styles.statusItem, color: item.color || '#555' }}>
              {item.icon && <span style={{ marginRight: '0.35rem' }}>{item.icon}</span>}
              {item.label}
            </span>
          ))}
        </div>
        <div style={styles.statusRight}>
          {statusItems.filter(i => i.position === 'right').map((item, i) => (
            <span key={i} style={{ ...styles.statusItem, color: item.color || '#555' }}>
              {item.icon && <span style={{ marginRight: '0.35rem' }}>{item.icon}</span>}
              {item.label}
            </span>
          ))}
          <span style={styles.statusItem}>
            <span style={{ color: '#00ff87', marginRight: '0.35rem' }}>●</span>
            Connected
          </span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0a0a0a',
    overflow: 'hidden',
  },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  statusBar: {
    height: '24px', background: '#007a3d',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem', flexShrink: 0,
    borderTop: '1px solid #00994d',
  },
  statusLeft: { display: 'flex', alignItems: 'center', gap: '0' },
  statusRight: { display: 'flex', alignItems: 'center', gap: '0' },
  statusBrand: {
    fontFamily: 'monospace', fontSize: '0.75rem',
    fontWeight: 700, color: '#fff',
    marginRight: '1rem', letterSpacing: '-0.3px',
  },
  statusItem: {
    fontSize: '0.72rem', color: '#aaffcc',
    padding: '0 0.75rem',
    borderLeft: '1px solid #00994d',
    display: 'flex', alignItems: 'center',
    height: '24px',
  },
}

export default IDELayout