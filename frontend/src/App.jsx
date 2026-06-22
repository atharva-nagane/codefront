// E:\online-judge\frontend\src\App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './shared/components/ProtectedRoute'
import AdminRoute from './shared/components/AdminRoute'
import useAuth from './shared/hooks/useAuth'

import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import Problems from './features/problems/pages/Problems'
import ProblemDetail from './features/problems/pages/ProblemDetail'
import SubmissionResult from './features/submissions/pages/SubmissionResult'
import Leaderboard from './features/leaderboard/pages/Leaderboard'
import AdminDashboard from './features/admin/pages/AdminDashboard'
import Playground from './features/editor/pages/Playground'
import Profile from './features/submissions/pages/Profile'

function App() {
  useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<ProtectedRoute><Problems /></ProtectedRoute>} />
      <Route path="/problems/:slug" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
      <Route path="/submissions/:id" element={<ProtectedRoute><SubmissionResult /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App