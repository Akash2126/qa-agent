import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import SignupPage    from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage  from './pages/SettingsPage'

function Private({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
function Public({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"     element={<Public><LoginPage /></Public>} />
        <Route path="/signup"    element={<Public><SignupPage /></Public>} />
        <Route path="/dashboard" element={<Private><DashboardPage /></Private>} />
        <Route path="/settings"  element={<Private><SettingsPage /></Private>} />
      </Routes>
    </AuthProvider>
  )
}
