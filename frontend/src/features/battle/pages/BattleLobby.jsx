import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import { connectBattleSocket } from '../battleSocket'
import api from '../../../shared/api/axios'

const MODES = [
  { id: '5min', label: '⚡ Blitz', time: '5 minutes', desc: 'Fast paced — solve as many as you can', color: '#ff4444' },
  { id: '10min', label: '🔥 Standard', time: '10 minutes', desc: 'Balanced — speed and accuracy matter', color: '#ffc107' },
  { id: '30min', label: '🏆 Marathon', time: '30 minutes', desc: 'Strategic — quality over quantity', color: '#00ff87' },
  { id: 'survival', label: '∞ Survival', time: 'No timer', desc: '3 wrong answers and you\'re out', color: '#a78bfa' },
]

const BattleLobby = () => {
  const [selectedMode, setSelectedMode] = useState(null)
  const [battleType, setBattleType] = useState(null) // 'solo' | 'multi'
  const [entering, setEntering] = useState(false)
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)

  const handleEnterMulti = () => {
    if (!selectedMode) return
    setEntering(true)

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1]

    const socket = connectBattleSocket(token)
    socket.emit('battle:join_queue', selectedMode)

    socket.on('battle:queued', () => {
      navigate('/battle/queue', { state: { mode: selectedMode } })
    })

    socket.on('battle:error', (err) => {
      console.error(err)
      setEntering(false)
    })
  }

  const handleEnterSolo = async () => {
    if (!selectedMode) return
    setEntering(true)
    try {
      const res = await api.post('/solo/start', { mode: selectedMode })
      navigate('/battle/solo', { state: res.data })
    } catch (err) {
      console.error(err)
      setEntering(false)
    }
  }

  const statusItems = [
    { position: 'left', label: 'battle.lobby', icon: '⚔', color: '#a78bfa' },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={{ ...styles.tabBar }}>
            <div style={{ ...styles.tab, ...styles.tabActive, borderTopColor: '#a78bfa', color: '#a78bfa' }}>
              ⚔ battle.lobby
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>Battle Mode</h1>
              <p style={styles.subtitle}>// choose your battle type</p>
            </div>

            {/* Battle type selection */}
            {!battleType ? (
              <div>
                <div style={styles.modesTitle}>// battle_type</div>
                <div style={styles.typeGrid}>
                  <div style={styles.typeCard} onClick={() => setBattleType('solo')}>
                    <div style={styles.typeIcon}>🎯</div>
                    <div style={styles.typeLabel}>Solo Practice</div>
                    <div style={styles.typeDesc}>
                      Race against the clock alone. Track your weekly and all-time best scores per mode.
                    </div>
                    <div style={styles.typeFeatures}>
                      <span style={styles.typeFeature}>✓ Personal best tracking</span>
                      <span style={styles.typeFeature}>✓ Weekly leaderboard</span>
                      <span style={styles.typeFeature}>✓ No waiting for opponent</span>
                    </div>
                    <div style={styles.typeEnter}>Solo →</div>
                  </div>

                  <div style={styles.typeCard} onClick={() => setBattleType('multi')}>
                    <div style={styles.typeIcon}>⚔</div>
                    <div style={styles.typeLabel}>1v1 Battle</div>
                    <div style={styles.typeDesc}>
                      Face a real opponent. Same problems, race to solve more. First to 3 wrongs is locked out.
                    </div>
                    <div style={styles.typeFeatures}>
                      <span style={styles.typeFeature}>✓ Real opponent matchmaking</span>
                      <span style={styles.typeFeature}>✓ Live opponent status</span>
                      <span style={styles.typeFeature}>✓ Sudden death tiebreaker</span>
                    </div>
                    <div style={styles.typeEnter}>1v1 →</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <button
                  style={styles.backBtn}
                  onClick={() => { setBattleType(null); setSelectedMode(null) }}
                >
                  ← back
                </button>

                <div style={styles.selectedType}>
                  {battleType === 'solo' ? '🎯 Solo Practice' : '⚔ 1v1 Battle'}
                </div>

                {/* Rules */}
                <div style={styles.rules}>
                  <div style={styles.rulesTitle}>// rules</div>
                  <div style={styles.rulesList}>
                    <div style={styles.rule}><span style={styles.ruleIcon}>◆</span> Problems increase in difficulty as you play more battles</div>
                    <div style={styles.rule}><span style={styles.ruleIcon}>◆</span> Wrong answer → problem skipped, added to review</div>
                    <div style={styles.rule}><span style={{ ...styles.ruleIcon, color: '#ff4444' }}>◆</span> 3 wrong answers → locked out for rest of battle</div>
                    {battleType === 'solo' && (
                      <div style={styles.rule}><span style={{ ...styles.ruleIcon, color: '#00ff87' }}>◆</span> Personal best tracked per mode — weekly and all-time</div>
                    )}
                    {battleType === 'multi' && (
                      <div style={styles.rule}><span style={{ ...styles.ruleIcon, color: '#ffc107' }}>◆</span> Tie at end → sudden death round</div>
                    )}
                  </div>
                </div>

                {/* Mode selection */}
                <div style={styles.modesTitle}>// select_mode</div>
                <div style={styles.modes}>
                  {MODES.map(mode => (
                    <div
                      key={mode.id}
                      style={{
                        ...styles.modeCard,
                        borderColor: selectedMode === mode.id ? mode.color : '#1a1a1a',
                        background: selectedMode === mode.id ? mode.color + '11' : '#111',
                      }}
                      onClick={() => setSelectedMode(mode.id)}
                    >
                      <div style={styles.modeLabel}>{mode.label}</div>
                      <div style={{ ...styles.modeTime, color: mode.color }}>{mode.time}</div>
                      <div style={styles.modeDesc}>{mode.desc}</div>
                      {selectedMode === mode.id && (
                        <div style={{ ...styles.modeSelected, color: mode.color }}>✓ selected</div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    ...styles.enterBtn,
                    background: selectedMode ? (battleType === 'solo' ? '#00ff87' : '#a78bfa') : '#1a1a1a',
                    color: selectedMode ? '#0a0a0a' : '#333',
                    cursor: selectedMode ? 'pointer' : 'not-allowed',
                  }}
                  onClick={battleType === 'solo' ? handleEnterSolo : handleEnterMulti}
                  disabled={!selectedMode || entering}
                >
                  {entering
                    ? '◌ Starting...'
                    : battleType === 'solo'
                      ? '▶ Start Solo Battle'
                      : '⚔ Enter Queue'
                  }
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
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', borderTop: '1px solid transparent' },
  tabActive: { color: '#f0f0f0', background: '#111' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a' },
  header: { marginBottom: '2rem' },
  title: { color: '#f0f0f0', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' },
  subtitle: { color: '#2a2a2a', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '700px', marginBottom: '2rem' },
  typeCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  typeIcon: { fontSize: '2rem' },
  typeLabel: { color: '#f0f0f0', fontWeight: 700, fontSize: '1.1rem' },
  typeDesc: { color: '#555', fontSize: '0.85rem', lineHeight: 1.6 },
  typeFeatures: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' },
  typeFeature: { color: '#444', fontSize: '0.8rem', fontFamily: 'monospace' },
  typeEnter: { color: '#00ff87', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: 'auto', paddingTop: '0.5rem' },
  backBtn: { background: 'transparent', border: 'none', color: '#555', fontFamily: 'monospace', fontSize: '0.85rem', cursor: 'pointer', padding: '0', marginBottom: '1.5rem' },
  selectedType: { color: '#f0f0f0', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' },
  rules: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '1.25rem', marginBottom: '2rem', maxWidth: '600px' },
  rulesTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '0.75rem' },
  rulesList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  rule: { color: '#555', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  ruleIcon: { color: '#00ff87', fontSize: '0.6rem', flexShrink: 0 },
  modesTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '1rem' },
  modes: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '900px', marginBottom: '2rem' },
  modeCard: { border: '1px solid', borderRadius: '8px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' },
  modeLabel: { color: '#f0f0f0', fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' },
  modeTime: { fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600, marginBottom: '0.5rem' },
  modeDesc: { color: '#444', fontSize: '0.8rem', lineHeight: 1.5 },
  modeSelected: { fontSize: '0.72rem', fontFamily: 'monospace', marginTop: '0.75rem', fontWeight: 600 },
  enterBtn: { padding: '0.75rem 2.5rem', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', transition: 'all 0.15s' },
}

export default BattleLobby