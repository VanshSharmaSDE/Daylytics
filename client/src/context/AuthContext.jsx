import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import API from '../api'

const AuthContext = createContext({ token: null, user: null, loadingUser: false, login: () => {}, logout: () => {}, refreshUser: () => {} })

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem('token'))

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setLoadingUser(false)
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
    <AuthContext.Provider value={{ token, user, loadingUser, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
