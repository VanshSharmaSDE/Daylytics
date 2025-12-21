import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import API from '../api';
import { useToast } from '../components/ToastProvider';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const Settings = () => {
  const { user, refreshUser, logout } = useAuth();
  const { savingProfile, savingPassword, updateProfile, updatePassword } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Storage management
  const [storageData, setStorageData] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'storage') {
      fetchStorageData();
    }
  }, [activeSection]);

  const fetchStorageData = async () => {
    setLoadingStorage(true);
    try {
      const { data } = await API.get('/api/storage');
      console.log('Storage data:', data); // Debug log
      setStorageData(data);
    } catch (err) {
      console.error('Storage fetch error:', err);
      addToast('error', 'Failed to load storage data');
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const success = await updateProfile(profileForm.name, profileForm.email, refreshUser);
    if (success) {
      addToast('success', 'Profile updated successfully');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const success = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      addToast('success', 'Password updated successfully');
    }
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;

    setDeletingAsset(assetToDelete.id);
    try {
      const params = new URLSearchParams();
      if (assetToDelete.type === 'file') {
        params.append('fileId', assetToDelete.fileId);
        params.append('imageUrl', assetToDelete.url);
      }
      
      await API.delete(`/api/storage/${assetToDelete.type}/${assetToDelete.id}?${params.toString()}`);
      addToast('success', 'Asset deleted successfully');
      fetchStorageData();
    } catch (err) {
      addToast('error', err.response?.data?.msg || 'Failed to delete asset');
    } finally {
      setDeletingAsset(null);
      setAssetToDelete(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fileIconFor = (mime) => {
    if (!mime) return 'ri-file-line';
    if (mime.startsWith('image/')) return 'ri-image-line';
    if (mime.startsWith('video/')) return 'ri-file-video-line';
    if (mime === 'application/pdf') return 'ri-file-pdf-line';
    if (mime.startsWith('text/')) return 'ri-file-text-line';
    if (mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'ri-file-word-line';
    if (mime === 'application/vnd.ms-excel' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'ri-file-excel-line';
    if (mime.startsWith('audio/')) return 'ri-file-music-line';
    return 'ri-file-line';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = storageData && storageData.storageLimit > 0
    ? Math.min(100, (storageData.storageUsed / storageData.storageLimit) * 100)
    : 0;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Settings</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => window.history.back()}
        >
          <i className="ri-arrow-left-line"></i>
          <span className="d-none d-md-inline ms-2">Back</span>
        </button>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-4">
          <div className="card panel-shadow settings-sidebar">
            <div className="list-group list-group-flush">
              <button
                className={`list-group-item list-group-item-action ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                <i className="ri-user-line me-2"></i>
                Profile
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeSection === 'password' ? 'active' : ''}`}
                onClick={() => setActiveSection('password')}
              >
                <i className="ri-lock-password-line me-2"></i>
                Password
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeSection === 'storage' ? 'active' : ''}`}
                onClick={() => setActiveSection('storage')}
              >
                <i className="ri-hard-drive-2-line me-2"></i>
                Storage
              </button>
              <button
                className="list-group-item list-group-item-action text-danger"
                onClick={() => setShowLogoutModal(true)}
              >
                <i className="ri-logout-box-line me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-md-9">
          <div className="card panel-shadow settings-content">
            <div className="card-body">
              {activeSection === 'storage' && loadingStorage ? (
                <div className="d-flex justify-content-center align-items-center settings-loader-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                <div>
                  <h5 className="mb-4">Profile Details</h5>
                  <form onSubmit={handleProfileSave}>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input 
                        className="form-control" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                        maxLength={30}
                      />
                      <small className="text-muted">{profileForm.name.length}/30 characters</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={profileForm.email} 
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Password Section */}
              {activeSection === 'password' && (
                <div>
                  <h5 className="mb-4">Change Password</h5>
                  <form onSubmit={handlePasswordSave}>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
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
                      <label className="form-label">New Password</label>
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
                    <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Storage Section */}
              {activeSection === 'storage' && (
                <div>
                  <h5 className="mb-4">Storage Management</h5>
                  
                  {storageData ? (
                    <>
                      {/* Storage Usage */}
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Storage Used</span>
                          <span className="fw-semibold">
                            {formatBytes(storageData.storageUsed)} / {formatBytes(storageData.storageLimit)}
                          </span>
                        </div>
                        <div className="progress settings-progress-bar">
                          <div 
                            className={`progress-bar ${storagePercentage > 90 ? 'bg-danger' : storagePercentage > 70 ? 'bg-warning' : 'bg-success'}`}
                            role="progressbar" 
                            style={{ width: `${storagePercentage}%` }}
                            aria-valuenow={storagePercentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <small className="text-muted">{storagePercentage.toFixed(1)}% used</small>
                      </div>

                      {/* Assets List */}
                      <div>
                        <h6 className="mb-3">All Assets ({storageData.assets.length})</h6>
                        
                        {storageData.assets.length === 0 ? (
                          <div className="text-center text-muted py-5">
                            <i className="ri-inbox-line settings-empty-icon"></i>
                            <p className="mt-2">No assets uploaded yet</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Preview</th>
                                  <th>Name</th>
                                  <th>Type</th>
                                  <th>Source</th>
                                  <th>Size</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {storageData.assets.map((asset, index) => (
                                  <tr key={index}>
                                    <td>
                                      <img 
                                        src={asset.url} 
                                        alt={asset.name}
                                        className="settings-asset-preview"
                                      />
                                    </td>
                                    <td>
                                      <div className="settings-text-ellipsis" title={asset.name}>
                                        {asset.name}
                                      </div>
                                    </td>
                                    <td>
                                      <span className="badge">
                                        {asset.type === 'task' ? 'Task' : asset.type === 'file' ? 'File' : 'Bucket'}
                                      </span>
                                    </td>
                                    <td>
                                      <small className="text-muted">
                                        <div className="settings-source-ellipsis" title={asset.type === 'task' ? asset.taskTitle : asset.type === 'file' ? asset.fileTitle : 'Bucket'}>
                                          {asset.type === 'task' 
                                            ? asset.taskTitle 
                                            : asset.type === 'file' 
                                            ? asset.fileTitle 
                                            : 'Bucket'}
                                        </div>
                                      </small>
                                    </td>
                                    <td>{asset.size > 0 ? formatBytes(asset.size) : 'N/A'}</td>
                                    <td>
                                      <div className="btn-group btn-group-sm">
                                        <a 
                                          href={asset.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="btn btn-outline-primary"
                                        >
                                          <i className="ri-external-link-line"></i>
                                        </a>
                                        <button
                                          className="btn btn-outline-danger"
                                          onClick={() => setAssetToDelete(asset)}
                                          disabled={deletingAsset === asset.id}
                                        >
                                          {deletingAsset === asset.id ? (
                                            <div className="spinner-border spinner-border-sm" role="status" />
                                          ) : (
                                            <i className="ri-delete-bin-line"></i>
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted py-5">
                      <p>Failed to load storage data</p>
                      <button className="btn btn-primary" onClick={fetchStorageData}>
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Asset Confirmation Modal */}
      <Modal
        open={!!assetToDelete}
        title="Delete Asset?"
        onClose={() => setAssetToDelete(null)}
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setAssetToDelete(null)}
              disabled={deletingAsset === assetToDelete?.id}
            >
              Cancel
            </button>
            <button 
              className="btn btn-outline-danger" 
              onClick={confirmDeleteAsset}
              disabled={deletingAsset === assetToDelete?.id}
            >
              {deletingAsset === assetToDelete?.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">Are you sure you want to delete <strong>{assetToDelete?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        open={showLogoutModal}
        title="Ready to sign out?"
        onClose={() => setShowLogoutModal(false)}
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-outline-danger" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        }
      >
        <p className="mb-0">You'll be redirected to the login screen.</p>
      </Modal>
    </div>
  );
};

export default Settings;
