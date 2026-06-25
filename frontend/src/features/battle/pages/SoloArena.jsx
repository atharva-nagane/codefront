import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Navbar from '../../../shared/components/Navbar'
import IDELayout from '../../../shared/components/IDELayout'
import api from '../../../shared/api/axios'

const defaultCode = {
  python: `# your solution here\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    // your solution here\n    return 0;\n}`,
  java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // your solution here\n    }\n}`,
}

const SoloArena = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [problems] = useState(data?.problems || [])
  const [battleId] = useState(data?.battleId)
  const [mode] = useState(data?.mode || '10min')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCode['python'])
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [ended, setEnded] = useState(false)
  const timerRef = useRef(null)

  const currentProblem = problems[currentIndex]

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

  const handleSubmit = async () => {
    if (!currentProblem || locked || submitting || ended) return
    setSubmitting(true)
    setLastResult(null)

    try {
      const res = await api.post(`/solo/${battleId}/submit`, {
        problemId: currentProblem._id,
        code,
        language,
      })

      const result = res.data
      setScore(result.score)
      setWrongCount(result.wrongCount)
      setLastResult(result)

      if (result.locked) {
        setLocked(true)
        await handleEnd()
        return
      }

      setCurrentIndex(prev => prev + 1)
      setCode(defaultCode[language])

      // if all problems done
      if (currentIndex + 1 >= problems.length) {
        await handleEnd()
      }
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
    { position: 'left', label: `problem ${currentIndex + 1}/${problems.length}`, icon: '◇' },
    { position: 'left', label: `score: ${score}`, color: '#00ff87' },
    { position: 'right', label: `${wrongCount}/3 wrong`, color: wrongCount > 0 ? '#ff4444' : '#555' },
    { position: 'right', label: formatTime(timeLeft), color: timeColor },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        {/* Left panel */}
        <div style={styles.leftPanel}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              🎯 solo — {mode}
            </div>
            <div style={styles.tabSpacer} />
            <button
              onClick={handleEnd}
              disabled={ended}
              style={styles.endBtn}
            >
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
            ) : currentProblem ? (
              <div style={styles.problemContent}>
                <h2 style={styles.problemTitle}>{currentProblem.name}</h2>
                <p style={styles.statement}>{currentProblem.statement}</p>

                {lastResult && (
                  <div style={{
                    ...styles.resultBanner,
                    background: lastResult.correct ? '#00ff8711' : '#ff444411',
                    borderColor: lastResult.correct ? '#00ff8744' : '#ff444444',
                    color: lastResult.correct ? '#00ff87' : '#ff4444',
                  }}>
                    {lastResult.correct
                      ? '✓ Correct — next problem'
                      : `✗ ${lastResult.verdict} — skipped (${lastResult.wrongCount}/3 wrong)`
                    }
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.doneScreen}>
                <div style={styles.doneText}>All problems done!</div>
                <div style={styles.doneScore}>Final score: {score}</div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.resizeHandle} />

        {/* Right panel — editor */}
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
              <span style={{ color: '#00ff87', fontFamily: 'monospace', fontSize: '0.8rem' }}>✓ {score}</span>
              <span style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.8rem', marginLeft: '0.75rem' }}>✗ {wrongCount}/3</span>
            </div>
            <div style={styles.timer}>
              <span style={{ color: timeColor, fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || locked || !currentProblem || ended}
              style={{
                ...styles.submitBtn,
                background: locked || !currentProblem || ended ? '#1a1a1a' : submitting ? '#1a1a1a' : '#00ff87',
                color: locked || submitting || !currentProblem || ended ? '#333' : '#0a0a0a',
                cursor: locked || submitting || !currentProblem || ended ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '◌ Running...' : locked ? '🔒 Locked' : '▶ Submit'}
            </button>
          </div>
        </div>
      </div>
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
  endBtn: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.78rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 1rem', height: '36px', borderLeft: '1px solid #1a1a1a' },
  langSelect: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 0.75rem', height: '36px', outline: 'none' },
  panelContent: { flex: 1, overflowY: 'auto', background: '#111' },
  problemContent: { padding: '1.5rem' },
  problemTitle: { color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem' },
  statement: { color: '#888', lineHeight: 1.8, fontSize: '0.9rem' },
  resultBanner: { marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid', fontSize: '0.85rem', fontFamily: 'monospace' },
  lockedScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem' },
  lockedIcon: { fontSize: '3rem' },
  lockedText: { color: '#ff4444', fontSize: '1rem', fontFamily: 'monospace' },
  lockedScore: { color: '#00ff87', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700 },
  doneScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' },
  doneText: { color: '#00ff87', fontSize: '1.1rem', fontFamily: 'monospace' },
  doneScore: { color: '#f0f0f0', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700 },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  actionBar: { height: '44px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem', flexShrink: 0 },
  myStats: { display: 'flex', alignItems: 'center' },
  timer: { flex: 1, display: 'flex', justifyContent: 'center' },
  submitBtn: { padding: '0.45rem 1.25rem', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' },
}

export default SoloArena