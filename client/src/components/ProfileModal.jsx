import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import Loader from './Loader'
import { useData } from '../context/DataContext'

const ProfileModal = ({ open, onClose, user, onUpdated }) => {
  const { savingProfile, savingPassword, updateProfile, updatePassword } = useData();
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })

  useEffect(() => {
    if (user && open) {
      setProfileForm({ name: user.name || '', email: user.email || '' })
      setPasswordForm({ currentPassword: '', newPassword: '' })
    }
  }, [user, open])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    const success = await updateProfile(profileForm.name, profileForm.email, onUpdated);
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    const success = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Account settings" footer={null}>
      <div className="profile-modal">
        <form onSubmit={handleProfileSave} className="mb-4">
          <h6>Profile details</h6>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input 
              className="form-control" 
              value={profileForm.name} 
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
              maxLength={30}
            />
            <small className="text-muted">{profileForm.name.length}/15 characters</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</button>
        </form>

        <form onSubmit={handlePasswordSave}>
          <h6>Change password</h6>
          <div className="mb-3">
            <label className="form-label">Current password</label>
            <input 
              type="password" 
              className="form-control" 
              value={passwordForm.currentPassword} 
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
              required 
              autoComplete="current-password"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New password</label>
            <input 
              type="password" 
              className="form-control" 
              value={passwordForm.newPassword} 
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
              required 
              minLength={6}
              autoComplete="new-password"
            />
            <small className="text-muted">At least 6 characters</small>
          </div>
          <button type="submit" className="btn btn-outline-primary" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </Modal>
  )
}

export default ProfileModal
