import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'

const modeLabel = {
  '5min': '⚡ Blitz',
  '10min': '🔥 Standard',
  '30min': '🏆 Marathon',
  'survival': '∞ Survival',
}

const SoloResult = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state

  if (!result) {
    navigate('/battle')
    return null
  }

  const { score, wrongCount, timeTaken, isNewAllTimeBest, isNewWeeklyBest, allTimeBest, weeklyBest, review } = result

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <IDELayout statusItems={[
      { position: 'left', label: 'solo.result', icon: '🎯', color: '#00ff87' },
    ]}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive, borderTopColor: '#00ff87' }}>
              🎯 solo.result
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            {/* Score banner */}
            <div style={styles.scoreBanner}>
              <div style={styles.scoreNum}>{score}</div>
              <div style={styles.scoreLabel}>problems solved</div>
              <div style={styles.badges}>
                {isNewAllTimeBest && (
                  <span style={styles.badge}>🏆 New All-Time Best!</span>
                )}
                {isNewWeeklyBest && !isNewAllTimeBest && (
                  <span style={{ ...styles.badge, background: '#ffc10722', color: '#ffc107', borderColor: '#ffc10744' }}>
                    📅 New Weekly Best!
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={styles.statsCard}>
              <div style={styles.statsTitle}>// session_stats</div>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <span style={styles.statKey}>problems_solved</span>
                  <span style={styles.statVal}>{score}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statKey}>wrong_answers</span>
                  <span style={{ ...styles.statVal, color: wrongCount > 0 ? '#ff4444' : '#00ff87' }}>{wrongCount}/3</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statKey}>time_taken</span>
                  <span style={styles.statVal}>{formatTime(timeTaken)}</span>
                </div>
              </div>
            </div>

            {/* Personal bests */}
            <div style={styles.bestsCard}>
              <div style={styles.statsTitle}>// personal_bests</div>
              <div style={styles.bestsGrid}>
                <div style={styles.bestItem}>
                  <div style={styles.bestLabel}>All-Time Best</div>
                  <div style={styles.bestScore}>{allTimeBest?.score ?? 0}</div>
                  <div style={styles.bestSub}>solved</div>
                </div>
                <div style={styles.bestDivider} />
                <div style={styles.bestItem}>
                  <div style={styles.bestLabel}>This Week</div>
                  <div style={{ ...styles.bestScore, color: '#ffc107' }}>{weeklyBest?.score ?? 0}</div>
                  <div style={styles.bestSub}>solved</div>
                </div>
              </div>
            </div>

            {/* Review — wrong answers with correct option + explanation */}
            {review && review.length > 0 && (
              <div style={styles.reviewCard}>
                <div style={styles.statsTitle}>// review — {review.length} missed question{review.length !== 1 ? 's' : ''}</div>
                <div style={styles.reviewList}>
                  {review.map((r, i) => (
                    <div key={i} style={styles.reviewItem}>
                      <div style={styles.reviewQuestion}>{r.question}</div>
                      <div style={styles.reviewOptions}>
                        {r.options.map((opt, j) => (
                          <div key={j} style={{
                            ...styles.reviewOption,
                            ...(j === r.correctIndex ? styles.reviewOptionCorrect : {}),
                            ...(j === r.selectedIndex && j !== r.correctIndex ? styles.reviewOptionWrong : {}),
                          }}>
                            {String.fromCharCode(65 + j)}. {opt}
                            {j === r.correctIndex && '  ✓'}
                            {j === r.selectedIndex && j !== r.correctIndex && '  ✗ your answer'}
                          </div>
                        ))}
                      </div>
                      <div style={styles.reviewExplanation}>{r.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={styles.actions}>
              <button
                onClick={() => navigate('/battle')}
                style={styles.playAgainBtn}
              >
                🎯 Play Again
              </button>
              <button
                onClick={() => navigate('/')}
                style={styles.homeBtn}
              >
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
  tabActive: { background: '#111', color: '#f0f0f0' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' },
  scoreBanner: { background: '#111', border: '1px solid #00ff8733', borderRadius: '8px', padding: '2rem 3rem', textAlign: 'center', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  scoreNum: { color: '#00ff87', fontSize: '4rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 },
  scoreLabel: { color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' },
  badges: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  badge: { background: '#00ff8722', color: '#00ff87', border: '1px solid #00ff8744', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 },
  statsCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.25rem', minWidth: '300px' },
  statsTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '0.75rem' },
  statsGrid: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  statItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '0.875rem' },
  statKey: { color: '#888' },
  statVal: { color: '#f0f0f0', fontWeight: 600 },
  bestsCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.25rem', minWidth: '300px' },
  bestsGrid: { display: 'flex', alignItems: 'center', gap: '2rem' },
  bestItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  bestLabel: { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  bestScore: { color: '#00ff87', fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace' },
  bestSub: { color: '#888', fontSize: '0.72rem' },
  bestDivider: { width: '1px', height: '50px', background: '#1a1a1a' },
  actions: { display: 'flex', gap: '1rem' },
  playAgainBtn: { padding: '0.7rem 1.5rem', background: '#00ff87', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.9rem' },
  homeBtn: { padding: '0.7rem 1.5rem', background: 'transparent', color: '#555', border: '1px solid #2a2a2a', borderRadius: '6px', fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.9rem' },
  reviewCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem', minWidth: '300px', maxWidth: '600px', width: '100%' },
  reviewList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  reviewItem: { borderBottom: '1px solid #1a1a1a', paddingBottom: '1.25rem' },
  reviewQuestion: { color: '#f0f0f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.5 },
  reviewOptions: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' },
  reviewOption: { color: '#666', fontSize: '0.85rem', fontFamily: 'monospace', padding: '0.35rem 0.6rem', borderRadius: '4px' },
  reviewOptionCorrect: { color: '#00ff87', background: '#00ff8711' },
  reviewOptionWrong: { color: '#ff4444', background: '#ff444411' },
  reviewExplanation: { color: '#888', fontSize: '0.82rem', lineHeight: 1.6, fontStyle: 'italic' },
}

export default SoloResult