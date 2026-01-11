import React, { useState } from 'react'
import API from '../api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastProvider'

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async e => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const { data } = await API.post('/api/auth/register', form)
      login(data.token, data.user)
      addToast('success', 'Account created!')
      navigate('/dashboard')
    } catch (err) {
      addToast('error', err.response?.data?.msg || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-section">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <i className="ri-calendar-check-line"></i>
            </div>
            <h1 className="auth-brand-title">Daylytics</h1>
          </div>
          <p className="auth-brand-tagline">
            Track your daily tasks and completion insights in one place
          </p>
          <div className="auth-version">v1.0.0</div>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="ri-checkbox-circle-line"></i>
              <span>Daily task management</span>
            </div>
            <div className="auth-feature">
              <i className="ri-line-chart-line"></i>
              <span>Completion analytics</span>
            </div>
            <div className="auth-feature">
              <i className="ri-moon-line"></i>
              <span>Dark mode support</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Get started</h2>
            <p className="auth-form-subtitle">Create your account to begin tracking</p>
          </div>
          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div className="input-with-icon">
                <i className="ri-user-line"></i>
                <input
                  name="name"
                  onChange={onChange}
                  value={form.name}
                  className="form-control"
                  placeholder="Enter your name"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-with-icon">
                <i className="ri-mail-line"></i>
                <input
                  name="email"
                  onChange={onChange}
                  value={form.email}
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <i className="ri-lock-line"></i>
                <input
                  name="password"
                  onChange={onChange}
                  value={form.password}
                  type="password"
                  className="form-control"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary w-100 auth-submit-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <i className="ri-arrow-right-line ms-2"></i>
                </>
              )}
            </button>
          </form>
          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
