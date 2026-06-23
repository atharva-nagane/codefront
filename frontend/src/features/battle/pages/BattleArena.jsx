import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Navbar from '../../../shared/components/Navbar'
import IDELayout from '../../../shared/components/IDELayout'
import { getBattleSocket } from '../battleSocket'

const defaultCode = {
  python: `# your solution here\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    // your solution here\n    return 0;\n}`,
  java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // your solution here\n    }\n}`,
}

const BattleArena = () => {
  const { battleId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [problems, setProblems] = useState(data?.problems || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCode['python'])
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState(data?.mode || '10min')
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

  const currentProblem = problems[currentIndex]

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

      if (result.correct || result.verdict !== 'locked') {
        setCurrentIndex(result.nextIndex)
        setCode(defaultCode[language])
      }
    })

    socket.on('battle:opponent_update', (update) => {
      setOpponentScore(update.score)
      setOpponentWrongs(update.wrongCount)
      setOpponentLocked(update.locked)
    })

    socket.on('battle:sudden_death', ({ problem }) => {
      setSuddenDeath(true)
      setProblems(prev => [...prev, problem])
      setCurrentIndex(prev => prev)
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

  const handleSubmit = () => {
    if (!currentProblem || myLocked || submitting) return
    const socket = getBattleSocket()
    if (!socket) return

    setSubmitting(true)
    setLastResult(null)
    socket.emit('battle:submit', {
      battleId,
      problemId: currentProblem._id,
      code,
      language,
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
      { position: 'left', label: `problem ${currentIndex + 1}/${problems.length}`, icon: '◇' },
      { position: 'left', label: `score: ${myScore}`, color: '#00ff87' },
      { position: 'right', label: `${opponentName}: ${opponentScore}`, color: '#a78bfa' },
      { position: 'right', label: formatTime(timeLeft), color: timeColor },
    ]}>
      <Navbar />
      <div style={styles.workspace}>

        {/* Left — problem */}
        <div style={styles.leftPanel}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              {suddenDeath ? '⚡ sudden_death' : `◇ problem_${currentIndex + 1}`}
            </div>
            <div style={styles.tabSpacer} />
            {suddenDeath && <span style={styles.sdBadge}>SUDDEN DEATH</span>}
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
            ) : currentProblem ? (
              <div style={styles.problemContent}>
                {suddenDeath && (
                  <div style={styles.sdBanner}>
                    ⚡ SUDDEN DEATH — First to solve wins!
                  </div>
                )}
                <h2 style={styles.problemTitle}>{currentProblem.name}</h2>
                <p style={styles.statement}>{currentProblem.statement}</p>

                {lastResult && (
                  <div style={{
                    ...styles.resultBanner,
                    background: lastResult.correct ? '#00ff8711' : '#ff444411',
                    borderColor: lastResult.correct ? '#00ff8744' : '#ff444444',
                    color: lastResult.correct ? '#00ff87' : '#ff4444',
                  }}>
                    {lastResult.correct ? '✓ Correct — next problem loaded' : `✗ ${lastResult.verdict} — skipped (${myWrongs}/3 wrong)`}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.doneScreen}>
                <div style={styles.doneText}>All problems solved!</div>
                <div style={styles.doneScore}>Final score: {myScore}</div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.resizeHandle} />

        {/* Right — editor */}
        <div style={styles.rightPanel}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              ⚡ solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'py'}
            </div>
            <div style={styles.tabSpacer} />
            <select
              value={language}
              onChange={e => { setLanguage(e.target.value); setCode(defaultCode[e.target.value]) }}
              style={styles.langSelect}
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div style={styles.editorWrapper}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={val => setCode(val)}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          <div style={styles.actionBar}>
            <div style={styles.myStats}>
              <span style={{ color: '#00ff87', fontFamily: 'monospace', fontSize: '0.8rem' }}>✓ {myScore}</span>
              <span style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.8rem', marginLeft: '0.75rem' }}>✗ {myWrongs}/3</span>
            </div>
            <div style={styles.timer}>
              <span style={{ color: timeColor, fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || myLocked || !currentProblem}
              style={{
                ...styles.submitBtn,
                background: myLocked ? '#1a1a1a' : submitting ? '#1a1a1a' : '#00ff87',
                color: myLocked || submitting ? '#333' : '#0a0a0a',
                cursor: myLocked || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '◌ Running...' : myLocked ? '🔒 Locked' : '▶ Submit'}
            </button>
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
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  leftPanel: { width: '45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a1a', overflow: 'hidden' },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  resizeHandle: { width: '4px', background: '#1a1a1a', flexShrink: 0 },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', borderRight: '1px solid #1a1a1a', whiteSpace: 'nowrap' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  sdBadge: { background: '#ffc10722', color: '#ffc107', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.6rem', borderRadius: '3px', margin: '0 0.5rem', fontFamily: 'monospace', border: '1px solid #ffc10744' },
  opponentBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a' },
  opponentLeft: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  opponentRight: { display: 'flex', alignItems: 'center' },
  vsLabel: { color: '#2a2a2a', fontSize: '0.75rem', fontFamily: 'monospace' },
  opponentName: { color: '#a78bfa', fontSize: '0.85rem', fontFamily: 'monospace' },
  lockedBadge: { background: '#ff444422', color: '#ff4444', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid #ff444444' },
  panelContent: { flex: 1, overflowY: 'auto', background: '#111' },
  problemContent: { padding: '1.5rem' },
  problemTitle: { color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem' },
  statement: { color: '#888', lineHeight: 1.8, fontSize: '0.9rem' },
  resultBanner: { marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid', fontSize: '0.85rem', fontFamily: 'monospace' },
  lockedScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem' },
  lockedIcon: { fontSize: '3rem' },
  lockedText: { color: '#ff4444', fontSize: '1rem', fontFamily: 'monospace' },
  lockedSub: { color: '#444', fontSize: '0.85rem' },
  lockedScore: { color: '#00ff87', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700 },
  doneScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' },
  doneText: { color: '#00ff87', fontSize: '1.1rem', fontFamily: 'monospace' },
  doneScore: { color: '#f0f0f0', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700 },
  sdBanner: { background: '#ffc10711', border: '1px solid #ffc10744', color: '#ffc107', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, marginBottom: '1rem' },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  langSelect: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 0.75rem', height: '36px', outline: 'none' },
  actionBar: { height: '44px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem', flexShrink: 0 },
  myStats: { display: 'flex', alignItems: 'center' },
  timer: { flex: 1, display: 'flex', justifyContent: 'center' },
  submitBtn: { padding: '0.45rem 1.25rem', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' },
}

export default BattleArena