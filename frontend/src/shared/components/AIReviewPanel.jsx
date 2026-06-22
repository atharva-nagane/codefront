import { useState } from 'react'
import api from '../api/axios'

const AIReviewPanel = ({ code, language, verdict, problemName }) => {
  const [open, setOpen] = useState(false)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGetReview = async () => {
    setOpen(true)
    if (review) return // already fetched
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/execution/review', {
        code,
        language,
        verdict,
        problemName,
      })
      setReview(res.data.review)
    } catch (err) {
      setError(err.response?.data?.message || 'AI review unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = {
    'Accepted': '#22c55e',
    'Wrong Answer': '#ef4444',
    'Time Limit Exceeded': '#f59e0b',
    'Memory Limit Exceeded': '#f59e0b',
    'Runtime Error': '#ef4444',
    'Compile Error': '#ef4444',
  }

  return (
    <>
      {/* Floating button */}
      <div style={styles.floatingBtn} onClick={handleGetReview}>
        <span style={styles.aiIcon}>✦</span>
        <span style={styles.aiLabel}>AI Review</span>
        <span style={{
          ...styles.verdictDot,
          background: verdictColor[verdict] || '#64748b'
        }} />
      </div>

      {/* Slide-up panel */}
      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>
              <span style={styles.aiIconSmall}>✦</span>
              AI Code Review
            </div>
            <div style={styles.panelMeta}>
              <span style={{
                color: verdictColor[verdict] || '#64748b',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                {verdict}
              </span>
              <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
            </div>
          </div>

          <div style={styles.panelBody}>
            {loading && (
              <div style={styles.loadingState}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Analyzing your code...</p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}

            {review && !loading && (
              <div style={styles.reviewText}>
                {review.split('\n').map((line, i) => (
                  line.trim() ? (
                    <p key={i} style={{
                      ...styles.reviewLine,
                      fontWeight: line.match(/^\d\./) ? 600 : 400,
                      color: line.match(/^\d\./) ? '#f0f0f0' : '#666',
                    }}>
                      {line}
                    </p>
                  ) : <br key={i} />
                ))}
              </div>
            )}
          </div>

          <div style={styles.panelFooter}>
            <span style={styles.footerText}>Powered by Gemini 2.0 Flash</span>
            {review && (
              <button
                onClick={() => { setReview(''); setLoading(false); handleGetReview(); }}
                style={styles.refreshBtn}
              >
                ↺ Refresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}

const styles = {
  floatingBtn: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    background: '#111', border: '1px solid #00ff87',
    borderRadius: '50px', padding: '0.6rem 1.1rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    cursor: 'pointer', zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,255,135,0.15)',
  },
  aiIcon: { fontSize: '0.9rem', color: '#00ff87' },
  aiLabel: { color: '#f0f0f0', fontSize: '0.875rem', fontWeight: 600 },
  verdictDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  panel: {
    position: 'fixed', bottom: '5rem', right: '2rem',
    width: '380px', background: '#111',
    border: '1px solid #1a1a1a', borderRadius: '8px',
    zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.2s ease', display: 'flex',
    flexDirection: 'column', maxHeight: '480px',
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a' },
  panelTitle: { color: '#f0f0f0', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  aiIconSmall: { color: '#00ff87', fontSize: '0.85rem' },
  panelMeta: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  closeBtn: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' },
  panelBody: { padding: '1.25rem', overflowY: 'auto', flex: 1 },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' },
  spinner: { width: '24px', height: '24px', border: '2px solid #1a1a1a', borderTop: '2px solid #00ff87', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#444', fontSize: '0.875rem', margin: 0 },
  reviewText: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  reviewLine: { margin: '0.15rem 0', fontSize: '0.875rem', lineHeight: 1.7 },
  errorBox: { background: '#ff444411', border: '1px solid #ff4444', color: '#ff4444', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' },
  panelFooter: { padding: '0.75rem 1.25rem', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { color: '#2a2a2a', fontSize: '0.75rem' },
  refreshBtn: { background: 'transparent', border: 'none', color: '#00ff87', cursor: 'pointer', fontSize: '0.8rem' },
}

export default AIReviewPanel