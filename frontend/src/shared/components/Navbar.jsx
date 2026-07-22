import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'
import { logoutUser } from '../../features/auth/authApi'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const dropdownRef = useRef(null)

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setConfirmLogout(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try { await logoutUser() } catch (err) {}
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div style={styles.titleBar}>
      <div style={styles.left}>
        <span style={styles.brand}>
          <span style={styles.bracket}>&lt;</span>
          CodeFront
          <span style={styles.bracket}>/&gt;</span>
        </span>
        <span style={styles.separator}>—</span>
        <span style={styles.tagline}>competitive programming arena</span>
      </div>

      <div style={styles.right}>
        {user?.role === 'admin' && (
          <span style={styles.adminBadge}>ADMIN</span>
        )}

        {/* Profile dropdown trigger */}
        <div style={styles.profileTrigger} ref={dropdownRef}>
          <div
            style={styles.avatarBtn}
            onClick={() => { setDropdownOpen(!dropdownOpen); setConfirmLogout(false) }}
          >
            <div style={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span style={styles.username}>@{user?.username}</span>
            <span style={styles.chevron}>{dropdownOpen ? '▲' : '▼'}</span>
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div style={styles.dropdown}>
              {!confirmLogout ? (
                <>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.dropdownName}>{user?.fullName}</div>
                    <div style={styles.dropdownEmail}>@{user?.username}</div>
                  </div>
                  <div style={styles.dropdownDivider} />
                  <div
                    style={styles.dropdownItem}
                    onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={styles.dropdownIcon}>○</span>
                    Profile
                  </div>
                  {user?.role === 'admin' && (
                    <div
                      style={{ ...styles.dropdownItem, color: '#ffc107' }}
                      onClick={() => { navigate('/admin'); setDropdownOpen(false) }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={styles.dropdownIcon}>⚙</span>
                      Admin Panel
                    </div>
                  )}
                  <div style={styles.dropdownDivider} />
                  <div
                    style={{ ...styles.dropdownItem, color: '#ff4444' }}
                    onClick={() => setConfirmLogout(true)}
                    onMouseEnter={e => e.currentTarget.style.background = '#ff444411'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={styles.dropdownIcon}>⏻</span>
                    Logout
                  </div>
                </>
              ) : (
                <div style={styles.confirmBox}>
                  <p style={styles.confirmText}>Are you sure you want to logout?</p>
                  <div style={styles.confirmBtns}>
                    <button
                      style={styles.confirmYes}
                      onClick={handleLogout}
                    >
                      Yes, logout
                    </button>
                    <button
                      style={styles.confirmNo}
                      onClick={() => setConfirmLogout(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  titleBar: {
    height: '38px', background: '#111',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem', flexShrink: 0,
    userSelect: 'none', position: 'relative', zIndex: 200,
  },
  left: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  brand: { fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#f0f0f0', letterSpacing: '-0.3px' },
  bracket: { color: '#00ff87' },
  separator: { color: '#2a2a2a', fontSize: '0.8rem' },
  tagline: { color: '#333', fontSize: '0.75rem', fontFamily: 'monospace' },
  right: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  adminBadge: { background: '#ffc10722', color: '#ffc107', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '3px', letterSpacing: '0.05em', border: '1px solid #ffc10744' },
  profileTrigger: { position: 'relative' },
  avatarBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid transparent', transition: 'border-color 0.15s' },
  avatar: { width: '22px', height: '22px', background: '#00ff87', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0 },
  username: { color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' },
  chevron: { color: '#333', fontSize: '0.55rem' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '6px', minWidth: '200px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    overflow: 'hidden', zIndex: 300,
  },
  dropdownHeader: { padding: '0.85rem 1rem' },
  dropdownName: { color: '#f0f0f0', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.2rem' },
  dropdownEmail: { color: '#888', fontSize: '0.78rem', fontFamily: 'monospace' },
  dropdownDivider: { height: '1px', background: '#1a1a1a' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', fontSize: '0.85rem', color: '#888', cursor: 'pointer', transition: 'background 0.1s' },
  dropdownIcon: { fontSize: '0.8rem', width: '16px', textAlign: 'center' },
  confirmBox: { padding: '1rem' },
  confirmText: { color: '#888', fontSize: '0.82rem', margin: '0 0 0.85rem', lineHeight: 1.5 },
  confirmBtns: { display: 'flex', gap: '0.5rem' },
  confirmYes: { flex: 1, padding: '0.45rem', background: '#ff444422', border: '1px solid #ff444444', color: '#ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'monospace' },
  confirmNo: { flex: 1, padding: '0.45rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#555', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'monospace' },
}

export default Navbar