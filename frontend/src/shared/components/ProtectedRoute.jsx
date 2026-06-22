import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useSelector((state) => state.auth)

  if (loading) return null // wait for auth check

  if (!isLoggedIn) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute