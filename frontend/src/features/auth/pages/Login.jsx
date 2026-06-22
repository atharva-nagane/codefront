import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { setUser } from '../../../store/slices/authSlice'
import { loginUser } from '../authApi'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginUser(form)
      dispatch(setUser(data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <span style={styles.brand}>
            <span style={styles.bracket}>&lt;</span>
            CodeFront
            <span style={styles.bracket}>/&gt;</span>
          </span>
        </div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Login to continue competing</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" required />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p style={styles.link}>
          No account? <Link to="/register" style={{ color: '#00ff87' }}>Register</Link>
        </p>
      </div>

      {/* Background grid effect */}
      <div style={styles.grid} />
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0a0a0a', position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    opacity: 0.4, zIndex: 0,
  },
  card: {
    background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '2.5rem',
    width: '100%', maxWidth: '400px',
    position: 'relative', zIndex: 1,
  },
  brandRow: { marginBottom: '1.5rem' },
  brand: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 800, fontSize: '1.1rem', color: '#f0f0f0',
  },
  bracket: { color: '#00ff87' },
  title: { fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#f0f0f0' },
  subtitle: { color: '#666', margin: '0 0 1.75rem', fontSize: '0.875rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#888', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%', padding: '0.65rem 0.85rem',
    background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '6px', color: '#f0f0f0',
    fontSize: '0.9rem', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
  },
  button: {
    width: '100%', padding: '0.75rem',
    background: '#00ff87', color: '#0a0a0a',
    border: 'none', borderRadius: '6px',
    fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.5rem',
    letterSpacing: '0.02em',
  },
  error: {
    background: '#ff444411', border: '1px solid #ff4444',
    color: '#ff4444', padding: '0.65rem 0.85rem',
    borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem',
  },
  link: { color: '#666', textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' },
}

export default Login