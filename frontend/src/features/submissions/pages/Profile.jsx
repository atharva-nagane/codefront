import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import { SkeletonRow } from '../../../shared/components/Skeleton'
import { getMySubmissions } from '../submissionsApi'

const verdictColor = {
  'Accepted': '#00ff87',
  'Wrong Answer': '#ff4444',
  'Time Limit Exceeded': '#ffc107',
  'Memory Limit Exceeded': '#ffc107',
  'Runtime Error': '#ff4444',
  'Compile Error': '#ff4444',
  'Pending': '#444',
}

const Profile = () => {
  const { user } = useSelector((state) => state.auth)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMySubmissions(null, 1)
        setSubmissions(data.submissions)
        setPage(data.page)
        setTotalPages(data.totalPages)
      } catch (err) {
        console.error('Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await getMySubmissions(null, page + 1)
      setSubmissions(prev => [...prev, ...data.submissions])
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Failed to load more submissions')
    } finally {
      setLoadingMore(false)
    }
  }

  const solved = new Set(
    submissions.filter(s => s.verdict === 'Accepted').map(s => s.problem._id)
  ).size

  const statusItems = [
    { position: 'left', label: 'profile.json', icon: '○' },
    { position: 'right', label: `${solved} solved`, color: '#00ff87' },
    { position: 'right', label: `${submissions.length} submissions` },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              ○ profile.json
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            {/* Profile header */}
            <div style={styles.profileCard}>
              <div style={styles.avatarSection}>
                <div style={styles.avatar}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.username}>@{user?.username}</div>
                  <div style={styles.fullName}>{user?.fullName}</div>
                  {user?.role === 'admin' && (
                    <span style={styles.adminBadge}>ADMIN</span>
                  )}
                </div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <span style={styles.statNum}>{solved}</span>
                  <span style={styles.statLabel}>solved</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.stat}>
                  <span style={styles.statNum}>{submissions.length}</span>
                  <span style={styles.statLabel}>submissions</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.stat}>
                  <span style={styles.statNum}>
                    {submissions.length > 0
                      ? Math.round((submissions.filter(s => s.verdict === 'Accepted').length / submissions.length) * 100)
                      : 0}%
                  </span>
                  <span style={styles.statLabel}>accuracy</span>
                </div>
              </div>
            </div>

            <div style={styles.sectionLabel}>// submission_history</div>

            {!loading && submissions.length === 0 && (
              <p style={styles.empty}>
                // no submissions yet —{' '}
                <Link to="/" style={{ color: '#00ff87' }}>solve a problem</Link>
              </p>
            )}

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>problem</th>
                    <th style={styles.th}>language</th>
                    <th style={styles.th}>verdict</th>
                    <th style={styles.th}>time</th>
                    <th style={styles.th}>date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    : submissions.map(s => (
                        <tr key={s._id} style={styles.row}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={styles.td}>
                            <Link to={`/problems/${s.problem.slug}`} style={styles.link}>
                              {s.problem.name}
                            </Link>
                          </td>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: '#555' }}>
                            {s.language}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              color: verdictColor[s.verdict] || '#555',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              fontFamily: 'monospace',
                            }}>
                              {s.verdict === 'Accepted' ? '✓' : '✗'} {s.verdict}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: '#888' }}>
                            {s.executionTime}ms
                          </td>
                          <td style={{ ...styles.td, color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

            {!loading && page < totalPages && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button onClick={loadMore} disabled={loadingMore} style={styles.loadMoreBtn}>
                  {loadingMore ? 'loading...' : 'load more'}
                </button>
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
  profileCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '48px', height: '48px', background: '#00ff87', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0 },
  username: { color: '#f0f0f0', fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace', marginBottom: '0.2rem' },
  fullName: { color: '#888', fontSize: '0.875rem', marginBottom: '0.35rem' },
  adminBadge: { background: '#ffc10722', color: '#ffc107', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '3px', letterSpacing: '0.05em', border: '1px solid #ffc10744' },
  statsRow: { display: 'flex', alignItems: 'center', gap: '2rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  statNum: { color: '#00ff87', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' },
  statLabel: { color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  statDivider: { width: '1px', height: '40px', background: '#1a1a1a' },
  sectionLabel: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '1rem' },
  tableWrapper: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem 1.25rem', color: '#333', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a1a', fontFamily: 'monospace' },
  row: { borderBottom: '1px solid #1a1a1a', transition: 'background 0.1s' },
  td: { padding: '0.9rem 1.25rem', fontSize: '0.875rem', color: '#888' },
  link: { color: '#f0f0f0', textDecoration: 'none', fontFamily: 'monospace' },
  empty: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '1rem' },
  loadMoreBtn: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '0.5rem 1.5rem', color: '#888', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer' },
}

export default Profile