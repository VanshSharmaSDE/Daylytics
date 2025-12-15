import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import Loader from './components/Loader'

const App = () => {
  const { token, loadingUser } = useAuth()

  if (loadingUser) return <Loader message="Preparing your workspace..." />

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
