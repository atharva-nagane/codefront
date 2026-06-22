import { useState } from 'react'
import Editor from '@monaco-editor/react'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import api from '../../../shared/api/axios'

const defaultCode = {
  python: `# Write your code here\nprint("Hello, CodeFront!")`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeFront!" << endl;\n    return 0;\n}`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeFront!");\n    }\n}`,
}

const langExt = { python: 'py', cpp: 'cpp', java: 'java' }

const Playground = () => {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(defaultCode['python'])
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [executionTime, setExecutionTime] = useState(null)
  const [verdict, setVerdict] = useState(null)

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(defaultCode[lang])
    setOutput('')
    setError('')
    setVerdict(null)
  }

  const handleRun = async () => {
    setRunning(true)
    setOutput('')
    setError('')
    setVerdict(null)
    setExecutionTime(null)
    try {
      const res = await api.post('/execution/run', { code, language, input })
      if (res.data.verdict) {
        setVerdict(res.data.verdict)
        setOutput(res.data.output || '')
      } else {
        setOutput(res.data.output || '(no output)')
      }
      setExecutionTime(res.data.executionTime)
    } catch (err) {
      setError(err.response?.data?.message || 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const verdictColor = {
    'Time Limit Exceeded': '#ffc107',
    'Memory Limit Exceeded': '#ffc107',
    'Runtime Error': '#ff4444',
    'Compile Error': '#ff4444',
  }

  const statusItems = [
    { position: 'left', label: `scratch.${langExt[language]}`, icon: '▶' },
    { position: 'right', label: language, icon: '{}' },
    executionTime ? { position: 'right', label: `${executionTime}ms`, icon: '⏱' } : null,
  ].filter(Boolean)

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />

        {/* Left — editor panel */}
        <div style={styles.editorPanel}>
          {/* Tab bar */}
          <div style={styles.tabBar}>
            {['python', 'cpp', 'java'].map(lang => (
              <div
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                style={{
                  ...styles.tab,
                  ...(language === lang ? styles.tabActive : {}),
                }}
              >
                scratch.{langExt[lang]}
              </div>
            ))}
            <div style={styles.tabSpacer} />
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                ...styles.runBtn,
                background: running ? 'transparent' : '#00ff87',
                color: running ? '#444' : '#0a0a0a',
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? '◌ Running...' : '▶ Run'}
            </button>
          </div>

          {/* Editor */}
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
                padding: { top: 12 },
              }}
            />
          </div>
        </div>

        {/* Resize handle */}
        <div style={styles.resizeHandle} />

        {/* Right — IO panel */}
        <div style={styles.ioPanel}>
          {/* Input tab */}
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>stdin</div>
            <div style={styles.tabSpacer} />
          </div>
          <div style={styles.inputWrapper}>
            <textarea
              style={styles.ioTextarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="// custom input here..."
              spellCheck={false}
            />
          </div>

          {/* Output tab */}
          <div style={{ ...styles.tabBar, borderTop: '1px solid #1a1a1a' }}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              stdout
            </div>
            {executionTime && (
              <span style={styles.execTime}>{executionTime}ms</span>
            )}
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.outputWrapper}>
            {verdict && (
              <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid #1a1a1a',
                color: verdictColor[verdict] || '#555',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                background: (verdictColor[verdict] || '#555') + '11',
              }}>
                ✗ {verdict}
              </div>
            )}
            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}
            <pre style={styles.outputPre}>
              {output || (running ? '' : '// output will appear here')}
            </pre>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
    </IDELayout>
  )
}

const styles = {
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  editorPanel: { flex: 1.2, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  ioPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #1a1a1a' },
  resizeHandle: { width: '4px', background: '#1a1a1a', cursor: 'col-resize', flexShrink: 0 },
  tabBar: { display: 'flex', alignItems: 'center', background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', height: '36px', flexShrink: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', whiteSpace: 'nowrap' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  runBtn: { margin: '0 0.5rem', padding: '0.3rem 1rem', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  inputWrapper: { flex: 1, overflow: 'hidden', background: '#111' },
  ioTextarea: { width: '100%', height: '100%', background: '#111', border: 'none', color: '#888', padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', resize: 'none', outline: 'none', boxSizing: 'border-box' },
  outputWrapper: { flex: 1, overflow: 'auto', background: '#0a0a0a' },
  outputPre: { color: '#00ff87', fontFamily: 'monospace', fontSize: '0.875rem', padding: '1rem', margin: 0, whiteSpace: 'pre-wrap' },
  execTime: { color: '#444', fontSize: '0.75rem', fontFamily: 'monospace', padding: '0 0.75rem' },
  errorBox: { background: '#ff444411', borderBottom: '1px solid #ff444433', color: '#ff4444', padding: '0.6rem 1rem', fontSize: '0.8rem', fontFamily: 'monospace' },
}

export default Playground