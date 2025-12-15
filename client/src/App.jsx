import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import Loader from './components/Loader'

const App = () => {
  const { token, loadingUser } = useAuth()
  const { globalLoading, operationLoading, operationMessage } = useData()

  if (loadingUser) return <Loader message="Preparing your workspace..." />
  if (globalLoading) return <Loader message="Syncing your day..." />
  if (operationLoading) return <Loader message={operationMessage || "Processing..."} />

  return (
    <Routes>
      <Route path="/register" element={<Register/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/dashboard" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
    </Routes>
  )
}

export default App
