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
import BattleLobby from './features/battle/pages/BattleLobby'
import BattleQueue from './features/battle/pages/BattleQueue'
import BattleArena from './features/battle/pages/BattleArena'
import BattleResult from './features/battle/pages/BattleResult'
import SoloArena from './features/battle/pages/SoloArena'
import SoloResult from './features/battle/pages/SoloResult'

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
      <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route path="/battle" element={<ProtectedRoute><BattleLobby /></ProtectedRoute>} />
      <Route path="/battle/queue" element={<ProtectedRoute><BattleQueue /></ProtectedRoute>} />
      <Route path="/battle/:battleId" element={<ProtectedRoute><BattleArena /></ProtectedRoute>} />
      <Route path="/battle/:battleId/result" element={<ProtectedRoute><BattleResult /></ProtectedRoute>} />
      <Route path="/battle/solo" element={<ProtectedRoute><SoloArena /></ProtectedRoute>} />
      <Route path="/battle/solo/result" element={<ProtectedRoute><SoloResult /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App