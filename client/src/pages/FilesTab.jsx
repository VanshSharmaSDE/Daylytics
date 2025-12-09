import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import { marked } from 'marked';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

const FilesTab = ({ dashboardLoading }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [newFile, setNewFile] = useState({ title: '', content: '' });
  const [newFolderName, setNewFolderName] = useState('');
  const [pinningFiles, setPinningFiles] = useState(() => new Set());
  const [pinningFolders, setPinningFolders] = useState(() => new Set());
  const [sortBy, setSortBy] = useState('updatedAt'); // Will be loaded from user settings
  const [sortOrder, setSortOrder] = useState('desc'); // Will be loaded from user settings
  const { addToast } = useToast();
  const hasLoadedInitially = useRef(false);
  const hasLoadedPreferences = useRef(false);
  const folderCache = useRef({});
  const fileCache = useRef({});

  // Formatting state for rich text editor
  const [formatMenu, setFormatMenu] = useState(false);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Sort files based on current sort settings
  const sortFiles = (filesToSort) => {
    return [...filesToSort].sort((a, b) => {
      // Pinned files always come first
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1;
      }

      let compareValue = 0;
      
      switch(sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          compareValue = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'updatedAt':
          compareValue = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case 'size':
          compareValue = (a.content?.length || 0) - (b.content?.length || 0);
          break;
        default:
          compareValue = new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  // Load user sorting preferences from database
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await api.get('/api/auth/me');
        const settings = response.data.settings || {};
        
        if (settings.fileSortBy) {
          setSortBy(settings.fileSortBy);
        }
        if (settings.fileSortOrder) {
          setSortOrder(settings.fileSortOrder);
        }
        hasLoadedPreferences.current = true;
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        hasLoadedPreferences.current = true;
      }
    };
    
    loadUserPreferences();
  }, []);

  // Save sorting preferences to database when they change
  useEffect(() => {
    // Don't save on initial load, only when user actively changes
    if (!hasLoadedPreferences.current) return;
    
    const savePreferences = async () => {
      try {
        await api.put('/api/auth/settings', {
          settings: {
            fileSortBy: sortBy,
            fileSortOrder: sortOrder
          }
        });
      } catch (error) {
        console.error('Failed to save sorting preferences:', error);
      }
    };
    
    savePreferences();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const folderKey = currentFolder || 'root';
    
    // Only fetch on initial mount
    if (!hasLoadedInitially.current) {
      hasLoadedInitially.current = true;
      setLoading(true);
      Promise.all([fetchFolders(), fetchFiles()])
        .finally(() => setLoading(false));
    } else if (folderCache.current[folderKey] && fileCache.current[folderKey]) {
      // Use cached data immediately - instant navigation!
      setFolders(folderCache.current[folderKey]);
      setFiles(fileCache.current[folderKey]);
    } else {
      // Fetch in parallel if not cached
      Promise.all([fetchFolders(), fetchFiles()]);
    }
  }, [currentFolder]);

  // Re-sort files when sort settings change
  useEffect(() => {
    if (files.length > 0) {
      setFiles(sortFiles(files));
    }
  }, [sortBy, sortOrder]);

  const fetchFolders = async () => {
    const folderKey = currentFolder || 'root';
    
    // Check cache first
    if (folderCache.current[folderKey]) {
      setFolders(folderCache.current[folderKey]);
      return;
    }
    
    try {
      const params = currentFolder ? { parentFolder: currentFolder } : {};
      const response = await api.get('/api/folders', { params });
      // Sort: pinned folders first, then by createdAt
      const sorted = response.data.sort((a, b) => {
        if (a.isPinned === b.isPinned) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.isPinned ? 1 : -1;
      });
      setFolders(sorted);
      // Cache the result
      folderCache.current[folderKey] = sorted;
    } catch (error) {
      addToast('error', 'Failed to load folders');
    }
  };

  const fetchFiles = async () => {
    const folderKey = currentFolder || 'root';
    
    // Check cache first
    if (fileCache.current[folderKey]) {
      setFiles(fileCache.current[folderKey]);
      return;
    }
    
    try {
      const params = { folder: currentFolder || 'null' };
      const response = await api.get('/api/files', { params });
      // Apply dynamic sorting
      const sorted = sortFiles(response.data);
      setFiles(sorted);
      // Cache the result
      fileCache.current[folderKey] = sorted;
    } catch (error) {
      addToast('error', 'Failed to load files');
    }
  };

  const handleCreateFile = async () => {
    if (!newFile.title.trim()) {
      addToast('error', 'Please enter a file title');
      return;
    }

    if (newFile.title.length > 200) {
      addToast('error', 'Title must be 200 characters or less');
      return;
    }

    if (newFile.content.length > 50000) {
      addToast('error', 'Content must be 50,000 characters or less');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationMessage('Creating your file...');
      // Automatically use current folder location
      const fileData = { ...newFile, folder: currentFolder || null };
      await api.post('/api/files', fileData);
      addToast('success', 'File created successfully');
      setShowCreateModal(false);
      setNewFile({ title: '', content: '' });
      // Clear cache and refetch
      const folderKey = currentFolder || 'root';
      fileCache.current[folderKey] = null;
      await fetchFiles();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to create file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleUpdateFile = async (id, updates) => {
    if (updates.title && updates.title.length > 200) {
      addToast('error', 'Title must be 200 characters or less');
      return;
    }

    if (updates.content && updates.content.length > 50000) {
      addToast('error', 'Content must be 50,000 characters or less');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationMessage('Updating your file...');
      await api.put(`/api/files/${id}`, updates);
      addToast('success', 'File updated successfully');
      setEditingFile(null);
      setViewingFile(updates);
      // Clear cache and refetch
      fileCache.current = {};
      await fetchFiles();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to update file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      setOperationLoading(true);
      setOperationMessage('Deleting your file...');
      await api.delete(`/api/files/${id}`);
      addToast('success', 'File deleted successfully');
      setViewingFile(null);
      setShowDeleteModal(false);
      // Clear cache and refetch
      const folderKey = currentFolder || 'root';
      fileCache.current[folderKey] = null;
      await fetchFiles();
    } catch (error) {
      addToast('error', 'Failed to delete file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      addToast('error', 'Please enter a folder name');
      return;
    }

    if (newFolderName.length > 100) {
      addToast('error', 'Folder name must be 100 characters or less');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationMessage('Creating folder...');
      await api.post('/api/folders', { name: newFolderName, parentFolder: currentFolder });
      addToast('success', 'Folder created successfully');
      setShowCreateFolderModal(false);
      setNewFolderName('');
      // Clear cache and refetch
      const folderKey = currentFolder || 'root';
      folderCache.current[folderKey] = null;
      await fetchFolders();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to create folder');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      setOperationLoading(true);
      setOperationMessage('Deleting folder...');
      await api.delete(`/api/folders/${folderId}`);
      addToast('success', 'Folder deleted successfully');
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
      // Clear all cache to refresh properly
      folderCache.current = {};
      fileCache.current = {};
      await Promise.all([fetchFolders(), fetchFiles()]);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to delete folder');
      // Close modal even on error so user isn't stuck
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const openFolder = async (folderId, folderName) => {
    setCurrentFolder(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
  };

  const navigateToFolder = (index) => {
    if (index === -1) {
      // Navigate to root
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const folder = folderPath[index];
      setCurrentFolder(folder.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };

  const handleToggleFolderPin = async (id) => {
    if (pinningFolders.has(id)) return;

    setPinningFolders((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await api.patch(`/api/folders/${id}/pin`);
      // Update local state immediately and reorder
      setFolders((prev) => {
        const updated = prev.map(f => f._id === id ? { ...f, isPinned: !f.isPinned } : f);
        // Sort: pinned folders first, then by createdAt
        return updated.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return b.isPinned ? 1 : -1;
        });
      });
    } catch (error) {
      addToast('error', 'Failed to toggle folder pin');
    } finally {
      setPinningFolders((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleTogglePin = async (id) => {
    if (pinningFiles.has(id)) return;

    setPinningFiles((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await api.patch(`/api/files/${id}/pin`);
      // Update local state immediately and reorder
      setFiles((prev) => {
        const updated = prev.map(f => f._id === id ? { ...f, isPinned: !f.isPinned } : f);
        // Sort: pinned files first, then by updatedAt
        return updated.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          }
          return b.isPinned ? 1 : -1;
        });
      });
    } catch (error) {
      addToast('error', 'Failed to toggle pin');
    } finally {
      setPinningFiles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Rich text formatting functions
  const insertFormatting = (textarea, before, after = '') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    return { newText, cursorPos: start + before.length + selectedText.length + after.length };
  };

  const applyFormat = (format, file, isEditing = false) => {
    const textarea = document.getElementById(isEditing ? 'edit-content' : 'create-content');
    if (!textarea) return;

    // Save scroll position BEFORE making changes
    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let before = '', after = '';
    
    switch(format) {
      case 'h1': before = '# '; break;
      case 'h2': before = '## '; break;
      case 'h3': before = '### '; break;
      case 'bold': before = '**'; after = '**'; break;
      case 'italic': before = '_'; after = '_'; break;
      case 'code': before = '`'; after = '`'; break;
      case 'codeblock': before = '```\n'; after = '\n```'; break;
      case 'link': before = '['; after = '](url)'; break;
      case 'list': before = '- '; break;
      case 'numlist': before = '1. '; break;
      case 'quote': before = '> '; break;
      case 'hr': before = '\n---\n'; break;
      case 'table':
        before = '\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n';
        break;
    }

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    const cursorPos = start + before.length + selectedText.length + after.length;
    
    if (isEditing) {
      setEditingFile({ ...editingFile, content: newText });
    } else {
      setNewFile({ ...newFile, content: newText });
    }
    
    // Restore scroll position and cursor after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.scrollTop = scrollTop; // Restore scroll position
    }, 0);
  };

  // Don't show FilesTab loader if Dashboard is already loading
  if (loading && !dashboardLoading) {
    return <Loader message='Loading Your Files & Folders...'/>;
  }

  if (operationLoading) {
    return <Loader message={operationMessage}/>;
  }

  return (
    <div className="files-tab">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Files</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => {
              // Clear cache and refetch
              folderCache.current = {};
              fileCache.current = {};
              setLoading(true);
              Promise.all([fetchFolders(), fetchFiles()])
                .finally(() => setLoading(false));
            }}
            title="Refresh files and folders"
          >
            <i className="ri-refresh-line"></i>
          </button>
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowCreateFolderModal(true)}
          >
            <i className="ri-folder-add-line me-2"></i>New Folder
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="ri-add-line me-2"></i>New File
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToFolder(-1); }}>
                <i className="ri-home-line me-1"></i>Root
              </a>
            </li>
            {folderPath.map((folder, index) => (
              <li 
                key={folder.id} 
                className={`breadcrumb-item ${index === folderPath.length - 1 ? 'active' : ''}`}
              >
                {index === folderPath.length - 1 ? (
                  folder.name
                ) : (
                  <a href="#" onClick={(e) => { e.preventDefault(); navigateToFolder(index); }}>
                    {folder.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Folders List */}
      {
      folders.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Folders</h5>
          <div className="row g-3">
            {folders.map((folder) => (
              <div key={folder._id} className="col-md-3 col-sm-6">
                <div className="card folder-card h-100">
                  <div className="card-body" onClick={() => openFolder(folder._id, folder.name)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <i className="ri-folder-fill text-warning" style={{ fontSize: '2rem' }}></i>
                      <div className="d-flex gap-1">
                        <button
                          className="file-pin-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFolderPin(folder._id);
                          }}
                          disabled={pinningFolders.has(folder._id)}
                          title={folder.isPinned ? 'Unpin folder' : 'Pin folder'}
                        >
                          {pinningFolders.has(folder._id) ? (
                            <div className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            <i className={folder.isPinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}></i>
                          )}
                        </button>
                        <button
                          className="file-pin-btn text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToDelete(folder);
                            setShowDeleteFolderModal(true);
                          }}
                          title="Delete folder"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                    <h6 className="mt-2 mb-0">{folder.name}</h6>
                    <small className="text-muted">
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length === 0 && folders.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="ri-file-line" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">No files or folders yet. Create your first one!</p>
        </div>
      ) : files.length > 0 ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Files</h5>
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted">Sort by:</small>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updatedAt">Last Modified</option>
                <option value="createdAt">Date Created</option>
                <option value="title">Name</option>
                <option value="size">Size</option>
              </select>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <i className={`ri-sort-${sortOrder === 'asc' ? 'asc' : 'desc'}`}></i>
              </button>
            </div>
          </div>
          <div className="row g-3">
          {files.map(file => (
            <div key={file._id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 file-card" onClick={() => setViewingFile(file)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0 file-title-truncate">{file.title}</h5>
                    <div className="d-flex gap-1">
                      <button
                        className="file-pin-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(file._id);
                        }}
                        disabled={pinningFiles.has(file._id)}
                        title={file.isPinned ? 'Unpin file' : 'Pin file'}
                      >
                        {pinningFiles.has(file._id) ? (
                          <div className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <i className={file.isPinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}></i>
                        )}
                      </button>
                      <button
                        className="file-pin-btn text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingFile(file);
                          setShowDeleteModal(true);
                        }}
                        title="Delete file"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                  <p className="card-text text-muted small file-preview-text">
                    {file.content.replace(/[#*`>\-\[\]]/g, '').substring(0, 100)}{file.content.length > 100 ? '...' : ''}
                  </p>
                  <div className="d-flex justify-content-between align-items-center text-muted small">
                    <span>
                      <i className="ri-time-line me-1"></i>
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="ri-file-text-line me-1"></i>
                      {formatFileSize(file.content?.length || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      ) : null}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(31, 35, 40, 0.18)', backdropFilter: 'blur(1px)' }}
          onClick={() => {
            setShowCreateFolderModal(false);
            setNewFolderName('');
          }}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Create New Folder</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Folder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter folder name (max 100 characters)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    maxLength={100}
                  />
                  <small className="text-muted">{newFolderName.length}/100</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }} disabled={operationLoading}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateFolder} disabled={operationLoading}>
                  {operationLoading ? 'Creating...' : <>Create <i className="ri-add-fill"></i></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(31, 35, 40, 0.18)', backdropFilter: 'blur(1px)' }}
          onClick={() => {
            setShowCreateModal(false);
            setNewFile({ title: '', content: '' });
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Create New File</h5>
                <div className='d-flex gap-2'>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCreateModal(false);
                  setNewFile({ title: '', content: '' });
                }} disabled={operationLoading}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateFile} disabled={operationLoading}>
                  {operationLoading ? 'Creating...' : <>Create <i className="ri-add-fill"></i></>}
                </button>
                </div>
              </div>
              <div className="modal-body">
        <div>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter file title (max 200 characters)"
                    value={newFile.title}
                    onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                    maxLength={200}
                  />
                  <small className="text-muted d-block">{newFile.title.length}/200</small>
                  {folderPath.length > 0 && (
                    <small className="text-info d-block mt-1">
                      <i className="ri-folder-line me-1"></i>
                      Creating in: {folderPath.map(f => f.name).join(' / ')}
                    </small>
                  )}
                  {folderPath.length === 0 && (
                    <small className="text-muted d-block mt-1">
                      <i className="ri-home-line me-1"></i>
                      Creating in: Root
                    </small>
                  )}
                </div>
                
                <div className="mb-3">
                  
                  {/* Rich Text Toolbar */}
                  <div className="toolbar mb-2 p-2 border rounded">
                    <div className="btn-group btn-group-sm me-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h1', newFile)} title="Heading 1">
                        <i className="ri-h-1"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h2', newFile)} title="Heading 2">
                        <i className="ri-h-2"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h3', newFile)} title="Heading 3">
                        <i className="ri-h-3"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('bold', newFile)} title="Bold">
                        <i className="ri-bold"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('italic', newFile)} title="Italic">
                        <i className="ri-italic"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('list', newFile)} title="Bullet List">
                        <i className="ri-list-unordered"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('numlist', newFile)} title="Numbered List">
                        <i className="ri-list-ordered"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('code', newFile)} title="Inline Code">
                        <i className="ri-code-line"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('codeblock', newFile)} title="Code Block">
                        <i className="ri-code-box-line"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('link', newFile)} title="Link">
                        <i className="ri-link"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('quote', newFile)} title="Quote">
                        <i className="ri-double-quotes-l"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('table', newFile)} title="Table">
                        <i className="ri-table-line"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('hr', newFile)} title="Horizontal Rule">
                        <i className="ri-separator"></i>
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    id="create-content"
                    className="form-control"
                    rows="18"
                    placeholder="Write your content here using markdown formatting..."
                    value={newFile.content}
                    onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                    maxLength={50000}
                  ></textarea>
                  <small className="text-muted">{newFile.content.length}/50,000</small>
                </div>
        </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit File Modal */}
      {viewingFile && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(31, 35, 40, 0.18)', backdropFilter: 'blur(1px)' }}
          onClick={() => {
            setViewingFile(null);
            setEditingFile(null);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                {editingFile ? (
                  <h5 className="modal-title">{editingFile.title}</h5>
                ) : (
                  <h5 className="modal-title">{viewingFile.title}</h5>
                )}
                <div className='d-flex gap-2 align-items-center'>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                  setViewingFile(null);
                  setEditingFile(null);
                }}>Close</button>
                  {editingFile ? (
                  <>
                  <button type="button" className="btn btn-primary" onClick={() => handleUpdateFile(editingFile._id, editingFile)} disabled={operationLoading}>
                      <i className="ri-save-line"></i> {operationLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setEditingFile(null)} disabled={operationLoading}>
                      <i className="ri-close-line"></i> Cancel
                    </button>
                  </>
                ) : (
                  <>
                   <button type="button" className="btn btn-primary" onClick={() => setEditingFile({ ...viewingFile })} disabled={operationLoading}>
                      <i className="ri-edit-line"></i> Edit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowDeleteModal(true)} disabled={operationLoading}>
                      <i className="ri-delete-bin-line"></i> Delete
                    </button>
                  </>
                )}
                </div>
              </div>
              <div className="modal-body">
        {viewingFile && (
          <div>
                {editingFile ? (
                  <>
                    {/* Title for Editing */}
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingFile.title}
                        onChange={(e) => setEditingFile({ ...editingFile, title: e.target.value })}
                        maxLength={200}
                      />
                      <small className="text-muted">{editingFile.title.length}/200</small>
                    </div>
                    {/* Rich Text Toolbar for Editing */}
                    <div className="toolbar mb-2 p-2 border rounded">
                      <div className="btn-group btn-group-sm me-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h1', editingFile, true)} title="Heading 1">
                          <i className="ri-h-1"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h2', editingFile, true)} title="Heading 2">
                          <i className="ri-h-2"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('h3', editingFile, true)} title="Heading 3">
                          <i className="ri-h-3"></i>
                        </button>
                      </div>
                      
                      <div className="btn-group btn-group-sm me-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('bold', editingFile, true)} title="Bold">
                          <i className="ri-bold"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('italic', editingFile, true)} title="Italic">
                          <i className="ri-italic"></i>
                        </button>
                      </div>
                      
                      <div className="btn-group btn-group-sm me-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('list', editingFile, true)} title="Bullet List">
                          <i className="ri-list-unordered"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('numlist', editingFile, true)} title="Numbered List">
                          <i className="ri-list-ordered"></i>
                        </button>
                      </div>
                      
                      <div className="btn-group btn-group-sm me-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('code', editingFile, true)} title="Inline Code">
                          <i className="ri-code-line"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('codeblock', editingFile, true)} title="Code Block">
                          <i className="ri-code-box-line"></i>
                        </button>
                      </div>
                      
                      <div className="btn-group btn-group-sm me-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('link', editingFile, true)} title="Link">
                          <i className="ri-link"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('quote', editingFile, true)} title="Quote">
                          <i className="ri-double-quotes-l"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('table', editingFile, true)} title="Table">
                          <i className="ri-table-line"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyFormat('hr', editingFile, true)} title="Horizontal Rule">
                          <i className="ri-separator"></i>
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      id="edit-content"
                      className="form-control"
                      rows="19"
                      value={editingFile.content}
                      onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                      maxLength={50000}
                    ></textarea>
                    <small className="text-muted">{editingFile.content.length}/50,000</small>
                  </>
                ) : (
                  <div className="file-content">
                    <div 
                      className="markdown-preview"
                      dangerouslySetInnerHTML={{ __html: marked(viewingFile.content) }}
                    />
                  </div>
                )}
          </div>
        )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete File?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={operationLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => handleDeleteFile(viewingFile._id)}
              disabled={operationLoading}
            >
              {operationLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">Are you sure you want to delete "{viewingFile?.title}"? This action cannot be undone.</p>
      </Modal>

      {/* Delete Folder Confirmation Modal */}
      <Modal
        open={showDeleteFolderModal}
        onClose={() => {
          setShowDeleteFolderModal(false);
          setFolderToDelete(null);
        }}
        title="Delete Folder?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => {
                setShowDeleteFolderModal(false);
                setFolderToDelete(null);
              }}
              disabled={operationLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => handleDeleteFolder(folderToDelete._id)}
              disabled={operationLoading}
            >
              {operationLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">Are you sure you want to delete folder "{folderToDelete?.name}"?</p>
        <p className="mb-0 text-warning"><small>Note: Folder must be empty (no files or subfolders) to be deleted.</small></p>
      </Modal>
    </div>
  );
};

export default FilesTab;
