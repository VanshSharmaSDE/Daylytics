import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { marked } from 'marked';
import API from '../api';
import Loader from '../components/Loader';

if (marked && typeof marked.setOptions === 'function') {
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  });
}

const SharedFile = () => {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sharedFileTheme') || 'dark';
  });

  useEffect(() => {
    fetchSharedFile();
  }, [token]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sharedFileTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchSharedFile = async () => {
    try {
      const { data } = await API.get(`/api/shared/${token}`);
      setFile(data);
    } catch (err) {
      console.error('Error fetching shared file:', err);
      setError(err?.response?.data?.msg || 'File not found or link expired');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading shared file..." />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="card text-center py-5" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
          <div className="card-body">
            <i className="ri-file-forbid-line" style={{ fontSize: '4rem', color: 'var(--danger)' }}></i>
            <h3 className="mt-4 mb-3">File Not Available</h3>
            <p className="text-muted mb-4">{error}</p>
            <p className="text-muted small mb-4">
              This file may have been deleted, the sharing link may have been revoked, or the link has expired.
            </p>
            <a href="/" className="btn btn-primary">
              <i className="ri-home-line me-2"></i>
              Go to Daylytics
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
        <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="ri-share-line" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
            <span className="text-muted">Shared File</span>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <i className={`ri-${theme === 'dark' ? 'sun' : 'moon'}-line`}></i>
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">{file?.title}</h4>
              <small className="text-muted">
                Shared file • Last updated: {new Date(file?.updatedAt).toLocaleDateString()}
              </small>
            </div>
            <div>
              <a href="/" className="btn btn-outline-primary btn-sm">
                <i className="ri-home-line me-2"></i>
                Go to Daylytics
              </a>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div
            className="markdown-preview markdown-body visual-preview"
            dangerouslySetInnerHTML={{ __html: marked(file?.content || '') }}
          />
        </div>
        <div className="card-footer text-center" style={{ background: 'var(--panel)', borderTop: '1px solid var(--border)' }}>
          <small className="text-muted">
            <i className="ri-lock-unlock-line me-1"></i>
            This is a publicly shared file. Anyone with the link can view it.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SharedFile;
