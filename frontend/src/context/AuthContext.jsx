import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('qa_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('qa_token') || null)

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('qa_token', data.access_token)
    localStorage.setItem('qa_user', JSON.stringify({ username: data.username, email: data.email, plan: data.plan }))
    setToken(data.access_token)
    setUser({ username: data.username, email: data.email, plan: data.plan })
    return data
  }, [])

  const signup = useCallback(async (email, username, password) => {
    const { data } = await api.post('/signup', { email, username, password })
    localStorage.setItem('qa_token', data.access_token)
    localStorage.setItem('qa_user', JSON.stringify({ username: data.username, email: data.email, plan: data.plan }))
    setToken(data.access_token)
    setUser({ username: data.username, email: data.email, plan: data.plan })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('qa_token')
    localStorage.removeItem('qa_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
