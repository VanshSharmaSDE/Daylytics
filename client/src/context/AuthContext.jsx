import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import API from '../api'

const AuthContext = createContext({ token: null, user: null, loadingUser: false, login: () => {}, logout: () => {}, refreshUser: () => {}, isLocked: false, lockApp: () => {}, unlockApp: () => {} })

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem('token'))
  const [isLocked, setIsLocked] = useState(() => sessionStorage.getItem('appLocked') === 'true')

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('appLocked')
    setToken(null)
    setUser(null)
    setLoadingUser(false)
    setIsLocked(false)
  }, [])

  const fetchUser = useCallback(async (activeToken = token) => {
    if (!activeToken) {
      setUser(null)
      setLoadingUser(false)
      return
    }
    setLoadingUser(true)
    try {
      const { data } = await API.get('/api/auth/me')
      setUser(data)
    } catch (err) {
      logout()
    } finally {
      setLoadingUser(false)
    }
  }, [token, logout])

  const login = useCallback((newToken, profile) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    if (profile) {
      setUser(profile)
      setLoadingUser(false)
    } else {
      fetchUser(newToken)
    }
  }, [fetchUser])

  const lockApp = useCallback(() => {
    sessionStorage.setItem('appLocked', 'true')
    setIsLocked(true)
  }, [])

  const unlockApp = useCallback(async (password) => {
    try {
      // Verify password with backend
      const { data } = await API.post('/api/auth/verify-password', { password })
      if (data.valid) {
        sessionStorage.removeItem('appLocked')
        setIsLocked(false)
        return true
      }
      return false
    } catch (err) {
      console.error('Unlock error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem('token'))
    window.addEventListener('storage', syncToken)
    return () => window.removeEventListener('storage', syncToken)
  }, [])

  useEffect(() => {
    if (token) fetchUser()
    else {
      setUser(null)
      setLoadingUser(false)
    }
  }, [token, fetchUser])

  return (
    <AuthContext.Provider value={{ token, user, loadingUser, login, logout, refreshUser: fetchUser, isLocked, lockApp, unlockApp }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
