import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SharedView from './pages/SharedView'
import FlowChartSharedView from './pages/FlowChartSharedView'
import { useAuth } from './context/AuthContext'

const App = () => {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/register" element={<Register/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/share/:token" element={<SharedView/>} />
      <Route path="/flowchart-share/:token" element={<FlowChartSharedView/>} />
      <Route path="/dashboard" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
    </Routes>
  )
}

export default App
