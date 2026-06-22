import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import Spinner from '../../../shared/components/Spinner'
import api from '../../../shared/api/axios'

const verdictColor = {
  'Accepted': '#00ff87',
  'Wrong Answer': '#ff4444',
  'Time Limit Exceeded': '#ffc107',
  'Memory Limit Exceeded': '#ffc107',
  'Runtime Error': '#ff4444',
  'Compile Error': '#ff4444',
  'Pending': '#444',
}

const SubmissionResult = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/submissions/${id}`)
        setSubmission(res.data.submission)
      } catch (err) {
        console.error('Failed to load submission')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const statusItems = submission ? [
    { position: 'left', label: `submission_${id.slice(-6)}.log`, icon: '◇' },
    { position: 'right', label: submission.verdict, color: verdictColor[submission.verdict] },
  ] : []

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.tabActive }}>
              ◇ result.log
            </div>
            <div style={styles.tabSpacer} />
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← back</button>
          </div>

          <div style={styles.content}>
            {loading && <Spinner />}
            {submission && (
              <>
                {/* Verdict header */}
                <div style={styles.verdictHeader}>
                  <span style={{
                    fontSize: '2rem', fontWeight: 700,
                    fontFamily: 'monospace',
                    color: verdictColor[submission.verdict] || '#888',
                  }}>
                    {submission.verdict === 'Accepted' ? '✓' : '✗'} {submission.verdict}
                  </span>
                </div>

                {/* Meta */}
                <div style={styles.metaCard}>
                  <div style={styles.metaTitle}>// execution_info</div>
                  <div style={styles.metaGrid}>
                    {[
                      { key: 'problem', value: submission.problem.name },
                      { key: 'language', value: submission.language },
                      { key: 'execution_time', value: `${submission.executionTime}ms` },
                      { key: 'submitted_at', value: new Date(submission.createdAt).toLocaleString() },
                    ].map(item => (
                      <div key={item.key} style={styles.metaRow}>
                        <span style={styles.metaKey}>{item.key}</span>
                        <span style={styles.metaEquals}>=</span>
                        <span style={styles.metaValue}>"{item.value}"</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code */}
                <div style={styles.codeCard}>
                  <div style={styles.metaTitle}>// submitted_code</div>
                  <pre style={styles.code}>{submission.code}</pre>
                </div>
              </>
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
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a' },
  tabActive: { color: '#f0f0f0', background: '#111', borderTop: '1px solid #00ff87' },
  tabSpacer: { flex: 1 },
  backBtn: { background: 'transparent', border: 'none', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '0 1rem', height: '36px', borderLeft: '1px solid #1a1a1a' },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a' },
  verdictHeader: { marginBottom: '2rem' },
  metaCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '1.25rem', marginBottom: '1rem' },
  metaTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '0.75rem' },
  metaGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  metaRow: { display: 'flex', gap: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem', alignItems: 'center' },
  metaKey: { color: '#555', width: '140px', flexShrink: 0 },
  metaEquals: { color: '#2a2a2a' },
  metaValue: { color: '#00ff87' },
  codeCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '1.25rem' },
  code: { color: '#888', fontSize: '0.85rem', fontFamily: 'monospace', overflow: 'auto', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' },
}

export default SubmissionResult