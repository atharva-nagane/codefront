import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import { getBattleSocket, disconnectBattleSocket } from '../battleSocket'

const BattleQueue = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mode = location.state?.mode || '10min'
  const [dots, setDots] = useState('.')
  const [waitTime, setWaitTime] = useState(0)

  useEffect(() => {
    const socket = getBattleSocket()
    if (!socket) {
      navigate('/battle')
      return
    }

    // animate dots
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)

    // increment wait time
    const timeInterval = setInterval(() => {
      setWaitTime(t => t + 1)
    }, 1000)

    socket.on('battle:matched', (data) => {
      navigate(`/battle/${data.battleId}`, { state: data })
    })

    socket.on('battle:error', (err) => {
      console.error(err)
      navigate('/battle')
    })

    return () => {
      clearInterval(dotsInterval)
      clearInterval(timeInterval)
    }
  }, [navigate])

  const handleLeave = () => {
    const socket = getBattleSocket()
    if (socket) socket.emit('battle:leave_queue', mode)
    navigate('/battle')
  }

  const modeLabel = {
    '5min': '⚡ Blitz',
    '10min': '🔥 Standard',
    '30min': '🏆 Marathon',
    'survival': '∞ Survival',
  }

  return (
    <IDELayout statusItems={[{ position: 'left', label: 'searching for opponent...', icon: '⚔', color: '#a78bfa' }]}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive, borderTopColor: '#a78bfa', color: '#a78bfa' }}>
              ⚔ matchmaking
            </div>
            <div style={styles.tabSpacer} />
          </div>
          <div style={styles.content}>
            <div style={styles.center}>
              <div style={styles.searchAnim}>
                <div style={styles.outerRing} />
                <div style={styles.innerRing} />
                <div style={styles.core}>⚔</div>
              </div>

              <div style={styles.searchText}>
                Searching for opponent{dots}
              </div>
              <div style={styles.modeTag}>{modeLabel[mode]}</div>
              <div style={styles.waitText}>
                {String(Math.floor(waitTime / 60)).padStart(2, '0')}:
                {String(waitTime % 60).padStart(2, '0')} elapsed
              </div>

              <button onClick={handleLeave} style={styles.leaveBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinReverse { to { transform: rotate(-360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.95)} }
      `}</style>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', borderTop: '1px solid transparent' },
  tabActive: { background: '#111' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' },
  searchAnim: { position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: '100px', height: '100px', border: '2px solid #a78bfa33', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'spin 1.5s linear infinite' },
  innerRing: { position: 'absolute', width: '70px', height: '70px', border: '2px solid #a78bfa22', borderBottom: '2px solid #a78bfa66', borderRadius: '50%', animation: 'spinReverse 2s linear infinite' },
  core: { fontSize: '1.5rem', animation: 'pulse 2s ease infinite' },
  searchText: { color: '#888', fontSize: '1rem', fontFamily: 'monospace' },
  modeTag: { color: '#a78bfa', fontSize: '0.875rem', fontFamily: 'monospace', background: '#a78bfa11', border: '1px solid #a78bfa33', padding: '0.25rem 0.75rem', borderRadius: '4px' },
  waitText: { color: '#888', fontSize: '0.8rem', fontFamily: 'monospace' },
  leaveBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '1rem' },
}

export default BattleQueue