import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import { SkeletonRow } from '../../../shared/components/Skeleton'
import { getContests } from '../contestsApi'

const statusColor = {
  upcoming: '#ffc107',
  active: '#00ff87',
  ended: '#444',
}

const statusBg = {
  upcoming: '#ffc10711',
  active: '#00ff8711',
  ended: '#44444411',
}

const Contests = () => {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getContests()
        setContests(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = contests.filter(c => filter === 'all' || c.status === filter)

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const statusItems = [
    { position: 'left', label: 'contests.json', icon: '◉' },
    { position: 'right', label: `${contests.filter(c => c.status === 'active').length} live`, color: '#00ff87' },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              ◉ contests.json
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>Contests</h1>
                <p style={styles.subtitle}>// compete, climb the leaderboard</p>
              </div>
              <div style={styles.filters}>
                {['all', 'upcoming', 'active', 'ended'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    ...styles.filterBtn,
                    color: filter === f ? (f === 'active' ? '#00ff87' : f === 'upcoming' ? '#ffc107' : '#f0f0f0') : '#888',
                    borderColor: filter === f ? (f === 'active' ? '#00ff87' : f === 'upcoming' ? '#ffc107' : '#333') : '#1a1a1a',
                    background: filter === f ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {!loading && filtered.length === 0 && (
              <p style={styles.empty}>// no contests found</p>
            )}

            <div style={styles.grid}>
              {loading
                ? Array(3).fill(0).map((_, i) => (
                    <div key={i} style={styles.card}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ height: '1.2rem', background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', width: '60%' }} />
                        <div style={{ height: '0.8rem', background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', width: '40%' }} />
                        <div style={{ height: '0.8rem', background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))
                : filtered.map(c => (
                    <div
                      key={c._id}
                      style={{
                        ...styles.card,
                        borderColor: c.status === 'active' ? '#00ff8733' : '#1a1a1a',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/contests/${c._id}`)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = c.status === 'active' ? '#00ff8766' : '#2a2a2a'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = c.status === 'active' ? '#00ff8733' : '#1a1a1a'}
                    >
                      <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>{c.name}</h3>
                        <span style={{
                          ...styles.statusBadge,
                          color: statusColor[c.status],
                          background: statusBg[c.status],
                          border: `1px solid ${statusColor[c.status]}33`,
                        }}>
                          {c.status === 'active' ? '● ' : ''}{c.status}
                        </span>
                      </div>

                      {c.description && (
                        <p style={styles.cardDesc}>{c.description}</p>
                      )}

                      <div style={styles.cardMeta}>
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>starts</span>
                          <span style={styles.metaVal}>{formatDate(c.startTime)}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>ends</span>
                          <span style={styles.metaVal}>{formatDate(c.endTime)}</span>
                        </div>
                      </div>

                      <div style={styles.cardFooter}>
                        <span style={styles.footerItem}>◇ {c.problemCount} problems</span>
                        <span style={styles.footerItem}>○ {c.registeredCount} registered</span>
                      </div>
                    </div>
                  ))
              }
            </div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { color: '#f0f0f0', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' },
  subtitle: { color: '#2a2a2a', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 },
  filters: { display: 'flex', gap: '0.5rem' },
  filterBtn: { padding: '0.35rem 0.8rem', border: '1px solid', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace', transition: 'all 0.15s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem', transition: 'border-color 0.15s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' },
  cardTitle: { color: '#f0f0f0', fontSize: '1rem', fontWeight: 700, margin: 0 },
  statusBadge: { fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 },
  cardDesc: { color: '#555', fontSize: '0.85rem', margin: '0 0 1rem', lineHeight: 1.5 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' },
  metaItem: { display: 'flex', gap: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' },
  metaLabel: { color: '#888', width: '40px', flexShrink: 0 },
  metaVal: { color: '#666' },
  cardFooter: { display: 'flex', gap: '1.5rem', borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem' },
  footerItem: { color: '#888', fontSize: '0.78rem', fontFamily: 'monospace' },
  empty: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.875rem' },
}

export default Contests