import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import IDELayout from '../../../shared/components/IDELayout'
import api from '../../../shared/api/axios'

const difficultyColor = { Easy: '#00ff87', Medium: '#ffc107', Hard: '#ff4444' }

const SoloArena = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [questions] = useState(data?.questions || [])
  const [battleId] = useState(data?.battleId)
  const [mode] = useState(data?.mode || '10min')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [ended, setEnded] = useState(false)
  const timerRef = useRef(null)

  const currentQuestion = questions[currentIndex]

  const getModeSeconds = (m) => {
    const map = { '5min': 300, '10min': 600, '30min': 1800, 'survival': null }
    return map[m]
  }

  useEffect(() => {
    if (!data) { navigate('/battle'); return }

    const secs = getModeSeconds(mode)
    if (secs) {
      setTimeLeft(secs)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const handleEnd = async () => {
    if (ended) return
    setEnded(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const res = await api.post(`/solo/${battleId}/end`)
      navigate('/battle/solo/result', { state: res.data.result })
    } catch (err) {
      console.error(err)
      navigate('/battle')
    }
  }

  const handleSelect = async (optionIndex) => {
    if (!currentQuestion || locked || submitting || ended || lastResult) return
    setSelected(optionIndex)
    setSubmitting(true)

    try {
      const res = await api.post(`/solo/${battleId}/submit`, {
        questionId: currentQuestion._id,
        selectedIndex: optionIndex,
      })

      const result = res.data
      setScore(result.score)
      setWrongCount(result.wrongCount)
      setLastResult(result)

      if (result.locked) {
        setLocked(true)
        setTimeout(() => handleEnd(), 900)
        return
      }

      setTimeout(async () => {
        setCurrentIndex(prev => prev + 1)
        setSelected(null)
        setLastResult(null)

        if (currentIndex + 1 >= questions.length) {
          await handleEnd()
        }
      }, 900)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (secs) => {
    if (secs === null) return '∞'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const timeColor = timeLeft !== null && timeLeft < 60 ? '#ff4444' : '#f0f0f0'

  const statusItems = [
    { position: 'left', label: `question ${currentIndex + 1}/${questions.length}`, icon: '◇' },
    { position: 'left', label: `score: ${score}`, color: '#00ff87' },
    { position: 'right', label: `${wrongCount}/3 wrong`, color: wrongCount > 0 ? '#ff4444' : '#555' },
    { position: 'right', label: formatTime(timeLeft), color: timeColor },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <div style={styles.centerPanel}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              🎯 solo — {mode}
            </div>
            <div style={styles.tabSpacer} />
            <button onClick={handleEnd} disabled={ended} style={styles.endBtn}>
              End Battle
            </button>
          </div>

          <div style={styles.panelContent}>
            {locked ? (
              <div style={styles.lockedScreen}>
                <div style={styles.lockedIcon}>🔒</div>
                <div style={styles.lockedText}>3 wrong answers — battle ending...</div>
                <div style={styles.lockedScore}>Score: {score}</div>
              </div>
            ) : currentQuestion ? (
              <div style={styles.questionContent}>
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
                        disabled={submitting || !!lastResult || ended}
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
                <div style={styles.doneText}>All questions done!</div>
                <div style={styles.doneScore}>Final score: {score}</div>
              </div>
            )}
          </div>
        </div>
      </div>
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
  endBtn: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.78rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 1rem', height: '36px', borderLeft: '1px solid #1a1a1a' },
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
  lockedScore: { color: '#00ff87', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700 },
  doneScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' },
  doneText: { color: '#00ff87', fontSize: '1.1rem', fontFamily: 'monospace' },
  doneScore: { color: '#f0f0f0', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700 },
}

export default SoloArena
