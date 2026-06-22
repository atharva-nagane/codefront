import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useSelector((state) => state.auth)

  if (loading) return null

  if (!isLoggedIn || user?.role !== 'admin') return <Navigate to="/" replace />

  return children
}

export default AdminRoute