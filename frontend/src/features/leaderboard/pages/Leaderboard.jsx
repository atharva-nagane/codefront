import { useState, useEffect } from 'react'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import Spinner from '../../../shared/components/Spinner'
import api from '../../../shared/api/axios'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/leaderboard')
        setLeaderboard(res.data.leaderboard)
      } catch (err) {
        console.error('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const rankColor = (i) => {
    if (i === 0) return '#ffc107'
    if (i === 1) return '#888'
    if (i === 2) return '#cd7f32'
    return '#333'
  }

  const statusItems = [
    { position: 'left', label: 'leaderboard.json', icon: '◈' },
    { position: 'right', label: `${leaderboard.length} competitors` },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          {/* Tab bar */}
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              ◈ leaderboard.json
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>Leaderboard</h1>
              <span style={styles.subtitle}>// ranked by accepted submissions</span>
            </div>

            {loading && <Spinner />}

            {!loading && leaderboard.length === 0 && (
              <p style={styles.empty}>// no submissions yet</p>
            )}

            {!loading && leaderboard.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>rank</th>
                      <th style={styles.th}>username</th>
                      <th style={styles.th}>solved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={entry.userId} style={styles.row}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...styles.td, color: rankColor(i), fontFamily: 'monospace', fontWeight: 700 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </td>
                        <td style={{ ...styles.td, color: '#f0f0f0', fontFamily: 'monospace' }}>
                          @{entry.username}
                        </td>
                        <td style={{ ...styles.td, color: '#00ff87', fontFamily: 'monospace', fontWeight: 700 }}>
                          {entry.solvedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a' },
  header: { marginBottom: '2rem' },
  title: { color: '#f0f0f0', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' },
  subtitle: { color: '#2a2a2a', fontSize: '0.8rem', fontFamily: 'monospace' },
  tableWrapper: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem 1.25rem', color: '#333', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a1a', fontFamily: 'monospace' },
  row: { borderBottom: '1px solid #1a1a1a', transition: 'background 0.1s' },
  td: { padding: '0.9rem 1.25rem', fontSize: '0.9rem' },
  empty: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.875rem' },
}

export default Leaderboard