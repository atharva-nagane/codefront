import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import AIReviewPanel from '../../../shared/components/AIReviewPanel'
import api from '../../../shared/api/axios'
import { SkeletonCard, SkeletonText } from '../../../shared/components/Skeleton'

const difficultyColor = { Easy: '#00ff87', Medium: '#ffc107', Hard: '#ef4444' }

const defaultCode = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}`,
  python: `# your code here\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}`,
}

const langLabel = { cpp: 'C++', python: 'Python', java: 'Java' }

const ProblemDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [sampleTestCases, setSampleTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCode['python'])
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('problem') // 'problem' | 'result'

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/problems/${slug}`)
        setProblem(res.data.problem)
        setSampleTestCases(res.data.sampleTestCases)
      } catch (err) {
        setError('Problem not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProblem()
  }, [slug])

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value)
    setCode(defaultCode[e.target.value])
  }

  const pollVerdict = async (submissionId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/submissions/${submissionId}`)
        const v = res.data.submission.verdict
        if (v !== 'Pending') {
          clearInterval(interval)
          setVerdict(res.data.submission)
          setSubmitting(false)
          setActiveTab('result')
        }
      } catch (err) {
        clearInterval(interval)
        setSubmitting(false)
      }
    }, 2000)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setVerdict(null)
    setError('')
    try {
      const res = await api.post('/submissions', {
        problemId: problem._id,
        code,
        language,
      })
      await pollVerdict(res.data.submissionId)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  const verdictColor = {
    'Accepted': '#00ff87',
    'Wrong Answer': '#ff4444',
    'Time Limit Exceeded': '#ffc107',
    'Memory Limit Exceeded': '#ffc107',
    'Runtime Error': '#ff4444',
    'Compile Error': '#ff4444',
  }

  const statusItems = problem ? [
    { position: 'left', label: problem.name, icon: '◇' },
    { position: 'left', label: problem.difficulty, color: difficultyColor[problem.difficulty] },
    { position: 'right', label: langLabel[language], icon: '{}' },
    verdict ? { position: 'right', label: verdict.verdict, color: verdictColor[verdict.verdict], icon: verdict.verdict === 'Accepted' ? '✓' : '✗' } : null,
  ].filter(Boolean) : []

  if (loading) return (
    <IDELayout>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.leftPanel}>
          <div style={{ ...styles.tabBar }}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              <Skeleton width="120px" height="0.75rem" />
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <SkeletonCard />
          </div>
        </div>
        <div style={styles.resizeHandle} />
        <div style={styles.rightPanel}>
          <div style={styles.tabBar} />
          <div style={{ flex: 1, background: '#1e1e1e' }} />
          <div style={styles.actionBar} />
        </div>
      </div>
    </IDELayout>
  )

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />

        {/* Left panel — problem statement */}
        <div style={styles.leftPanel}>
          {/* Tab bar */}
          <div style={styles.tabBar}>
            <div
              style={{ ...styles.tab, ...(activeTab === 'problem' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('problem')}
            >
              <span style={styles.tabIcon}>📄</span>
              {problem?.name}.md
            </div>
            {verdict && (
              <div
                style={{ ...styles.tab, ...(activeTab === 'result' ? styles.tabActive : {}), color: verdictColor[verdict.verdict] }}
                onClick={() => setActiveTab('result')}
              >
                <span style={styles.tabIcon}>{verdict.verdict === 'Accepted' ? '✓' : '✗'}</span>
                result.log
              </div>
            )}
            <div style={styles.tabSpacer} />
          </div>

          {/* Panel content */}
          <div style={styles.panelContent}>
            {activeTab === 'problem' && (
              <>
                {/* Breadcrumb */}
                <div style={styles.breadcrumb}>
                  <span style={styles.breadcrumbItem} onClick={() => navigate('/')}>problems</span>
                  <span style={styles.breadcrumbSep}>/</span>
                  <span style={{ ...styles.breadcrumbItem, color: difficultyColor[problem.difficulty] }}>
                    {problem.difficulty.toLowerCase()}
                  </span>
                  <span style={styles.breadcrumbSep}>/</span>
                  <span style={{ ...styles.breadcrumbItem, color: '#f0f0f0' }}>{problem.slug}</span>
                </div>

                <div style={styles.problemContent}>
                  <h2 style={styles.problemTitle}>{problem.name}</h2>
                  <span style={{
                    color: difficultyColor[problem.difficulty],
                    background: difficultyColor[problem.difficulty] + '11',
                    border: `1px solid ${difficultyColor[problem.difficulty]}33`,
                    padding: '0.2rem 0.6rem', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', marginBottom: '1.25rem',
                  }}>
                    {problem.difficulty}
                  </span>

                  <p style={styles.statement}>{problem.statement}</p>

                  {sampleTestCases.length > 0 && (
                    <div style={styles.examples}>
                      <p style={styles.sectionLabel}>// examples</p>
                      {sampleTestCases.map((tc, i) => (
                        <div key={tc._id} style={styles.example}>
                          <div style={styles.exampleBlock}>
                            <span style={styles.exampleLabel}>Input</span>
                            <pre style={styles.exampleCode}>{tc.input}</pre>
                          </div>
                          <div style={styles.exampleArrow}>→</div>
                          <div style={styles.exampleBlock}>
                            <span style={styles.exampleLabel}>Output</span>
                            <pre style={styles.exampleCode}>{tc.output}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.constraints}>
                    <span style={styles.constraint}>⏱ {problem.timeLimit}ms</span>
                    <span style={styles.constraint}>💾 {problem.memoryLimit}MB</span>
                    {problem.tags.map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'result' && verdict && (
              <div style={styles.resultContent}>
                <div style={styles.resultHeader}>
                  <span style={{ ...styles.resultVerdict, color: verdictColor[verdict.verdict] }}>
                    {verdict.verdict === 'Accepted' ? '✓' : '✗'} {verdict.verdict}
                  </span>
                </div>
                <div style={styles.resultMeta}>
                  <div style={styles.resultMetaItem}>
                    <span style={styles.metaLabel}>execution_time</span>
                    <span style={styles.metaValue}>{verdict.executionTime}ms</span>
                  </div>
                  <div style={styles.resultMetaItem}>
                    <span style={styles.metaLabel}>language</span>
                    <span style={styles.metaValue}>{verdict.language}</span>
                  </div>
                  <div style={styles.resultMetaItem}>
                    <span style={styles.metaLabel}>submitted_at</span>
                    <span style={styles.metaValue}>{new Date(verdict.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resize handle */}
        <div style={styles.resizeHandle} />

        {/* Right panel — editor */}
        <div style={styles.rightPanel}>
          {/* Editor tab bar */}
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              <span style={styles.tabIcon}>⚡</span>
              solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'py'}
            </div>
            <div style={styles.tabSpacer} />
            <select value={language} onChange={handleLanguageChange} style={styles.langSelect}>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          {/* Monaco editor */}
          <div style={styles.editorWrapper}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val)}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Bottom action bar */}
          <div style={styles.actionBar}>
            {error && <span style={styles.actionError}>{error}</span>}
            {submitting && (
              <span style={styles.actionStatus}>
                <span style={styles.submittingDot} />
                Running against test cases...
              </span>
            )}
            <div style={styles.actionSpacer} />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...styles.submitBtn,
                background: submitting ? '#1a1a1a' : '#00ff87',
                color: submitting ? '#444' : '#0a0a0a',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '◌ Running...' : '▶ Submit'}
            </button>
          </div>
        </div>
      </div>

      {verdict && (
        <AIReviewPanel
          code={code}
          language={language}
          verdict={verdict.verdict}
          problemName={problem.name}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  leftPanel: { width: '45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a1a', overflow: 'hidden' },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  resizeHandle: { width: '4px', background: '#1a1a1a', cursor: 'col-resize', flexShrink: 0 },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0, overflowX: 'auto' },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', whiteSpace: 'nowrap', transition: 'color 0.15s' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabIcon: { fontSize: '0.75rem' },
  tabSpacer: { flex: 1 },
  langSelect: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 0.75rem', height: '36px', outline: 'none' },
  panelContent: { flex: 1, overflowY: 'auto', background: '#111' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1.25rem', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' },
  breadcrumbItem: { color: '#444', fontSize: '0.78rem', fontFamily: 'monospace', cursor: 'pointer' },
  breadcrumbSep: { color: '#2a2a2a', fontSize: '0.78rem' },
  problemContent: { padding: '1.5rem' },
  problemTitle: { color: '#f0f0f0', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem' },
  statement: { color: '#888', lineHeight: 1.8, fontSize: '0.9rem', margin: '0 0 1.5rem' },
  sectionLabel: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.8rem', margin: '0 0 0.75rem' },
  examples: { marginBottom: '1.5rem' },
  example: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem', background: '#0a0a0a', borderRadius: '6px', padding: '0.75rem', border: '1px solid #1a1a1a' },
  exampleBlock: { flex: 1 },
  exampleLabel: { color: '#444', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' },
  exampleCode: { color: '#00ff87', fontFamily: 'monospace', fontSize: '0.85rem', margin: 0 },
  exampleArrow: { color: '#2a2a2a', fontSize: '1rem', paddingTop: '1.2rem' },
  constraints: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' },
  constraint: { color: '#444', fontSize: '0.8rem', fontFamily: 'monospace' },
  tag: { background: '#1a1a1a', color: '#444', padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', border: '1px solid #2a2a2a', fontFamily: 'monospace' },
  resultContent: { padding: '1.5rem' },
  resultHeader: { marginBottom: '1.5rem' },
  resultVerdict: { fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' },
  resultMeta: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  resultMetaItem: { display: 'flex', gap: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' },
  metaLabel: { color: '#444', width: '140px', flexShrink: 0 },
  metaValue: { color: '#f0f0f0' },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  actionBar: { height: '44px', background: '#0f0f0f', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem', flexShrink: 0 },
  actionError: { color: '#ff4444', fontSize: '0.8rem', fontFamily: 'monospace' },
  actionStatus: { color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  submittingDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#ffc107', animation: 'pulse 1s infinite' },
  actionSpacer: { flex: 1 },
  submitBtn: { padding: '0.45rem 1.25rem', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em' },
}

export default ProblemDetail