import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './layout/Dashboard'
import SharedFile from './pages/SharedFile'
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
      <Route path="/shared/:token" element={<SharedFile/>} />
      <Route path="/dashboard" element={token ? <Navigate to="/dashboard/tasks" /> : <Navigate to="/login" />} />
      <Route path="/dashboard/tasks" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/dashboard/files" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/dashboard/analytics" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/dashboard/bucket" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/dashboard/settings" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={token ? '/dashboard/tasks' : '/login'} />} />
      <Route path="*" element={<Navigate to={token ? '/dashboard/tasks' : '/login'} />} />
    </Routes>
  )
}

export default App
