import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import Modal from '../components/Modal';
import { FilesLoader, ProgressBar } from '../components/LoadingStates';
import FileViewer from '../components/FileViewer';
import FileEditor from '../components/FileEditor';
import ShareManager from '../components/ShareManager';
import SearchModal from '../components/SearchModal';

const FilesTab = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState('');
  const [hasLoadedData, setHasLoadedData] = useState(false);
  
  // Screen states: 'list' | 'view' | 'edit' | 'create'
  const [screenMode, setScreenMode] = useState('list');
  const [currentFile, setCurrentFile] = useState(null);
  
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showShareManager, setShowShareManager] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [pinningFiles, setPinningFiles] = useState(() => new Set());
  const [pinningFolders, setPinningFolders] = useState(() => new Set());
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { addToast } = useToast();
  const hasLoadedPreferences = useRef(false);

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
    const loadData = async () => {
      if (initialLoading) {
        await Promise.all([fetchFolders(), fetchFiles()]);
        setInitialLoading(false);
        setHasLoadedData(true);
      } else {
        setFetchingData(true);
        await Promise.all([fetchFolders(), fetchFiles()]);
        setFetchingData(false);
      }
    };
    loadData();
  }, [currentFolder]);

  // Re-sort files when sort settings change
  useEffect(() => {
    if (files.length > 0) {
      setFiles(sortFiles(files));
    }
  }, [sortBy, sortOrder]);

  const fetchFolders = async () => {
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
    } catch (error) {
      addToast('error', 'Failed to load folders');
    }
  };

  const fetchFiles = async () => {
    try {
      const params = { folder: currentFolder || 'null' };
      const response = await api.get('/api/files', { params });
      // Apply dynamic sorting
      const sorted = sortFiles(response.data);
      setFiles(sorted);
    } catch (error) {
      addToast('error', 'Failed to load files');
    }
  };

  const handleCreateFile = async (fileData) => {
    if (!fileData.title.trim()) {
      addToast('error', 'Please enter a file title');
      return;
    }

    if (fileData.title.length > 200) {
      addToast('error', 'Title must be 200 characters or less');
      return;
    }

    if (fileData.content.length > 50000) {
      addToast('error', 'Content must be 50,000 characters or less');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationMessage('Creating your file...');
      // Automatically use current folder location
      const newFileData = { ...fileData, folder: currentFolder || null };
      await api.post('/api/files', newFileData);
      addToast('success', 'File created successfully');
      setScreenMode('list');
      setCurrentFile(null);
      await fetchFiles();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to create file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleUpdateFile = async (fileData) => {
    if (fileData.title && fileData.title.length > 200) {
      addToast('error', 'Title must be 200 characters or less');
      return;
    }

    if (fileData.content && fileData.content.length > 50000) {
      addToast('error', 'Content must be 50,000 characters or less');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationMessage('Updating your file...');
      await api.put(`/api/files/${currentFile._id}`, fileData);
      addToast('success', 'File updated successfully');
      setScreenMode('view');
      // Refresh the current file data
      const response = await api.get(`/api/files/${currentFile._id}`);
      setCurrentFile(response.data);
      await fetchFiles();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to update file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const handleDeleteFile = async () => {
    try {
      setOperationLoading(true);
      setOperationMessage('Deleting your file...');
      await api.delete(`/api/files/${currentFile._id}`);
      addToast('success', 'File deleted successfully');
      setScreenMode('list');
      setCurrentFile(null);
      setShowDeleteModal(false);
      await fetchFiles();
    } catch (error) {
      addToast('error', 'Failed to delete file');
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  // Screen navigation handlers
  const handleViewFile = (file) => {
    setCurrentFile(file);
    setScreenMode('view');
  };

  const handleEditFile = () => {
    setScreenMode('edit');
  };

  const handleCreateNewFile = () => {
    setCurrentFile(null);
    setScreenMode('create');
  };

  const handleBackToList = () => {
    setScreenMode('list');
    setCurrentFile(null);
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

  // Show initial loader when first loading
  if (initialLoading) {
    return <FilesLoader />;
  }

  if (operationLoading) {
    return <FilesLoader message={operationMessage}/>;
  }

  // Render different screens based on mode
  if (screenMode === 'view' && currentFile) {
    return (
      <FileViewer
        file={currentFile}
        onEdit={handleEditFile}
        onDelete={() => setShowDeleteModal(true)}
        onBack={handleBackToList}
      />
    );
  }

  if (screenMode === 'edit' && currentFile) {
    return (
      <FileEditor
        file={currentFile}
        onSave={handleUpdateFile}
        onCancel={handleBackToList}
        isCreating={false}
      />
    );
  }

  if (screenMode === 'create') {
    return (
      <FileEditor
        file={{ title: '', content: '' }}
        onSave={handleCreateFile}
        onCancel={handleBackToList}
        isCreating={true}
      />
    );
  }

  // Default: show file list
  return (
    <div className="files-tab h-100">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My Files</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={async () => {
              setInitialLoading(true);
              await Promise.all([fetchFolders(), fetchFiles()]);
              setInitialLoading(false);
            }}
            title="Refresh files and folders"
            disabled={initialLoading}
          >
            <i className="ri-refresh-line"></i>
          </button>
          <button 
            className="btn btn-outline-secondary d-flex align-items-center"
            onClick={() => setShowSearchModal(true)}
            aria-label="Search"
            title="Search files, folders, and tasks"
          >
            <i className="ri-search-line me-sm-2" aria-hidden="true"></i>
            <span className="d-none d-sm-inline">Search</span>
          </button>
          <button 
            className="btn btn-outline-info d-flex align-items-center"
            onClick={() => setShowShareManager(true)}
            aria-label="Share"
          >
            <i className="ri-share-line me-sm-2" aria-hidden="true"></i>
            <span className="d-none d-sm-inline">Share</span>
          </button>
          <button 
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={() => setShowCreateFolderModal(true)}
            aria-label="New folder"
          >
            <i className="ri-folder-add-line me-sm-2" aria-hidden="true"></i>
            <span className="d-none d-sm-inline">New Folder</span>
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center"
            onClick={handleCreateNewFile}
            aria-label="New file"
          >
            <i className="ri-add-line me-sm-2" aria-hidden="true"></i>
            <span className="d-none d-sm-inline">New File</span>
          </button>
        </div>
      </div>

      {/* GitHub-style Progress Bar */}
      {fetchingData && <ProgressBar />}

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
      <div className={fetchingData ? 'content-blur' : ''}>
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
      {hasLoadedData && !fetchingData && files.length === 0 && folders.length === 0 ? (
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
              <div className="card h-100 file-card" onClick={() => handleViewFile(file)}>
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
                          setCurrentFile(file);
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
      </div>

      <Modal
        open={showCreateFolderModal}
        onClose={() => {
          if (operationLoading) return;
          setShowCreateFolderModal(false);
          setNewFolderName('');
        }}
        title="Create New Folder"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setShowCreateFolderModal(false);
                setNewFolderName('');
              }}
              disabled={operationLoading}
              data-autofocus
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateFolder}
              disabled={operationLoading}
            >
              {operationLoading ? 'Creating...' : <>Create <i className="ri-add-fill"></i></>}
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label className="form-label">Folder Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter folder name (max 100 characters)"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            maxLength={100}
            data-autofocus
          />
          <small className="text-muted">{newFolderName.length}/100</small>
        </div>
      </Modal>

      {/* Delete File Confirmation Modal */}
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
              onClick={handleDeleteFile}
              disabled={operationLoading}
            >
              {operationLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">Are you sure you want to delete "{currentFile?.title}"? This action cannot be undone.</p>
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

      {/* Share Manager */}
      {showShareManager && (
        <ShareManager
          files={files}
          folders={folders}
          onClose={() => setShowShareManager(false)}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectFile={handleViewFile}
        onSelectFolder={openFolder}
      />
    </div>
  );
};

export default FilesTab;
