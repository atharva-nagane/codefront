import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import { disconnectBattleSocket } from '../battleSocket'

const reasonLabel = {
  time_expired: 'Time expired',
  both_locked: 'Both players locked out',
  all_problems_done: 'All problems completed',
  opponent_left: 'Opponent disconnected',
}

const BattleResult = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const result = location.state

  if (!result) {
    navigate('/battle')
    return null
  }

  const { winner, isDraw, playerA, playerB, reason } = result
  const isWinner = winner === user?.username
  const isLoser = !isDraw && winner && winner !== user?.username

  const handlePlayAgain = () => {
    disconnectBattleSocket()
    navigate('/battle')
  }

  const handleGoHome = () => {
    disconnectBattleSocket()
    navigate('/')
  }

  return (
    <IDELayout statusItems={[
      { position: 'left', label: 'battle.result', icon: '⚔', color: isDraw ? '#ffc107' : isWinner ? '#00ff87' : '#ff4444' },
    ]}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive, borderTopColor: '#a78bfa', color: '#a78bfa' }}>
              ⚔ battle.result
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            {/* Result banner */}
            <div style={{
              ...styles.resultBanner,
              background: isDraw ? '#ffc10711' : isWinner ? '#00ff8711' : '#ff444411',
              borderColor: isDraw ? '#ffc10744' : isWinner ? '#00ff8744' : '#ff444444',
            }}>
              <div style={{
                ...styles.resultTitle,
                color: isDraw ? '#ffc107' : isWinner ? '#00ff87' : '#ff4444',
              }}>
                {isDraw ? '🤝 Draw!' : isWinner ? '🏆 Victory!' : '💀 Defeat'}
              </div>
              <div style={styles.resultReason}>{reasonLabel[reason] || reason}</div>
            </div>

            {/* Score comparison */}
            <div style={styles.scoreCard}>
              <div style={styles.scoreTitle}>// final_scores</div>
              <div style={styles.scoreRow}>
                <div style={styles.playerScore}>
                  <div style={styles.playerName}>@{playerA.username}</div>
                  <div style={styles.scoreNum}>{playerA.score}</div>
                  <div style={styles.scoreSub}>solved</div>
                  <div style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {playerA.wrongCount}/3 wrong
                  </div>
                </div>

                <div style={styles.vs}>vs</div>

                <div style={styles.playerScore}>
                  <div style={styles.playerName}>@{playerB.username}</div>
                  <div style={styles.scoreNum}>{playerB.score}</div>
                  <div style={styles.scoreSub}>solved</div>
                  <div style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {playerB.wrongCount}/3 wrong
                  </div>
                </div>
              </div>

              {winner && !isDraw && (
                <div style={styles.winnerRow}>
                  <span style={styles.winnerLabel}>winner</span>
                  <span style={styles.winnerName}>@{winner}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button onClick={handlePlayAgain} style={styles.playAgainBtn}>
                ⚔ Play Again
              </button>
              <button onClick={handleGoHome} style={styles.homeBtn}>
                ← Back to Problems
              </button>
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
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', borderRight: '1px solid #1a1a1a', borderTop: '1px solid transparent' },
  tabActive: { background: '#111' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' },
  resultBanner: { border: '1px solid', borderRadius: '8px', padding: '2rem 3rem', textAlign: 'center', minWidth: '400px' },
  resultTitle: { fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', marginBottom: '0.5rem' },
  resultReason: { color: '#444', fontSize: '0.85rem', fontFamily: 'monospace' },
  scoreCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem', minWidth: '400px' },
  scoreTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '1.5rem' },
  scoreRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '2rem' },
  playerScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' },
  playerName: { color: '#888', fontFamily: 'monospace', fontSize: '0.875rem' },
  scoreNum: { color: '#00ff87', fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace' },
  scoreSub: { color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  vs: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '1rem' },
  winnerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1a1a1a' },
  winnerLabel: { color: '#444', fontFamily: 'monospace', fontSize: '0.78rem' },
  winnerName: { color: '#ffc107', fontFamily: 'monospace', fontWeight: 700 },
  actions: { display: 'flex', gap: '1rem' },
  playAgainBtn: { padding: '0.7rem 1.5rem', background: '#a78bfa', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.9rem' },
  homeBtn: { padding: '0.7rem 1.5rem', background: 'transparent', color: '#555', border: '1px solid #2a2a2a', borderRadius: '6px', fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.9rem' },
}

export default BattleResult