import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import IDELayout from '../../../shared/components/IDELayout'
import { getBattleSocket } from '../battleSocket'

const difficultyColor = { Easy: '#00ff87', Medium: '#ffc107', Hard: '#ff4444' }

const BattleArena = () => {
  const { battleId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [questions, setQuestions] = useState(data?.questions || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [mode] = useState(data?.mode || '10min')
  const [timeLeft, setTimeLeft] = useState(null)
  const [myScore, setMyScore] = useState(0)
  const [myWrongs, setMyWrongs] = useState(0)
  const [myLocked, setMyLocked] = useState(false)
  const [opponentScore, setOpponentScore] = useState(0)
  const [opponentWrongs, setOpponentWrongs] = useState(0)
  const [opponentLocked, setOpponentLocked] = useState(false)
  const [opponentName, setOpponentName] = useState(data?.opponent?.username || '...')
  const [lastResult, setLastResult] = useState(null)
  const [suddenDeath, setSuddenDeath] = useState(false)
  const timerRef = useRef(null)

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    const socket = getBattleSocket()
    if (!socket || !data) {
      navigate('/battle')
      return
    }

    setOpponentName(data.opponent?.username)

    // start timer
    if (data.timeLimit) {
      let remaining = Math.floor(data.timeLimit / 1000)
      setTimeLeft(remaining)
      timerRef.current = setInterval(() => {
        remaining -= 1
        setTimeLeft(remaining)
        if (remaining <= 0) clearInterval(timerRef.current)
      }, 1000)
    }

    socket.on('battle:submit_result', (result) => {
      setSubmitting(false)
      setLastResult(result)
      setMyScore(result.score)
      setMyWrongs(result.wrongCount)
      setMyLocked(result.locked)

      if (result.verdict !== 'locked') {
        setTimeout(() => {
          setCurrentIndex(result.nextIndex)
          setSelected(null)
          setLastResult(null)
        }, 900)
      }
    })

    socket.on('battle:opponent_update', (update) => {
      setOpponentScore(update.score)
      setOpponentWrongs(update.wrongCount)
      setOpponentLocked(update.locked)
    })

    socket.on('battle:sudden_death', ({ question }) => {
      setSuddenDeath(true)
      setQuestions(prev => [...prev, question])
    })

    socket.on('battle:ended', (result) => {
      if (timerRef.current) clearInterval(timerRef.current)
      navigate(`/battle/${battleId}/result`, { state: result })
    })

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      socket.off('battle:submit_result')
      socket.off('battle:opponent_update')
      socket.off('battle:sudden_death')
      socket.off('battle:ended')
    }
  }, [battleId, navigate, data])

  // select-to-submit — snappier for a speed battle than a separate confirm step
  const handleSelect = (optionIndex) => {
    if (!currentQuestion || myLocked || submitting || lastResult) return
    const socket = getBattleSocket()
    if (!socket) return

    setSelected(optionIndex)
    setSubmitting(true)
    socket.emit('battle:submit', {
      battleId,
      questionId: currentQuestion._id,
      selectedIndex: optionIndex,
    })
  }

  const formatTime = (secs) => {
    if (secs === null) return '∞'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const timeColor = timeLeft !== null && timeLeft < 60 ? '#ff4444' : '#f0f0f0'

  return (
    <IDELayout statusItems={[
      { position: 'left', label: `question ${currentIndex + 1}/${questions.length}`, icon: '◇' },
      { position: 'left', label: `score: ${myScore}`, color: '#00ff87' },
      { position: 'right', label: `${opponentName}: ${opponentScore}`, color: '#a78bfa' },
      { position: 'right', label: formatTime(timeLeft), color: timeColor },
    ]}>
      <Navbar />
      <div style={styles.workspace}>
        <div style={styles.centerPanel}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              {suddenDeath ? '⚡ sudden_death' : `◇ question_${currentIndex + 1}`}
            </div>
            <div style={styles.tabSpacer} />
            {suddenDeath && <span style={styles.sdBadge}>SUDDEN DEATH</span>}
            <span style={{ ...styles.timerTag, color: timeColor }}>{formatTime(timeLeft)}</span>
          </div>

          {/* Opponent status bar */}
          <div style={styles.opponentBar}>
            <div style={styles.opponentLeft}>
              <span style={styles.vsLabel}>vs</span>
              <span style={styles.opponentName}>@{opponentName}</span>
              {opponentLocked && <span style={styles.lockedBadge}>LOCKED</span>}
            </div>
            <div style={styles.opponentRight}>
              <span style={{ color: '#00ff87', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                ✓ {opponentScore}
              </span>
              <span style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.85rem', marginLeft: '1rem' }}>
                ✗ {opponentWrongs}/3
              </span>
            </div>
          </div>

          <div style={styles.panelContent}>
            {myLocked ? (
              <div style={styles.lockedScreen}>
                <div style={styles.lockedIcon}>🔒</div>
                <div style={styles.lockedText}>You've reached 3 wrong answers</div>
                <div style={styles.lockedSub}>Waiting for battle to end...</div>
                <div style={styles.lockedScore}>Your score: {myScore}</div>
              </div>
            ) : currentQuestion ? (
              <div style={styles.questionContent}>
                {suddenDeath && (
                  <div style={styles.sdBanner}>
                    ⚡ SUDDEN DEATH — First to answer correctly wins!
                  </div>
                )}
                <div style={{ ...styles.difficultyTag, color: difficultyColor[currentQuestion.difficulty], borderColor: difficultyColor[currentQuestion.difficulty] + '44' }}>
                  {currentQuestion.difficulty}
                </div>
                <h2 style={styles.questionTitle}>{currentQuestion.question}</h2>

                <div style={styles.options}>
                  {currentQuestion.options.map((opt, i) => {
                    let optionStyle = { ...styles.option }
                    if (lastResult) {
                      if (i === lastResult.correctIndex) {
                        optionStyle = { ...optionStyle, ...styles.optionCorrect }
                      } else if (i === selected) {
                        optionStyle = { ...optionStyle, ...styles.optionWrong }
                      } else {
                        optionStyle = { ...optionStyle, opacity: 0.4 }
                      }
                    } else if (selected === i) {
                      optionStyle = { ...optionStyle, ...styles.optionSelected }
                    }

                    return (
                      <button
                        key={i}
                        style={optionStyle}
                        onClick={() => handleSelect(i)}
                        disabled={submitting || !!lastResult}
                      >
                        <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {lastResult && (
                  <div style={{
                    ...styles.resultBanner,
                    background: lastResult.correct ? '#00ff8711' : '#ff444411',
                    borderColor: lastResult.correct ? '#00ff8744' : '#ff444444',
                    color: lastResult.correct ? '#00ff87' : '#ff4444',
                  }}>
                    {lastResult.correct ? '✓ Correct!' : `✗ Wrong — correct answer was "${currentQuestion.options[lastResult.correctIndex]}"`}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.doneScreen}>
                <div style={styles.doneText}>All questions answered!</div>
                <div style={styles.doneScore}>Final score: {myScore}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
      `}</style>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden', justifyContent: 'center' },
  centerPanel: { width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', borderRight: '1px solid #1a1a1a', whiteSpace: 'nowrap' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  timerTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', padding: '0 1rem' },
  sdBadge: { background: '#ffc10722', color: '#ffc107', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.6rem', borderRadius: '3px', margin: '0 0.5rem', fontFamily: 'monospace', border: '1px solid #ffc10744' },
  opponentBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a' },
  opponentLeft: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  opponentRight: { display: 'flex', alignItems: 'center' },
  vsLabel: { color: '#2a2a2a', fontSize: '0.75rem', fontFamily: 'monospace' },
  opponentName: { color: '#a78bfa', fontSize: '0.85rem', fontFamily: 'monospace' },
  lockedBadge: { background: '#ff444422', color: '#ff4444', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid #ff444444' },
  panelContent: { flex: 1, overflowY: 'auto', background: '#111' },
  questionContent: { padding: '2rem' },
  difficultyTag: { display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', border: '1px solid', borderRadius: '3px', padding: '0.15rem 0.5rem', marginBottom: '1rem', textTransform: 'uppercase' },
  questionTitle: { color: '#f0f0f0', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem', lineHeight: 1.5 },
  options: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  option: { display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#ccc', fontSize: '0.95rem', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.1s' },
  optionSelected: { borderColor: '#00ff87', background: '#00ff8711' },
  optionCorrect: { borderColor: '#00ff87', background: '#00ff8722', color: '#00ff87' },
  optionWrong: { borderColor: '#ff4444', background: '#ff444422', color: '#ff4444' },
  optionLetter: { width: '24px', height: '24px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'monospace', flexShrink: 0 },
  resultBanner: { marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid', fontSize: '0.85rem', fontFamily: 'monospace' },
  lockedScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem' },
  lockedIcon: { fontSize: '3rem' },
  lockedText: { color: '#ff4444', fontSize: '1rem', fontFamily: 'monospace' },
  lockedSub: { color: '#888', fontSize: '0.85rem' },
  lockedScore: { color: '#00ff87', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700 },
  doneScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' },
  doneText: { color: '#00ff87', fontSize: '1.1rem', fontFamily: 'monospace' },
  doneScore: { color: '#f0f0f0', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700 },
  sdBanner: { background: '#ffc10711', border: '1px solid #ffc10744', color: '#ffc107', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, marginBottom: '1rem' },
}

export default BattleArena
