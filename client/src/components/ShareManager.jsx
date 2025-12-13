import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from './ToastProvider';
import Modal from './Modal';

const ShareManager = ({ onClose, files, folders }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create share form
  const [shareName, setShareName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [expiresIn, setExpiresIn] = useState('');
  const [maxAccessCount, setMaxAccessCount] = useState('');
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchShares();
    // Pre-select if files/folders passed
    if (files && files.length > 0) {
      setSelectedFiles(files.map(f => f._id));
    }
    if (folders && folders.length > 0) {
      setSelectedFolders(folders.map(f => f._id));
    }
  }, [files, folders]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/shares');
      setShares(data);
    } catch (error) {
      addToast('error', 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    if (!shareName.trim()) {
      addToast('error', 'Please enter a share name');
      return;
    }

    if (selectedFiles.length === 0 && selectedFolders.length === 0) {
      addToast('error', 'Select at least one file or folder');
      return;
    }

    try {
      setCreating(true);
      const { data } = await api.post('/api/shares', {
        name: shareName,
        files: selectedFiles,
        folders: selectedFolders,
        expiresIn: expiresIn || null,
        maxAccessCount: maxAccessCount || null
      });
      
      const shareUrl = `${window.location.origin}/share/${data.shareToken}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      addToast('success', 'Share link created and copied to clipboard!');
      setShowCreateModal(false);
      resetForm();
      fetchShares();
    } catch (error) {
      addToast('error', error.response?.data?.msg || 'Failed to create share');
    } finally {
      setCreating(false);
    }
  };

  const deleteShare = async (id) => {
    try {
      await api.delete(`/api/shares/${id}`);
      addToast('success', 'Share deleted');
      fetchShares();
    } catch (error) {
      addToast('error', 'Failed to delete share');
    }
  };

  const toggleShare = async (id) => {
    try {
      await api.patch(`/api/shares/${id}/toggle`);
      addToast('success', 'Share status updated');
      fetchShares();
    } catch (error) {
      addToast('error', 'Failed to update share');
    }
  };

  const copyLink = async (token) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    addToast('success', 'Link copied to clipboard');
  };

  const resetForm = () => {
    setShareName('');
    setSelectedFiles([]);
    setSelectedFolders([]);
    setExpiresIn('');
    setMaxAccessCount('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} min`;
  };

  if (!open) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Share Files & Folders"
      size="lg"
    >
      <div className="share-manager">
        {/* Main Content */}
        {!showCreateModal ? (
          <>
            {/* Header with Create Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Your Shares</h5>
                <small className="text-muted">Manage and track your shared links</small>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="ri-add-line me-2"></i>Create Share
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading shares...</p>
              </div>
            ) : shares.length === 0 ? (
              // Empty State
              <div className="text-center py-5">
                <div className="mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}>
                  <i className="ri-share-line"></i>
                </div>
                <h6 className="text-muted mb-2">No shares yet</h6>
                <p className="text-muted small mb-4">Create your first share to collaborate with others</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="ri-add-line me-2"></i>Create Your First Share
                </button>
              </div>
            ) : (
              // Shares List
              <div className="shares-list">
                {shares.map(share => (
                  <div key={share._id} className="share-card p-3 mb-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <h6 className="mb-0">{share.name}</h6>
                          {!share.isActive && (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                          {share.expiresAt && new Date(share.expiresAt) < new Date() && (
                            <span className="badge bg-danger">Expired</span>
                          )}
                        </div>
                        
                        <div className="d-flex gap-3 mb-2 flex-wrap">
                          <small className="text-muted">
                            <i className="ri-file-text-line me-1"></i>
                            {share.files.length} file{share.files.length !== 1 ? 's' : ''}
                          </small>
                          <small className="text-muted">
                            <i className="ri-folder-line me-1"></i>
                            {share.folders.length} folder{share.folders.length !== 1 ? 's' : ''}
                          </small>
                          <small className="text-muted">
                            <i className="ri-eye-line me-1"></i>
                            {share.accessCount} view{share.accessCount !== 1 ? 's' : ''}
                            {share.maxAccessCount && ` / ${share.maxAccessCount}`}
                          </small>
                        </div>

                        <div className="d-flex gap-3 flex-wrap">
                          <small className="text-muted">
                            <i className="ri-calendar-line me-1"></i>
                            Created: {formatDate(share.createdAt)}
                          </small>
                          {share.expiresAt && (
                            <small className={new Date(share.expiresAt) < new Date() ? 'text-danger' : 'text-warning'}>
                              <i className="ri-time-line me-1"></i>
                              {new Date(share.expiresAt) < new Date() 
                                ? 'Expired' 
                                : `Expires in ${getTimeRemaining(share.expiresAt)}`}
                            </small>
                          )}
                          {!share.expiresAt && (
                            <small className="text-success">
                              <i className="ri-infinity-line me-1"></i>
                              Never expires
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => copyLink(share.shareToken)}
                          title="Copy link"
                        >
                          <i className="ri-file-copy-line"></i>
                        </button>
                        <button
                          className={`btn btn-sm ${share.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => toggleShare(share._id)}
                          title={share.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <i className={share.isActive ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteShare(share._id)}
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Create Share Form
          <div className="create-share-form">
            <button 
              className="btn btn-link text-decoration-none p-0 mb-3"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <i className="ri-arrow-left-line me-2"></i>Back to shares
            </button>

            <h5 className="mb-3">Create New Share</h5>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Share Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
                placeholder="e.g., Project Files, Design Assets"
                autoFocus
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Expiration</label>
                <select 
                  className="form-select"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                >
                  <option value="">Never expires</option>
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">1 day</option>
                  <option value="72">3 days</option>
                  <option value="168">1 week</option>
                  <option value="720">30 days</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Max Views</label>
                <input
                  type="number"
                  className="form-control"
                  value={maxAccessCount}
                  onChange={(e) => setMaxAccessCount(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Files <span className="badge bg-primary ms-2">{selectedFiles.length} selected</span>
              </label>
              <div className="border rounded p-3" style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--panel-muted)' }}>
                {files && files.length > 0 ? (
                  files.map(file => (
                    <div key={file._id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`file-${file._id}`}
                        checked={selectedFiles.includes(file._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, file._id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== file._id));
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor={`file-${file._id}`}>
                        <i className="ri-file-text-line me-2"></i>{file.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <small className="text-muted">No files available in current folder</small>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Folders <span className="badge bg-primary ms-2">{selectedFolders.length} selected</span>
              </label>
              <div className="border rounded p-3" style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--panel-muted)' }}>
                {folders && folders.length > 0 ? (
                  folders.map(folder => (
                    <div key={folder._id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`folder-${folder._id}`}
                        checked={selectedFolders.includes(folder._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFolders([...selectedFolders, folder._id]);
                          } else {
                            setSelectedFolders(selectedFolders.filter(id => id !== folder._id));
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor={`folder-${folder._id}`}>
                        <i className="ri-folder-line me-2"></i>{folder.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <small className="text-muted">No folders available</small>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={createShare}
                disabled={creating || !shareName.trim() || (selectedFiles.length === 0 && selectedFolders.length === 0)}
              >
                {creating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="ri-share-line me-2"></i>Create Share Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareManager;
