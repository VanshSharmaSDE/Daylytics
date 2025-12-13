import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from './ToastProvider';
import Modal from './Modal';

const FlowChartShareManager = ({ onClose, flowcharts }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create share form
  const [shareName, setShareName] = useState('');
  const [selectedFlowCharts, setSelectedFlowCharts] = useState([]);
  const [expiresIn, setExpiresIn] = useState('');
  const [maxAccessCount, setMaxAccessCount] = useState('');
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchShares();
    // Pre-select flowcharts if passed
    if (flowcharts && flowcharts.length > 0) {
      setSelectedFlowCharts(flowcharts.map(f => f._id));
    }
  }, [flowcharts]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/flowchart-shares');
      setShares(data);
    } catch (error) {
      addToast('error', 'Failed to load flowchart shares');
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    if (!shareName.trim()) {
      addToast('error', 'Please enter a share name');
      return;
    }

    if (selectedFlowCharts.length === 0) {
      addToast('error', 'Select at least one flowchart');
      return;
    }

    try {
      setCreating(true);
      const { data } = await api.post('/api/flowchart-shares', {
        name: shareName,
        flowcharts: selectedFlowCharts,
        expiresIn: expiresIn || null,
        maxAccessCount: maxAccessCount || null
      });
      
      const shareUrl = `${window.location.origin}/flowchart-share/${data.shareToken}`;
      
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
      await api.delete(`/api/flowchart-shares/${id}`);
      addToast('success', 'Share deleted');
      fetchShares();
    } catch (error) {
      addToast('error', 'Failed to delete share');
    }
  };

  const toggleShare = async (id) => {
    try {
      await api.patch(`/api/flowchart-shares/${id}/toggle`);
      addToast('success', 'Share status updated');
      fetchShares();
    } catch (error) {
      addToast('error', 'Failed to update share');
    }
  };

  const copyLink = async (token) => {
    const shareUrl = `${window.location.origin}/flowchart-share/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    addToast('success', 'Link copied to clipboard');
  };

  const resetForm = () => {
    setShareName('');
    setSelectedFlowCharts([]);
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

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Share Flow Charts"
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
                <small className="text-muted">Manage and track your shared flowchart links</small>
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
                            <i className="ri-git-branch-line me-1"></i>
                            {share.flowcharts.length} flowchart{share.flowcharts.length !== 1 ? 's' : ''}
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
                placeholder="e.g., Project Workflows, Design Process"
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

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Flow Charts <span className="badge bg-primary ms-2">{selectedFlowCharts.length} selected</span>
              </label>
              <div className="border rounded p-3" style={{ maxHeight: '280px', overflowY: 'auto', backgroundColor: 'var(--panel-muted)' }}>
                {flowcharts && flowcharts.length > 0 ? (
                  flowcharts.map(flowchart => (
                    <div key={flowchart._id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`flowchart-${flowchart._id}`}
                        checked={selectedFlowCharts.includes(flowchart._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFlowCharts([...selectedFlowCharts, flowchart._id]);
                          } else {
                            setSelectedFlowCharts(selectedFlowCharts.filter(id => id !== flowchart._id));
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor={`flowchart-${flowchart._id}`}>
                        <i className="ri-git-branch-line me-2"></i>{flowchart.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <small className="text-muted">No flowcharts available</small>
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
                disabled={creating || !shareName.trim() || selectedFlowCharts.length === 0}
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

export default FlowChartShareManager;
