// E:\online-judge\frontend\src\features\admin\pages\AdminDashboard.jsx
import { useState } from 'react'
import Navbar from '../../../shared/components/Navbar'
import ActivityBar from '../../../shared/components/ActivityBar'
import IDELayout from '../../../shared/components/IDELayout'
import api from '../../../shared/api/axios'
import { createContest } from '../../contests/contestsApi'

const AdminDashboard = () => {
  const [adminTab, setAdminTab] = useState('problem') // 'problem' | 'contest'

  // problem state
  const [problem, setProblem] = useState({
    name: '', slug: '', statement: '', difficulty: 'Easy',
    tags: '', timeLimit: 5000, memoryLimit: 256,
  })
  const [testCases, setTestCases] = useState([{ input: '', output: '', isSample: false }])
  const [createdProblemId, setCreatedProblemId] = useState(null)

  // contest state
  const [contest, setContest] = useState({
    name: '', description: '', startTime: '', endTime: '',
    problemIds: '', freezeLeaderboard: true,
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleProblemChange = (e) => setProblem({ ...problem, [e.target.name]: e.target.value })
  const handleContestChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setContest({ ...contest, [e.target.name]: val })
  }

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases]
    updated[index][field] = field === 'isSample' ? value === 'true' : value
    setTestCases(updated)
  }

  const addTestCase = () => setTestCases([...testCases, { input: '', output: '', isSample: false }])
  const removeTestCase = (index) => setTestCases(testCases.filter((_, i) => i !== index))

  const handleCreateProblem = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      const data = {
        ...problem,
        tags: problem.tags.split(',').map(t => t.trim()).filter(Boolean),
        timeLimit: Number(problem.timeLimit),
        memoryLimit: Number(problem.memoryLimit),
      }
      const res = await api.post('/problems', data)
      setCreatedProblemId(res.data.problem._id)
      setMessage(`// problem "${res.data.problem.name}" created — add test cases below`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create problem')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestCases = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      await api.post(`/problems/${createdProblemId}/testcases`, { testCases })
      setMessage('// test cases saved successfully')
      setProblem({ name: '', slug: '', statement: '', difficulty: 'Easy', tags: '', timeLimit: 5000, memoryLimit: 256 })
      setTestCases([{ input: '', output: '', isSample: false }])
      setCreatedProblemId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add test cases')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContest = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      const problemIds = contest.problemIds.split(',').map(id => id.trim()).filter(Boolean)
      await createContest({
        name: contest.name,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        problemIds,
        freezeLeaderboard: contest.freezeLeaderboard,
      })
      setMessage('// contest created successfully')
      setContest({ name: '', description: '', startTime: '', endTime: '', problemIds: '', freezeLeaderboard: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contest')
    } finally {
      setLoading(false)
    }
  }

  const statusItems = [
    { position: 'left', label: 'admin.panel', icon: '⚙', color: '#ffc107' },
  ]

  return (
    <IDELayout statusItems={statusItems}>
      <Navbar />
      <div style={styles.workspace}>
        <ActivityBar />
        <div style={styles.main}>
          <div style={styles.tabBar}>
            <div style={{
              ...styles.tab,
              ...(adminTab === 'problem' ? { ...styles.tabActive, borderTopColor: '#ffc107', color: '#ffc107' } : {}),
            }} onClick={() => { setAdminTab('problem'); setMessage(''); setError('') }}>
              ⚙ create_problem
            </div>
            <div style={{
              ...styles.tab,
              ...(adminTab === 'contest' ? { ...styles.tabActive, borderTopColor: '#a78bfa', color: '#a78bfa' } : {}),
            }} onClick={() => { setAdminTab('contest'); setMessage(''); setError('') }}>
              ◉ create_contest
            </div>
            <div style={styles.tabSpacer} />
          </div>

          <div style={styles.content}>
            <h1 style={styles.title}>Admin Panel</h1>

            {message && <div style={styles.success}>{message}</div>}
            {error && <div style={styles.error}>{error}</div>}

            {/* Problem creation */}
            {adminTab === 'problem' && (
              !createdProblemId ? (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>// create_problem()</div>
                  <form onSubmit={handleCreateProblem}>
                    <div style={styles.formGrid}>
                      {[
                        { label: 'name', name: 'name', type: 'text' },
                        { label: 'slug', name: 'slug', type: 'text' },
                        { label: 'tags (comma separated)', name: 'tags', type: 'text' },
                        { label: 'time_limit_ms', name: 'timeLimit', type: 'number' },
                        { label: 'memory_limit_mb', name: 'memoryLimit', type: 'number' },
                      ].map(f => (
                        <div key={f.name} style={styles.field}>
                          <label style={styles.label}>{f.label}</label>
                          <input style={styles.input} type={f.type} name={f.name}
                            value={problem[f.name]} onChange={handleProblemChange} required />
                        </div>
                      ))}
                      <div style={styles.field}>
                        <label style={styles.label}>difficulty</label>
                        <select name="difficulty" value={problem.difficulty} onChange={handleProblemChange} style={styles.input}>
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>statement (markdown supported)</label>
                      <textarea style={{ ...styles.input, height: '140px', resize: 'vertical' }}
                        name="statement" value={problem.statement} onChange={handleProblemChange} required />
                    </div>
                    <button style={styles.btn} type="submit" disabled={loading}>
                      {loading ? '// creating...' : '▶ create_problem()'}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>// add_test_cases()</div>
                  <form onSubmit={handleAddTestCases}>
                    {testCases.map((tc, i) => (
                      <div key={i} style={styles.tcCard}>
                        <div style={styles.tcHeader}>
                          <span style={styles.tcNum}>// test_case_{i + 1}</span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select value={tc.isSample.toString()} onChange={e => handleTestCaseChange(i, 'isSample', e.target.value)} style={{ ...styles.input, padding: '0.25rem 0.5rem', width: 'auto' }}>
                              <option value="false">hidden</option>
                              <option value="true">sample</option>
                            </select>
                            {testCases.length > 1 && (
                              <button type="button" onClick={() => removeTestCase(i)} style={styles.removeBtn}>remove</button>
                            )}
                          </div>
                        </div>
                        <div style={styles.tcGrid}>
                          <div style={styles.field}>
                            <label style={styles.label}>input</label>
                            <textarea style={{ ...styles.input, height: '80px', fontFamily: 'monospace' }}
                              value={tc.input} onChange={e => handleTestCaseChange(i, 'input', e.target.value)} required />
                          </div>
                          <div style={styles.field}>
                            <label style={styles.label}>expected_output</label>
                            <textarea style={{ ...styles.input, height: '80px', fontFamily: 'monospace' }}
                              value={tc.output} onChange={e => handleTestCaseChange(i, 'output', e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addTestCase} style={styles.addBtn}>+ add_test_case()</button>
                    <button type="submit" style={styles.btn} disabled={loading}>
                      {loading ? '// saving...' : '▶ save_test_cases()'}
                    </button>
                  </form>
                </div>
              )
            )}

            {/* Contest creation */}
            {adminTab === 'contest' && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>// create_contest()</div>
                <form onSubmit={handleCreateContest}>
                  <div style={styles.field}>
                    <label style={styles.label}>contest name</label>
                    <input style={styles.input} type="text" name="name"
                      value={contest.name} onChange={handleContestChange} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>description (optional)</label>
                    <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                      name="description" value={contest.description} onChange={handleContestChange} />
                  </div>
                  <div style={styles.formGrid}>
                    <div style={styles.field}>
                      <label style={styles.label}>start time</label>
                      <input style={styles.input} type="datetime-local" name="startTime"
                        value={contest.startTime} onChange={handleContestChange} required />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>end time</label>
                      <input style={styles.input} type="datetime-local" name="endTime"
                        value={contest.endTime} onChange={handleContestChange} required />
                    </div>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>problem ids (comma separated — get from MongoDB)</label>
                    <textarea style={{ ...styles.input, height: '80px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                      name="problemIds" value={contest.problemIds} onChange={handleContestChange}
                      placeholder="507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012, ..."
                      required />
                  </div>
                  <div style={styles.field}>
                    <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="freezeLeaderboard"
                        checked={contest.freezeLeaderboard} onChange={handleContestChange} />
                      freeze leaderboard 1 hour before end
                    </label>
                  </div>
                  <button style={{ ...styles.btn, background: '#a78bfa' }} type="submit" disabled={loading}>
                    {loading ? '// creating...' : '▶ create_contest()'}
                  </button>
                </form>
              </div>
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
  tab: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1rem', height: '36px', color: '#555', fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', borderRight: '1px solid #1a1a1a', borderTop: '1px solid transparent' },
  tabActive: { color: '#f0f0f0', background: '#111' },
  tabSpacer: { flex: 1 },
  content: { flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: '#0a0a0a' },
  title: { color: '#f0f0f0', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '1.5rem', maxWidth: '800px' },
  cardTitle: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '1.25rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' },
  tcGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#888', marginBottom: '0.35rem', fontSize: '0.72rem', fontFamily: 'monospace', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '0.6rem 0.75rem', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#f0f0f0', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  btn: { width: '100%', padding: '0.7rem', background: '#00ff87', color: '#0a0a0a', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'monospace' },
  tcCard: { background: '#0a0a0a', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', border: '1px solid #1a1a1a' },
  tcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  tcNum: { color: '#2a2a2a', fontFamily: 'monospace', fontSize: '0.8rem' },
  addBtn: { width: '100%', padding: '0.6rem', background: 'transparent', color: '#00ff87', border: '1px dashed #00ff8733', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem', fontFamily: 'monospace' },
  removeBtn: { background: 'transparent', color: '#ff4444', border: '1px solid #ff444433', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' },
  success: { background: '#00ff8711', border: '1px solid #00ff8733', color: '#00ff87', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'monospace' },
  error: { background: '#ff444411', border: '1px solid #ff4444', color: '#ff4444', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'monospace' },
}

export default AdminDashboard