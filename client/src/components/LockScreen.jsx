import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import Version from './Version';

const LockScreen = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await onUnlock(password);
      if (!success) {
        addToast('error', 'Incorrect password. Please try again.');
        setPassword('');
      } else {
        addToast('success', 'Welcome back! App unlocked successfully.');
      }
    } catch (err) {
      addToast('error', 'Failed to unlock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-section">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <i className="ri-lock-fill"></i>
            </div>
            <h1 className="auth-brand-title">Daylytics</h1>
          </div>
          <p className="auth-brand-tagline">
            Your workspace is locked for security
          </p>
          <Version />
          <div className="auth-features">
            <div className="auth-feature">
              <i className="ri-shield-check-line"></i>
              <span>Secure session</span>
            </div>
            <div className="auth-feature">
              <i className="ri-lock-password-line"></i>
              <span>Password protected</span>
            </div>
            <div className="auth-feature">
              <i className="ri-user-line"></i>
              <span>{user?.name || user?.email || 'User'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Unlock Daylytics</h2>
            <p className="auth-form-subtitle">
              Enter your password to continue
            </p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <i className="ri-lock-password-line"></i>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!password || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Unlocking...
                </>
              ) : (
                <>
                  <i className="ri-lock-unlock-line me-2"></i>
                  Unlock
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
