import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { marked } from 'marked';

const SharedView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    fetchSharedContent();
  }, [token]);

  const fetchSharedContent = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/shares/${token}`);
      setShareData(data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load shared content');
    } finally {
      setLoading(false);
    }
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
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyContent = async (content) => {
    await navigator.clipboard.writeText(content);
    alert('Content copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Loading shared content...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-danger mb-4" style={{ fontSize: '5rem' }}></i>
          <h2 className="mb-3">{error}</h2>
          <p className="text-muted mb-4">
            {error.includes('expired') || error.includes('no longer available') 
              ? 'This share link has expired or is no longer active.' 
              : 'This link may have been removed or you may not have permission to access it.'}
          </p>
          <div className="alert alert-warning d-inline-block" role="alert">
            <i className="ri-information-line me-2"></i>
            Please contact the person who shared this link for a new one.
          </div>
        </div>
      </div>
    );
  }

  if (viewingFile) {
    return (
      <div className="container-fluid p-4 shared-view">
        <div className="mb-4">
          <button 
            className="btn btn-outline-secondary mb-3"
            onClick={() => setViewingFile(null)}
          >
            <i className="ri-arrow-left-line me-2"></i>Back to Share
          </button>
          <div className="d-flex justify-content-between align-items-center">
            <h2>{viewingFile.title}</h2>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => copyContent(viewingFile.content)}
              >
                <i className="ri-file-copy-line me-2"></i>Copy Content
              </button>
              <button 
                className="btn btn-success"
                onClick={() => downloadFile(viewingFile)}
              >
                <i className="ri-download-line me-2"></i>Download
              </button>
            </div>
          </div>
        </div>
        <div 
          className="markdown-preview p-4 rounded shadow-sm"
          dangerouslySetInnerHTML={{ __html: marked(viewingFile.content || '') }}
        />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 shared-view">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <i className="ri-share-line text-primary" style={{ fontSize: '2.5rem' }}></i>
          <div>
            <h1 className="mb-1">{shareData.name}</h1>
            <div className="d-flex flex-wrap gap-3 text-muted">
              <small>
                <i className="ri-calendar-line me-1"></i>
                Shared {formatDate(shareData.createdAt)}
              </small>
              {shareData.expiresAt && (
                <small className={new Date(shareData.expiresAt) < new Date() ? 'text-danger' : 'text-warning'}>
                  <i className="ri-time-line me-1"></i>
                  {getTimeRemaining(shareData.expiresAt)}
                </small>
              )}
              {shareData.remainingAccess !== null && (
                <small>
                  <i className="ri-eye-line me-1"></i>
                  {shareData.remainingAccess} view{shareData.remainingAccess !== 1 ? 's' : ''} left
                </small>
              )}
              {!shareData.expiresAt && shareData.remainingAccess === null && (
                <small className="text-success">
                  <i className="ri-infinity-line me-1"></i>
                  No expiration
                </small>
              )}
            </div>
          </div>
        </div>
        
        {shareData.expiresAt && (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <i className="ri-information-line me-2"></i>
            This share will expire on <strong className="ms-1">{formatDate(shareData.expiresAt)}</strong>
          </div>
        )}
      </div>

      {shareData.folders && shareData.folders.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="ri-folder-line me-2"></i>
            Folders ({shareData.folders.length})
          </h5>
          {shareData.folders.map(folder => {
            // Get this folder and all its subfolders from folderStructure
            const rootFolderData = shareData.folderStructure?.find(f => String(f._id) === String(folder._id));
            const subfolders = shareData.folderStructure?.filter(f => String(f.parentFolder) === String(folder._id)) || [];
            
            // Recursive component to render folder tree
            const renderFolderTree = (currentFolder, level = 0) => {
              const folderData = shareData.folderStructure?.find(f => String(f._id) === String(currentFolder._id));
              const children = shareData.folderStructure?.filter(f => String(f.parentFolder) === String(currentFolder._id)) || [];
              const files = folderData?.files || [];
              
              return (
                <div key={currentFolder._id} style={{ marginLeft: level > 0 ? '20px' : '0' }} className="mb-3">
                  <div className="card">
                    <div className="card-header d-flex align-items-center">
                      <i className="ri-folder-fill text-warning me-2" style={{ fontSize: '1.3rem' }}></i>
                      <div className="flex-grow-1">
                        <h6 className="mb-0">{currentFolder.name}</h6>
                        <small className="text-muted">
                          {files.length} file{files.length !== 1 ? 's' : ''} • 
                          {children.length > 0 && ` ${children.length} subfolder${children.length !== 1 ? 's' : ''} • `}
                          Created {new Date(currentFolder.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="card-body">
                        <div className="row g-3">
                          {files.map(file => (
                            <div key={file._id} className="col-md-4">
                              <div className="card h-100" style={{ cursor: 'pointer' }} onClick={() => setViewingFile(file)}>
                                <div className="card-body">
                                  <h6 className="card-title text-truncate" title={file.title}>{file.title}</h6>
                                  <p className="card-text text-muted small">
                                    {file.content?.substring(0, 60)}...
                                  </p>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      {formatFileSize(file.content?.length || 0)}
                                    </small>
                                    <button 
                                      className="btn btn-sm btn-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(file);
                                      }}
                                    >
                                      <i className="ri-download-line"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Render subfolders recursively */}
                  {children.length > 0 && (
                    <div className="mt-2">
                      {children.map(child => renderFolderTree(child, level + 1))}
                    </div>
                  )}
                </div>
              );
            };
            
            return renderFolderTree(folder, 0);
          })}
        </div>
      )}

      {shareData.files && shareData.files.length > 0 && (
        <div>
          <h5 className="mb-3">
            <i className="ri-file-text-line me-2"></i>
            Files ({shareData.files.length})
          </h5>
          <div className="row g-3">
            {shareData.files.map(file => (
              <div key={file._id} className="col-md-4">
                <div className="card h-100" style={{ cursor: 'pointer' }} onClick={() => setViewingFile(file)}>
                  <div className="card-body">
                    <h6 className="card-title">{file.title}</h6>
                    <p className="card-text text-muted small">
                      {file.content?.substring(0, 100)}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {formatFileSize(file.content?.length || 0)}
                      </small>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                      >
                        <i className="ri-download-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!shareData.files || shareData.files.length === 0) && 
       (!shareData.folders || shareData.folders.length === 0) && (
        <div className="text-center py-5 text-muted">
          <i className="ri-inbox-line" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">No content available in this share</p>
        </div>
      )}
    </div>
  );
};

export default SharedView;
