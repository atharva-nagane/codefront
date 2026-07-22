// E:\online-judge\frontend\src\features\contests\pages\ContestDetail.jsx
// Full updated file:

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Editor from '@monaco-editor/react'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import {
  getContest, registerForContest, unregisterFromContest,
  submitToContest, getContestSubmission,
  getContestLeaderboard, getMyContestSubmissions,
} from '../contestsApi'
import { SkeletonCard } from '../../../shared/components/Skeleton'

const defaultCode = {
  python: `# your solution here\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    // your solution here\n    return 0;\n}`,
  java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // your solution here\n    }\n}`,
}

const verdictColor = {
  'Accepted': '#00ff87',
  'Wrong Answer': '#ff4444',
  'Time Limit Exceeded': '#ffc107',
  'Memory Limit Exceeded': '#ffc107',
  'Runtime Error': '#ff4444',
  'Compile Error': '#ff4444',
  'Pending': '#ffc107',
}

const difficultyColor = { Easy: '#00ff87', Medium: '#ffc107', Hard: '#ff4444' }

const ContestDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)

  const [contest, setContest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('problems')
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCode['python'])
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardFrozen, setLeaderboardFrozen] = useState(false)
  const [mySubmissions, setMySubmissions] = useState([])
  const [registering, setRegistering] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [timeLeftSecs, setTimeLeftSecs] = useState(null)
  const [pulseIndex, setPulseIndex] = useState(0)

  const fetchContest = useCallback(async () => {
    try {
      const data = await getContest(id)
      setContest(data)
      if (data.status === 'active' && data.problems?.length > 0 && !selectedProblem) {
        setSelectedProblem(data.problems[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchContest() }, [fetchContest])

  // countdown timer
  useEffect(() => {
    if (!contest) return
    const interval = setInterval(() => {
      const now = new Date()
      const target = contest.status === 'upcoming'
        ? new Date(contest.startTime)
        : new Date(contest.endTime)
      const diff = target - now
      setTimeLeftSecs(Math.max(0, Math.floor(diff / 1000)))
      if (diff <= 0) {
        setTimeLeft(contest.status === 'upcoming' ? 'Starting...' : 'Ended')
        clearInterval(interval)
        if (contest.status === 'upcoming') fetchContest()
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [contest])

  // pulse animation for locked problems
  useEffect(() => {
    if (contest?.status !== 'upcoming') return
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % (contest?.problems?.length || 1))
    }, 800)
    return () => clearInterval(interval)
  }, [contest])

  const handleRegister = async () => {
    setRegistering(true)
    try {
      await registerForContest(id)
      await fetchContest()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    setRegistering(true)
    try {
      await unregisterFromContest(id)
      await fetchContest()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unregister')
    } finally {
      setRegistering(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProblem) return
    setSubmitting(true)
    setVerdict(null)
    try {
      const res = await submitToContest(id, { problemId: selectedProblem._id, code, language })
      const interval = setInterval(async () => {
        try {
          const sub = await getContestSubmission(id, res.submissionId)
          if (sub.verdict !== 'Pending') {
            clearInterval(interval)
            setVerdict(sub)
            setSubmitting(false)
          }
        } catch {
          clearInterval(interval)
          setSubmitting(false)
        }
      }, 2000)
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const data = await getContestLeaderboard(id)
      setLeaderboard(data.leaderboard)
      setLeaderboardFrozen(data.isFrozen)
    } catch (err) { console.error(err) }
  }

  const loadMySubmissions = async () => {
    try {
      const data = await getMyContestSubmissions(id)
      setMySubmissions(data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (activeTab === 'leaderboard') loadLeaderboard()
    if (activeTab === 'submissions') loadMySubmissions()
  }, [activeTab])

  if (loading) return (
    <IDELayout><Navbar />
      <div style={{ flex: 1, padding: '2rem', background: '#0a0a0a' }}><SkeletonCard /></div>
    </IDELayout>
  )

  if (!contest) return (
    <IDELayout><Navbar />
      <div style={{ flex: 1, padding: '2rem', background: '#0a0a0a', color: '#ff4444', fontFamily: 'monospace' }}>
        // contest not found
      </div>
    </IDELayout>
  )

  const canSubmit = contest.status === 'active' && contest.isRegistered
  const statusColor = { upcoming: '#ffc107', active: '#00ff87', ended: '#444' }

  const statusItems = [
    { position: 'left', label: contest.name, icon: '◉' },
    { position: 'left', label: contest.status, color: statusColor[contest.status] },
    { position: 'right', label: timeLeft, color: contest.status === 'active' ? '#00ff87' : contest.status === 'upcoming' ? '#ffc107' : '#444' },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>

          {/* Tab bar */}
          <div style={styles.tabBar}>
            {['problems', 'leaderboard', 'submissions'].map(tab => (
              <div key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}>
                {tab === 'problems' ? '◇' : tab === 'leaderboard' ? '◈' : '○'} {tab}
              </div>
            ))}
            <div style={styles.tabSpacer} />
            {contest.status === 'upcoming' && (
              contest.isRegistered ? (
                <button onClick={handleUnregister} disabled={registering} style={styles.unregBtn}>
                  {registering ? '...' : '✓ Registered — Cancel'}
                </button>
              ) : (
                <button onClick={handleRegister} disabled={registering} style={styles.regBtn}>
                  {registering ? '...' : '+ Register'}
                </button>
              )
            )}
            {contest.status === 'active' && !contest.isRegistered && (
              <span style={styles.notRegistered}>Not registered</span>
            )}
          </div>

          {/* ── PROBLEMS TAB ── */}
          {activeTab === 'problems' && (

            // ── UPCOMING — locked view ──
            contest.status === 'upcoming' ? (
              <div style={styles.lockedLayout}>

                {/* Left — countdown + problem list (blurred) */}
                <div style={styles.lockedLeft}>

                  {/* Countdown */}
                  <div style={styles.countdownCard}>
                    <div style={styles.countdownLabel}>// contest_starts_in</div>
                    <div style={styles.countdownTimer}>{timeLeft}</div>
                    <div style={styles.countdownSub}>
                      {new Date(contest.startTime).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    {contest.isRegistered ? (
                      <div style={styles.registeredTag}>✓ You are registered</div>
                    ) : (
                      <div style={styles.notRegisteredTag}>Register to participate</div>
                    )}
                  </div>

                  {/* Locked problem list */}
                  <div style={styles.lockedProblemsCard}>
                    <div style={styles.lockedProblemsTitle}>
                      // {contest.problems.length} problems — access unlocks at start
                    </div>
                    {contest.problems.map((p, i) => (
                      <div key={p._id} style={styles.lockedProblemRow}>
                        {/* Difficulty LED */}
                        <div style={{
                          ...styles.led,
                          background: difficultyColor[p.difficulty],
                          boxShadow: pulseIndex === i
                            ? `0 0 8px ${difficultyColor[p.difficulty]}, 0 0 16px ${difficultyColor[p.difficulty]}44`
                            : 'none',
                          opacity: pulseIndex === i ? 1 : 0.3,
                          transition: 'all 0.4s ease',
                        }} />

                        {/* Problem index */}
                        <span style={styles.lockedProblemIdx}>
                          {String.fromCharCode(65 + i)}
                        </span>

                        {/* Blurred name */}
                        <span style={styles.lockedProblemName}>
                          {'█'.repeat(Math.floor(Math.random() * 8) + 6)}
                        </span>

                        {/* Difficulty badge */}
                        <span style={{
                          ...styles.diffBadge,
                          color: difficultyColor[p.difficulty],
                          border: `1px solid ${difficultyColor[p.difficulty]}33`,
                          background: difficultyColor[p.difficulty] + '11',
                        }}>
                          {p.difficulty}
                        </span>

                        {/* Lock icon */}
                        <span style={styles.lockIcon}>🔒</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — registered participants */}
                <div style={styles.lockedRight}>
                  <div style={styles.participantsCard}>
                    <div style={styles.participantsTitle}>
                      // registered_participants ({contest.registeredCount})
                    </div>
                    {contest.registeredUsers?.length === 0 ? (
                      <p style={styles.noParticipants}>// be the first to register</p>
                    ) : (
                      <div style={styles.participantsList}>
                        {contest.registeredUsers?.slice(0, 20).map((u, i) => (
                          <div key={i} style={styles.participantRow}>
                            <div style={styles.participantAvatar}>
                              {(u.username || u.toString()).charAt(0).toUpperCase()}
                            </div>
                            <span style={styles.participantName}>
                              @{u.username || `user_${i + 1}`}
                            </span>
                            {u._id?.toString() === user?._id?.toString() && (
                              <span style={styles.youBadge}>you</span>
                            )}
                          </div>
                        ))}
                        {contest.registeredCount > 20 && (
                          <div style={styles.moreParticipants}>
                            +{contest.registeredCount - 20} more registered
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contest info card */}
                  <div style={styles.infoCard}>
                    <div style={styles.infoTitle}>// contest_info</div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>duration</span>
                      <span style={styles.infoVal}>
                        {Math.round((new Date(contest.endTime) - new Date(contest.startTime)) / 3600000)}h
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>problems</span>
                      <span style={styles.infoVal}>{contest.problems.length}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>freeze</span>
                      <span style={styles.infoVal}>{contest.freezeLeaderboard ? '1hr before end' : 'no freeze'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoKey}>registered</span>
                      <span style={styles.infoVal}>{contest.registeredCount}</span>
                    </div>
                  </div>
                </div>
              </div>

            // ── ENDED — read only view ──
            ) : contest.status === 'ended' ? (
              <div style={styles.endedLayout}>
                <div style={styles.endedBanner}>
                  <span style={styles.endedIcon}>🏁</span>
                  <div>
                    <div style={styles.endedTitle}>Contest Ended</div>
                    <div style={styles.endedSub}>Check the leaderboard for final standings</div>
                  </div>
                  <button onClick={() => setActiveTab('leaderboard')} style={styles.viewResultsBtn}>
                    View Results →
                  </button>
                </div>
                <div style={styles.splitView}>
                  <div style={styles.problemList}>
                    <div style={styles.listHeader}>
                      <span style={styles.listTitle}>// problems</span>
                    </div>
                    {contest.problems.map((p, i) => (
                      <div key={p._id} style={{
                        ...styles.problemItem,
                        background: selectedProblem?._id === p._id ? '#1a1a1a' : 'transparent',
                        borderLeft: selectedProblem?._id === p._id ? '2px solid #444' : '2px solid transparent',
                      }} onClick={() => setSelectedProblem(p)}>
                        <span style={styles.problemIdx}>{String.fromCharCode(65 + i)}</span>
                        <span style={styles.problemName}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                  {selectedProblem && (
                    <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#111' }}>
                      <h2 style={{ color: '#f0f0f0', margin: '0 0 1rem', fontSize: '1.2rem' }}>{selectedProblem.name}</h2>
                      <p style={{ color: '#888', lineHeight: 1.8, fontSize: '0.9rem' }}>{selectedProblem.statement}</p>
                    </div>
                  )}
                </div>
              </div>

            // ── ACTIVE — full editor ──
            ) : (
              <div style={styles.splitView}>
                <div style={styles.problemList}>
                  <div style={styles.listHeader}>
                    <span style={styles.listTitle}>// problems</span>
                  </div>
                  {contest.problems.map((p, i) => (
                    <div key={p._id} style={{
                      ...styles.problemItem,
                      background: selectedProblem?._id === p._id ? '#1a1a1a' : 'transparent',
                      borderLeft: selectedProblem?._id === p._id ? '2px solid #00ff87' : '2px solid transparent',
                    }} onClick={() => { setSelectedProblem(p); setVerdict(null); setCode(defaultCode[language]) }}>
                      <span style={styles.problemIdx}>{String.fromCharCode(65 + i)}</span>
                      <span style={styles.problemName}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: difficultyColor[p.difficulty] }}>
                        {p.difficulty}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedProblem && (
                  <>
                    <div style={styles.problemDetail}>
                      <div style={styles.detailHeader}>
                        <h2 style={styles.detailTitle}>{selectedProblem.name}</h2>
                      </div>
                      <div style={styles.detailContent}>
                        <p style={styles.statement}>{selectedProblem.statement}</p>
                        <div style={styles.limits}>
                          <span style={styles.limit}>⏱ {selectedProblem.timeLimit}ms</span>
                          <span style={styles.limit}>💾 {selectedProblem.memoryLimit}MB</span>
                        </div>
                        {verdict && (
                          <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem',
                            borderRadius: '6px', border: '1px solid',
                            borderColor: verdictColor[verdict.verdict] + '44',
                            background: verdictColor[verdict.verdict] + '11',
                            color: verdictColor[verdict.verdict],
                            fontFamily: 'monospace', fontSize: '0.875rem',
                          }}>
                            {verdict.verdict === 'Accepted' ? '✓' : '✗'} {verdict.verdict}
                            {verdict.executionTime > 0 && ` — ${verdict.executionTime}ms`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={styles.editorPanel}>
                      <div style={styles.editorTabBar}>
                        <div style={{ ...styles.tab, ...styles.tabActive }}>
                          solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'py'}
                        </div>
                        <div style={styles.tabSpacer} />
                        <select value={language}
                          onChange={e => { setLanguage(e.target.value); setCode(defaultCode[e.target.value]) }}
                          style={styles.langSelect}>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                        </select>
                      </div>
                      <div style={styles.editorWrapper}>
                        <Editor height="100%" language={language} value={code}
                          onChange={val => setCode(val)} theme="vs-dark"
                          options={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 } }} />
                      </div>
                      <div style={styles.actionBar}>
                        {!canSubmit && <span style={styles.cantSubmit}>Register to submit</span>}
                        <div style={{ flex: 1 }} />
                        <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
                          ...styles.submitBtn,
                          background: !canSubmit || submitting ? '#1a1a1a' : '#00ff87',
                          color: !canSubmit || submitting ? '#333' : '#0a0a0a',
                          cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
                        }}>
                          {submitting ? '◌ Running...' : '▶ Submit'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* Leaderboard tab */}
          {activeTab === 'leaderboard' && (
            <div style={styles.tabContent}>
              {leaderboardFrozen && (
                <div style={styles.frozenBanner}>
                  🧊 Leaderboard frozen — last hour of contest. Final standings revealed after end.
                </div>
              )}
              {leaderboard.length === 0 ? (
                <p style={styles.empty}>// no accepted submissions yet</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>rank</th>
                        <th style={styles.th}>username</th>
                        <th style={styles.th}>solved</th>
                        <th style={styles.th}>last accepted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, i) => (
                        <tr key={entry.userId} style={styles.row}>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: i === 0 ? '#ffc107' : i === 1 ? '#888' : i === 2 ? '#cd7f32' : '#888' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </td>
                          <td style={{ ...styles.td, color: '#f0f0f0', fontFamily: 'monospace' }}>@{entry.username}</td>
                          <td style={{ ...styles.td, color: '#00ff87', fontFamily: 'monospace', fontWeight: 700 }}>{entry.solvedCount}</td>
                          <td style={{ ...styles.td, color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {entry.lastAcceptedAt ? new Date(entry.lastAcceptedAt).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* My submissions tab */}
          {activeTab === 'submissions' && (
            <div style={styles.tabContent}>
              {mySubmissions.length === 0 ? (
                <p style={styles.empty}>// no submissions yet</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>problem</th>
                        <th style={styles.th}>language</th>
                        <th style={styles.th}>verdict</th>
                        <th style={styles.th}>time</th>
                        <th style={styles.th}>submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map(s => (
                        <tr key={s._id} style={styles.row}>
                          <td style={{ ...styles.td, color: '#f0f0f0', fontFamily: 'monospace' }}>{s.problem.name}</td>
                          <td style={{ ...styles.td, color: '#555', fontFamily: 'monospace' }}>{s.language}</td>
                          <td style={styles.td}>
                            <span style={{ color: verdictColor[s.verdict] || '#555', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem' }}>
                              {s.verdict === 'Accepted' ? '✓' : s.verdict === 'Pending' ? '◌' : '✗'} {s.verdict}
                            </span>
                          </td>
                          <td style={{ ...styles.td, color: '#888', fontFamily: 'monospace' }}>{s.executionTime}ms</td>
                          <td style={{ ...styles.td, color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {new Date(s.submittedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', borderTop: '1px solid transparent', whiteSpace: 'nowrap' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  regBtn: { background: '#00ff87', color: '#0a0a0a', border: 'none', padding: '0 1rem', height: '36px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', borderLeft: '1px solid #1a1a1a' },
  unregBtn: { background: 'transparent', color: '#00ff87', border: 'none', padding: '0 1rem', height: '36px', fontFamily: 'monospace', fontSize: '0.78rem', cursor: 'pointer', borderLeft: '1px solid #1a1a1a' },
  notRegistered: { color: '#888', fontSize: '0.78rem', fontFamily: 'monospace', padding: '0 1rem', borderLeft: '1px solid #1a1a1a' },

  // locked layout
  lockedLayout: { display: 'flex', flex: 1, overflow: 'hidden', background: '#0a0a0a' },
  lockedLeft: { flex: 1.2, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  lockedRight: { width: '300px', borderLeft: '1px solid #1a1a1a', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0a0a0a' },
  countdownCard: { background: '#111', border: '1px solid #ffc10733', borderRadius: '8px', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  countdownLabel: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem' },
  countdownTimer: { color: '#ffc107', fontFamily: 'monospace', fontSize: '3rem', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1 },
  countdownSub: { color: '#888', fontFamily: 'monospace', fontSize: '0.78rem' },
  registeredTag: { background: '#00ff8711', border: '1px solid #00ff8733', color: '#00ff87', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.78rem', fontFamily: 'monospace' },
  notRegisteredTag: { background: '#ffc10711', border: '1px solid #ffc10733', color: '#ffc107', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.78rem', fontFamily: 'monospace' },
  lockedProblemsCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.25rem' },
  lockedProblemsTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '1rem' },
  lockedProblemRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid #1a1a1a' },
  led: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  lockedProblemIdx: { color: '#444', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', width: '20px', flexShrink: 0 },
  lockedProblemName: { color: '#1a1a1a', fontFamily: 'monospace', fontSize: '0.85rem', flex: 1, letterSpacing: '0.1em' },
  diffBadge: { fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '3px', fontFamily: 'monospace', flexShrink: 0 },
  lockIcon: { fontSize: '0.75rem', flexShrink: 0 },
  participantsCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.25rem', flex: 1 },
  participantsTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '1rem' },
  noParticipants: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.8rem', margin: 0 },
  participantsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  participantRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  participantAvatar: { width: '24px', height: '24px', background: '#00ff8722', border: '1px solid #00ff8744', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#00ff87', flexShrink: 0 },
  participantName: { color: '#555', fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 },
  youBadge: { background: '#00ff8722', color: '#00ff87', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '3px', fontFamily: 'monospace', border: '1px solid #00ff8744' },
  moreParticipants: { color: '#888', fontFamily: 'monospace', fontSize: '0.75rem', paddingTop: '0.5rem' },
  infoCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.25rem' },
  infoTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '0.75rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '0.5rem' },
  infoKey: { color: '#888' },
  infoVal: { color: '#666' },

  // ended layout
  endedLayout: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  endedBanner: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', background: '#111', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  endedIcon: { fontSize: '1.5rem' },
  endedTitle: { color: '#f0f0f0', fontWeight: 700, fontSize: '0.95rem' },
  endedSub: { color: '#888', fontSize: '0.8rem', fontFamily: 'monospace' },
  viewResultsBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid #2a2a2a', color: '#888', padding: '0.4rem 0.85rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },

  // active split view
  splitView: { display: 'flex', flex: 1, overflow: 'hidden' },
  problemList: { width: '200px', background: '#111', borderRight: '1px solid #1a1a1a', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column' },
  listHeader: { padding: '0.6rem 1rem', borderBottom: '1px solid #1a1a1a' },
  listTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.72rem' },
  problemItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1rem', cursor: 'pointer', transition: 'background 0.1s' },
  problemIdx: { color: '#00ff87', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 },
  problemName: { color: '#888', fontSize: '0.8rem', fontFamily: 'monospace', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  problemDetail: { width: '35%', background: '#111', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  detailHeader: { padding: '0.75rem 1.25rem', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' },
  detailTitle: { color: '#f0f0f0', fontSize: '0.95rem', fontWeight: 700, margin: 0 },
  detailContent: { flex: 1, overflowY: 'auto', padding: '1.25rem' },
  statement: { color: '#888', lineHeight: 1.8, fontSize: '0.875rem', margin: '0 0 1rem' },
  limits: { display: 'flex', gap: '1rem' },
  limit: { color: '#888', fontSize: '0.78rem', fontFamily: 'monospace' },
  editorPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  editorTabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  langSelect: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 0.75rem', height: '36px', outline: 'none' },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  actionBar: { height: '44px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem', flexShrink: 0 },
  cantSubmit: { color: '#888', fontSize: '0.78rem', fontFamily: 'monospace' },
  submitBtn: { padding: '0.45rem 1.25rem', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' },
  tabContent: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a' },
  frozenBanner: { background: '#1a2a3a', border: '1px solid #2a4a6a', color: '#6ab3e8', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem', fontFamily: 'monospace' },
  tableWrapper: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem 1.25rem', color: '#333', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a1a', fontFamily: 'monospace' },
  row: { borderBottom: '1px solid #1a1a1a' },
  td: { padding: '0.9rem 1.25rem', fontSize: '0.875rem', color: '#888' },
  empty: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.875rem' },
}

export default ContestDetail