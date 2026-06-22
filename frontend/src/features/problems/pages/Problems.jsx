import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import Spinner from '../../../shared/components/Spinner'
import api from '../../../shared/api/axios'

const difficultyColor = { Easy: '#00ff87', Medium: '#ffc107', Hard: '#ff4444' }
const difficultyIcon = { Easy: '◇', Medium: '◈', Hard: '◆' }

const Problems = () => {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const params = filter ? { difficulty: filter } : {}
        const res = await api.get('/problems', { params })
        setProblems(res.data.problems)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProblems()
  }, [filter])

  const filtered = problems.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const statusItems = [
    { position: 'left', label: `${problems.length} problems`, icon: '⬡' },
    { position: 'right', label: filter || 'All difficulties', icon: '◈', color: filter ? difficultyColor[filter] : '#555' },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />

        {/* Sidebar — file explorer */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>EXPLORER</span>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionArrow}>▾</span>
              <span style={styles.sectionTitle}>PROBLEMS</span>
            </div>

            {/* Search */}
            <div style={styles.searchBox}>
              <input
                style={styles.searchInput}
                placeholder="Search problems..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Difficulty filters */}
            <div style={styles.filterRow}>
              {['', 'Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} onClick={() => setFilter(d)} style={{
                  ...styles.filterChip,
                  color: filter === d ? (d ? difficultyColor[d] : '#00ff87') : '#444',
                  borderColor: filter === d ? (d ? difficultyColor[d] : '#00ff87') : '#1a1a1a',
                }}>
                  {d || 'All'}
                </button>
              ))}
            </div>

            {/* Problem list as files */}
            {loading && <Spinner />}
            <div style={styles.fileList}>
              {filtered.map((p, i) => (
                <div
                  key={p._id}
                  style={{
                    ...styles.fileItem,
                    background: selected === p._id ? '#1a1a1a' : 'transparent',
                    borderLeft: selected === p._id ? '2px solid #00ff87' : '2px solid transparent',
                  }}
                  onClick={() => { setSelected(p._id); navigate(`/problems/${p.slug}`) }}
                >
                  <span style={{ color: difficultyColor[p.difficulty], marginRight: '0.5rem', fontSize: '0.7rem' }}>
                    {difficultyIcon[p.difficulty]}
                  </span>
                  <span style={styles.fileName}>{p.name}</span>
                  <span style={styles.fileIndex}>{String(i + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area — welcome screen */}
        <div style={styles.main}>
          <div style={styles.welcome}>
            <div style={styles.welcomeLogo}>
              <span style={{ color: '#00ff87' }}>&lt;</span>
              CodeFront
              <span style={{ color: '#00ff87' }}>/&gt;</span>
            </div>
            <p style={styles.welcomeText}>Select a problem from the explorer to start coding</p>
            <div style={styles.welcomeStats}>
              <div style={styles.welcomeStat}>
                <span style={{ color: '#00ff87', fontSize: '1.5rem', fontWeight: 700 }}>{problems.filter(p => p.difficulty === 'Easy').length}</span>
                <span style={{ color: '#444', fontSize: '0.75rem' }}>Easy</span>
              </div>
              <div style={styles.welcomeStat}>
                <span style={{ color: '#ffc107', fontSize: '1.5rem', fontWeight: 700 }}>{problems.filter(p => p.difficulty === 'Medium').length}</span>
                <span style={{ color: '#444', fontSize: '0.75rem' }}>Medium</span>
              </div>
              <div style={styles.welcomeStat}>
                <span style={{ color: '#ff4444', fontSize: '1.5rem', fontWeight: 700 }}>{problems.filter(p => p.difficulty === 'Hard').length}</span>
                <span style={{ color: '#444', fontSize: '0.75rem' }}>Hard</span>
              </div>
            </div>
            <div style={styles.shortcuts}>
              <div style={styles.shortcut}><kbd style={styles.kbd}>click</kbd><span style={styles.shortcutLabel}>open problem</span></div>
              <div style={styles.shortcut}><kbd style={styles.kbd}>ctrl+k</kbd><span style={styles.shortcutLabel}>search (coming soon)</span></div>
            </div>
          </div>
        </div>
      </div>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '280px', background: '#111', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  sidebarHeader: { padding: '0.75rem 1rem 0.5rem', borderBottom: '1px solid #1a1a1a' },
  sidebarTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#444', letterSpacing: '0.1em' },
  sidebarSection: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', cursor: 'pointer' },
  sectionArrow: { color: '#444', fontSize: '0.7rem' },
  sectionTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#444', letterSpacing: '0.1em' },
  searchBox: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #1a1a1a' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '0.35rem 0.6rem', color: '#888', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' },
  filterRow: { display: 'flex', gap: '0.35rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid #1a1a1a' },
  filterChip: { background: 'transparent', border: '1px solid', borderRadius: '3px', padding: '0.15rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 },
  fileList: { flex: 1, overflowY: 'auto' },
  fileItem: { display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', cursor: 'pointer', transition: 'background 0.1s' },
  fileName: { color: '#888', fontSize: '0.82rem', flex: 1, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileIndex: { color: '#2a2a2a', fontSize: '0.7rem', fontFamily: 'monospace', marginLeft: '0.5rem' },
  main: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' },
  welcome: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' },
  welcomeLogo: { fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: '#f0f0f0', letterSpacing: '-1px' },
  welcomeText: { color: '#333', fontSize: '0.875rem', margin: 0 },
  welcomeStats: { display: 'flex', gap: '3rem' },
  welcomeStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  shortcuts: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' },
  shortcut: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  kbd: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#555' },
  shortcutLabel: { color: '#333', fontSize: '0.8rem' },
}

export default Problems