import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useToast } from './ToastProvider';
import Modal from './Modal';

const SearchModal = ({ open, onClose, onSelectFile, onSelectFolder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allData, setAllData] = useState({ files: [], folders: [] });
  const [filteredResults, setFilteredResults] = useState({ files: [], folders: [] });
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { addToast } = useToast();
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (open && !dataLoaded) {
      fetchAllData();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredResults({ files: [], folders: [] });
      return;
    }

    const query = searchQuery.trim().toLowerCase();

    const matchedFiles = allData.files.filter(file => 
      file.title?.toLowerCase().includes(query)
    ).slice(0, 10);

    const matchedFolders = allData.folders.filter(folder => 
      folder.name?.toLowerCase().includes(query)
    ).slice(0, 10);

    setFilteredResults({
      files: matchedFiles,
      folders: matchedFolders
    });
  }, [searchQuery, allData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch files and folders in parallel
      const [filesResponse, foldersResponse] = await Promise.all([
        api.get('/api/files').catch(() => ({ data: [] })),
        api.get('/api/folders').catch(() => ({ data: [] }))
      ]);

      setAllData({
        files: filesResponse.data,
        folders: foldersResponse.data
      });
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load search data:', error);
      addToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file) => {
    onSelectFile(file);
    onClose();
    setSearchQuery('');
  };

  const handleFolderClick = (folder) => {
    onSelectFolder(folder._id, folder.name);
    onClose();
    setSearchQuery('');
  };

  const totalResults = filteredResults.files.length + filteredResults.folders.length;

  return (
    <Modal
      open={open}
      title="Search Files & Folders"
      onClose={() => {
        onClose();
        setSearchQuery('');
      }}
    >
      <div className="search-modal-content">
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0">
              <i className="ri-search-line"></i>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted small mt-2">Loading search data...</p>
          </div>
        )}

        {!loading && searchQuery.trim().length > 0 && totalResults === 0 && (
          <div className="text-center py-4">
            <i className="ri-search-line text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <p className="text-muted mt-2">No results found for "{searchQuery}"</p>
          </div>
        )}

        {!loading && totalResults > 0 && (
          <div className="search-results" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {/* Files */}
            {filteredResults.files.length > 0 && (
              <div className="mb-3">
                <h6 className="text-muted small fw-semibold mb-2">
                  <i className="ri-file-text-line me-2"></i>
                  FILES ({filteredResults.files.length})
                </h6>
                <div className="list-group">
                  {filteredResults.files.map(file => (
                    <button
                      key={file._id}
                      className="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2"
                      onClick={() => handleFileClick(file)}
                    >
                      <i className="ri-file-text-line text-primary"></i>
                      <div className="flex-grow-1">
                        <div>{file.title}</div>
                        <small className="text-muted">
                          Updated {new Date(file.updatedAt).toLocaleDateString()}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Folders */}
            {filteredResults.folders.length > 0 && (
              <div className="mb-3">
                <h6 className="text-muted small fw-semibold mb-2">
                  <i className="ri-folder-4-line me-2"></i>
                  FOLDERS ({filteredResults.folders.length})
                </h6>
                <div className="list-group">
                  {filteredResults.folders.map(folder => (
                    <button
                      key={folder._id}
                      className="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <i className="ri-folder-4-fill" style={{ color: '#f9c74f' }}></i>
                      <span>{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && searchQuery.trim().length === 0 && (
          <div className="text-center py-4">
            <i className="ri-search-2-line text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <p className="text-muted mt-2">Type to search across files and folders</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchModal;
