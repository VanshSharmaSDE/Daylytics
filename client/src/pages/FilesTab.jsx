import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { marked } from 'marked';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import InfoTooltip from '../components/InfoTooltip';
import API from '../api';
import { useToast } from '../components/ToastProvider';

if (marked && typeof marked.setOptions === 'function') {
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  });
}

const FilesTab = () => {
  const {
    files,
    folders,
    folderPath,
    navigating,
    operationLoading,
    pinningFiles,
    pinningFolders,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    fetchFiles,
    fetchFolders,
    createFile,
    updateFile,
    deleteFile,
    togglePinFile,
    createFolder,
    deleteFolder,
    togglePinFolder,
    navigateToFolder,
    navigateToPath,
    uploadFileAttachments,
    deleteFileAttachment,
  } = useData();

  const { addToast } = useToast();

  const [editingFile, setEditingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [folderDeleteInfo, setFolderDeleteInfo] = useState({ loading: false, subfolderCount: 0, fileCount: 0 });
  const [newFile, setNewFile] = useState({ title: '', content: '' });
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [inlineImageUploading, setInlineImageUploading] = useState(false);
  const [inlineImageContext, setInlineImageContext] = useState(null);
  const [tableModalState, setTableModalState] = useState({ open: false, context: 'create', textareaRef: null });
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 2, includeHeader: true });
  const [spacingModalState, setSpacingModalState] = useState({ open: false, context: 'create', textareaRef: null });
  const [spacingValues, setSpacingValues] = useState({ margin: 16, padding: 16 });

  const createImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const createMarkdownTextareaRef = useRef(null);
  const editMarkdownTextareaRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${Math.round(value * 100) / 100} ${sizes[i]}`;
  };

  const sanitizeHTML = (html = '') => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('script').forEach((node) => node.remove());
    return temp.innerHTML;
  };

  const renderMarkdown = (value = '') => {
    if (!value) return '';
    if (typeof marked === 'function') {
      try {
        if (typeof marked.parse === 'function') {
          return marked.parse(value);
        }
        return marked(value);
      } catch (error) {
        console.error('Markdown render failed', error);
        return value;
      }
    }
    return value;
  };

  const getRenderableContent = (content = '') => {
    if (!content?.trim()) {
      return '<p class="text-muted">No content added yet.</p>';
    }
    const html = renderMarkdown(content);
    return sanitizeHTML(html);
  };

  const getContentLength = (content = '') => (content || '').length;

  const updateNewFileContent = (value) => {
    setNewFile((prev) => ({ ...prev, content: value }));
  };

  const updateEditingContent = (value) => {
    setEditingFile((prev) => (prev ? { ...prev, content: value } : prev));
  };

  const resetEditingState = () => {
    setEditingFile(null);
  };

  const beginEditingFile = (file) => {
    if (!file) return;
    setEditingFile({ ...file });
  };

  const insertMarkdownSnippet = (textareaRef, snippet, isEditing = false) => {
    const currentValue = isEditing ? editingFile?.content || '' : newFile.content || '';
    const textarea = textareaRef.current;
    const applyValue = (nextValue) => {
      if (isEditing) {
        setEditingFile((prev) => (prev ? { ...prev, content: nextValue } : prev));
      } else {
        setNewFile((prev) => ({ ...prev, content: nextValue }));
      }
    };

    if (!textarea) {
      applyValue(currentValue + snippet);
      return;
    }

    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? start;
    const nextValue = currentValue.slice(0, start) + snippet + currentValue.slice(end);
    applyValue(nextValue);

    setTimeout(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const buildTableMarkdown = (rows = 3, cols = 2, includeHeader = true) => {
    const safeRows = Math.max(1, rows);
    const safeCols = Math.max(1, cols);
    const headers = Array.from({ length: safeCols }, (_, index) => `Header ${index + 1}`);
    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${Array.from({ length: safeCols }, () => '---').join(' | ')} |`;
    const bodyRowCount = includeHeader ? Math.max(safeRows - 1, 1) : safeRows;
    const bodyLines = Array.from({ length: bodyRowCount }, (_, rowIndex) => {
      const cells = Array.from({ length: safeCols }, (_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`);
      return `| ${cells.join(' | ')} |`;
    });
    return `\n${headerLine}\n${separatorLine}\n${bodyLines.join('\n')}\n\n`;
  };

  const openTableModal = ({ context, textareaRef }) => {
    setTableConfig({ rows: 3, cols: 2, includeHeader: true });
    setTableModalState({ open: true, context, textareaRef });
  };

  const closeTableModal = () => {
    setTableModalState({ open: false, context: 'create', textareaRef: null });
  };

  const insertTableFromModal = () => {
    const { rows, cols, includeHeader } = tableConfig;
    if (rows < 1 || cols < 1) return;
    const { context, textareaRef } = tableModalState;

    if (textareaRef) {
      const markdown = buildTableMarkdown(rows, cols, includeHeader);
      insertMarkdownSnippet(textareaRef, markdown, context === 'edit');
    }

    closeTableModal();
  };

  const openSpacingModal = ({ context, textareaRef }) => {
    const currentContent = context === 'edit' ? editingFile?.content || '' : newFile.content || '';
    
    if (hasSpacingBlock(currentContent)) {
      const values = extractSpacingValues(currentContent);
      setSpacingValues(values);
    } else {
      setSpacingValues({ margin: 16, padding: 16 });
    }
    
    setSpacingModalState({ open: true, context, textareaRef });
  };

  const closeSpacingModal = () => {
    setSpacingModalState({ open: false, context: 'create', textareaRef: null });
    setSpacingValues({ margin: 16, padding: 16 });
  };

  const buildSpacingMarkdown = (marginValue, paddingValue, wrapExisting = false, existingContent = '') => {
    const safeMargin = Number.isFinite(marginValue) ? Math.max(0, marginValue) : 0;
    const safePadding = Number.isFinite(paddingValue) ? Math.max(0, paddingValue) : 0;
    const styleParts = [`margin: ${safeMargin}px`, `padding: ${safePadding}px`];
    
    if (wrapExisting && existingContent) {
      return `<div data-spacing-block="true" style="${styleParts.join('; ')}">
${existingContent}
</div>`;
    }
    
    return `<div data-spacing-block="true" style="${styleParts.join('; ')}">

<!-- Add your content here -->

</div>`;
  };

  const hasSpacingBlock = (content) => {
    return content.includes('data-spacing-block="true"');
  };

  const extractSpacingValues = (content) => {
    const match = content.match(/data-spacing-block="true"\s+style="([^"]+)"/);
    if (!match) return { margin: 16, padding: 16 };
    
    const style = match[1];
    const marginMatch = style.match(/margin:\s*(\d+)px/);
    const paddingMatch = style.match(/padding:\s*(\d+)px/);
    
    return {
      margin: marginMatch ? parseInt(marginMatch[1], 10) : 16,
      padding: paddingMatch ? parseInt(paddingMatch[1], 10) : 16
    };
  };

  const updateSpacingBlock = (content, newMargin, newPadding) => {
    const spacingRegex = /<div\s+data-spacing-block="true"\s+style="[^"]+">([\s\S]*?)<\/div>/;
    const match = content.match(spacingRegex);
    
    if (!match) return content;
    
    const innerContent = match[1];
    const newSpacing = buildSpacingMarkdown(newMargin, newPadding, true, innerContent);
    return content.replace(spacingRegex, newSpacing);
  };

  const applySpacingFromModal = () => {
    const { margin, padding } = spacingValues;
    const { context, textareaRef } = spacingModalState;
    const safeMargin = Number.isFinite(margin) ? margin : 0;
    const safePadding = Number.isFinite(padding) ? padding : 0;

    if (textareaRef) {
      const currentContent = context === 'edit' ? editingFile?.content || '' : newFile.content || '';
      
      if (hasSpacingBlock(currentContent)) {
        // Update existing spacing block
        const updatedContent = updateSpacingBlock(currentContent, safeMargin, safePadding);
        if (context === 'edit') {
          setEditingFile((prev) => (prev ? { ...prev, content: updatedContent } : prev));
        } else {
          setNewFile((prev) => ({ ...prev, content: updatedContent }));
        }
        addToast('success', 'Spacing updated');
      } else {
        // Insert new spacing block
        const snippet = buildSpacingMarkdown(safeMargin, safePadding);
        insertMarkdownSnippet(textareaRef, snippet, context === 'edit');
        addToast('success', 'Spacing added');
      }
    }

    closeSpacingModal();
  };

  const uploadInlineImage = async (file, fileId = null) => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please select a valid image file');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('error', 'Image size limit is 10MB');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (fileId) {
        formData.append('fileId', fileId);
      }
      const { data } = await API.post('/api/files/upload-inline', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (error) {
      addToast('error', 'Failed to upload image');
      return null;
    }
  };

  const triggerInlineImagePicker = (context) => {
    if (context === 'edit') {
      editImageInputRef.current?.click();
    } else {
      createImageInputRef.current?.click();
    }
  };

  const handleInlineImageSelection = async (event, context) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const fileId = context === 'edit' ? editingFile?._id : null;
    setInlineImageUploading(true);
    setInlineImageContext(context);
    const url = await uploadInlineImage(file, fileId);
    setInlineImageUploading(false);
    setInlineImageContext(null);
    if (!url) return;

    if (context === 'edit') {
      if (!editingFile) return;
      insertMarkdownSnippet(editMarkdownTextareaRef, `![image](${url})\n`, true);
    } else {
      insertMarkdownSnippet(createMarkdownTextareaRef, `![image](${url})\n`);
    }
  };

  const MarkdownHelperActions = ({ onTable, onImage, onSpacing, imageUploading, hasSpacing }) => (
    <div className="d-flex flex-wrap gap-2 mb-2">
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={onTable}>
        <i className="ri-table-line me-1"></i>
        Insert table
      </button>
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={onSpacing}>
        <i className="ri-focus-2-line me-1"></i>
        {hasSpacing ? 'Update spacing' : 'Add spacing'}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={onImage}
        disabled={imageUploading}
      >
        {imageUploading ? (
          <>
            <div className="spinner-border spinner-border-sm me-1" role="status" />
            Uploading...
          </>
        ) : (
          <>
            <i className="ri-image-add-line me-1"></i>
            Insert image
          </>
        )}
      </button>
    </div>
  );

  const handleCreateFile = async () => {
    const title = newFile.title.trim();
    if (!title) {
      addToast('error', 'Please enter a file title');
      return;
    }
    if (title.length > 200) {
      addToast('error', 'Title is too long (max 200 characters)');
      return;
    }
    if (getContentLength(newFile.content) > 50000) {
      addToast('error', 'Content is too long (max 50,000 characters)');
      return;
    }

    const success = await createFile(title, newFile.content || '');
    if (success) {
      setShowCreateModal(false);
      setNewFile({ title: '', content: '' });
    }
  };

  const handleUpdateFile = async (id, updates) => {
    if (!id || !updates) return;
    const payload = { ...updates };

    if (payload.title && payload.title.length > 200) {
      addToast('error', 'Title is too long (max 200 characters)');
      return;
    }

    if (typeof payload.content === 'string') {
      if (getContentLength(payload.content) > 50000) {
        addToast('error', 'Content is too long (max 50,000 characters)');
        return;
      }
    }

    const success = await updateFile(id, payload);
    if (success && editingFile?._id === id) {
      resetEditingState();
    }
  };

  const handleDeleteFile = async (id) => {
    const success = await deleteFile(id);
    if (success && editingFile?._id === id) {
      resetEditingState();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    if (newFolderName.length > 100) return;

    const success = await createFolder(newFolderName);
    if (success) {
      setShowCreateFolderModal(false);
      setNewFolderName('');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!folderId) {
      addToast('error', 'No folder selected');
      return false;
    }

    const success = await deleteFolder(folderId);
    if (success) {
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
      setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
    } else {
      // If server returned a 400, fetch latest counts to show why delete failed
      try {
        const [subRes, fileRes] = await Promise.all([
          API.get('/api/folders', { params: { parentFolder: folderId } }),
          API.get('/api/files', { params: { folder: folderId } }),
        ]);
        setFolderDeleteInfo({ loading: false, subfolderCount: (subRes.data || []).length, fileCount: (fileRes.data || []).length });
      } catch (e) {
        setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
      }
    }
    return success;
  };

  const handleToggleFolderPin = async (id) => {
    await togglePinFolder(id);
  };

  const handleTogglePin = async (id) => {
    await togglePinFile(id);
  };

  const openFolder = async (folderId, folderName) => {
    navigateToFolder(folderId, folderName);
  };

  const handleNavigatePath = (index) => {
    navigateToPath(index);
  };

  const handleAttachmentUpload = async (fileId, attachmentFiles) => {
    if (!attachmentFiles || attachmentFiles.length === 0) return;

    setUploadingAttachments(true);
    const result = await uploadFileAttachments(fileId, Array.from(attachmentFiles));
    setUploadingAttachments(false);

    if (result && viewingFile && viewingFile._id === fileId) {
      const updatedFile = files.find(f => f._id === fileId);
      if (updatedFile) {
        setViewingFile(updatedFile);
        if (editingFile && editingFile._id === fileId) {
          setEditingFile(updatedFile);
        }
      }
    }
  };

  const handleDeleteAttachment = async (fileId, attachmentId) => {
    const success = await deleteFileAttachment(fileId, attachmentId);
    
    if (success && viewingFile && viewingFile._id === fileId) {
      const updatedFile = files.find(f => f._id === fileId);
      if (updatedFile) {
        setViewingFile(updatedFile);
        if (editingFile && editingFile._id === fileId) {
          setEditingFile(updatedFile);
        }
      }
    }
  };

  const renderAttachment = (attachment) => {
    const isImage = attachment.mimeType?.startsWith('image/');
    const isVideo = attachment.mimeType?.startsWith('video/');
    const isPDF = attachment.mimeType === 'application/pdf';

    if (isImage) {
      return (
        <img 
          src={attachment.url} 
          alt={attachment.originalName}
          className="img-fluid rounded mb-2"
          style={{ maxHeight: '300px', objectFit: 'contain' }}
        />
      );
    } else if (isVideo) {
      return (
        <video 
          src={attachment.url} 
          controls
          className="w-100 rounded mb-2"
          style={{ maxHeight: '400px' }}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (isPDF) {
      return (
        <div className="border rounded p-3 mb-2">
          <i className="ri-file-pdf-line text-danger" style={{ fontSize: '2rem' }}></i>
          <p className="mb-0 mt-2">{attachment.originalName}</p>
        </div>
      );
    } else {
      return (
        <div className="border rounded p-3 mb-2">
          <i className="ri-file-line text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="mb-0 mt-2">{attachment.originalName}</p>
        </div>
      );
    }
  };

  // Add click handlers to markdown images for fullscreen view
  useEffect(() => {
    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG' && e.target.closest('.visual-preview')) {
        e.preventDefault();
        e.stopPropagation();
        setFullscreenImage(e.target.src);
      }
    };

    document.addEventListener('click', handleImageClick, true);
    return () => document.removeEventListener('click', handleImageClick, true);
  }, []);

  return (
    <>
      {navigating ? (
        <Loader message="Loading folder contents..." />
      ) : (
      <div className="files-tab">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h2 className="mb-0">My Files</h2>
          <InfoTooltip content={<div>
            <strong>Files & folders:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              <li>Files are Markdown documents with inline image support</li>
              <li>Folder deletion is blocked if it contains files or subfolders</li>
              <li>Title limit: 200 characters. Content limit: 50,000 characters.</li>
              <li>Uploads count towards per-user storage quota (default 100 MB)</li>
            </ul>
          </div>} className="ms-2" />
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowCreateFolderModal(true)}
          >
            <i className="ri-folder-add-line"></i><span className="d-none d-md-inline ms-2">New Folder</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="ri-add-line"></i><span className="d-none d-md-inline ms-2">New File</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigatePath(-1); }}>
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
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigatePath(index); }}>
                    {folder.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Folders List */}
      {folders.length > 0 && (
        <div className="mb-4">
          {folders.filter(f => f.isPinned).length > 0 && (
            <>
              <h5 className="mb-3">Pinned Folders</h5>
              <div className="row g-3 mb-3">
                {folders.filter(f => f.isPinned).map((folder) => (
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Prepare delete: fetch counts and show informative modal
                                setFolderToDelete(folder);
                                setFolderDeleteInfo({ loading: true, subfolderCount: 0, fileCount: 0 });
                                try {
                                  const [subRes, fileRes] = await Promise.all([
                                    API.get('/api/folders', { params: { parentFolder: folder._id } }),
                                    API.get('/api/files', { params: { folder: folder._id } }),
                                  ]);
                                  setFolderDeleteInfo({ loading: false, subfolderCount: (subRes.data || []).length, fileCount: (fileRes.data || []).length });
                                } catch (err) {
                                  setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
                                  addToast('error', 'Unable to verify folder contents');
                                }
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
            </>
          )}

          {folders.filter(f => !f.isPinned).length > 0 && (
            <>
              <h5 className="mb-3">Folders</h5>
              <div className="row g-3">
                {folders.filter(f => !f.isPinned).map((folder) => (
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Prepare delete: fetch counts and show informative modal
                                setFolderToDelete(folder);
                                setFolderDeleteInfo({ loading: true, subfolderCount: 0, fileCount: 0 });
                                try {
                                  const [subRes, fileRes] = await Promise.all([
                                    API.get('/api/folders', { params: { parentFolder: folder._id } }),
                                    API.get('/api/files', { params: { folder: folder._id } }),
                                  ]);
                                  setFolderDeleteInfo({ loading: false, subfolderCount: (subRes.data || []).length, fileCount: (fileRes.data || []).length });
                                } catch (err) {
                                  setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
                                  addToast('error', 'Unable to verify folder contents');
                                }
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
            </>
          )}
        </div>
      )}

      {/* Files and Folders List */}
      {files.length === 0 && folders.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="ri-file-line" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">No files or folders yet. Create your first one!</p>
        </div>
      ) : (
        <>
          {/* Files Section */}
          {files.length > 0 && (
            <div>

              {/* Pinned Files */}
              {files.filter(f => f.isPinned).length > 0 && (
                <>
                  <h5 className="mb-3">Pinned Files</h5>
                  <div className="row g-3 mb-4">
                    {files.filter(f => f.isPinned).map(file => (
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
                </>
              )}

              {/* Other Files */}
              {files.filter(f => !f.isPinned).length > 0 && (
                <>
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
                    {files.filter(f => !f.isPinned).map(file => (
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
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
      )}

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
                }} disabled={operationLoading}>
                  <i className="ri-close-line"></i>
                  <span className="d-none d-md-inline ms-2">Cancel</span>
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateFolder} disabled={operationLoading}>
                  {operationLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" />
                      <span className="d-none d-md-inline ms-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-add-fill"></i>
                      <span className="d-none d-md-inline ms-2">Create</span>
                    </>
                  )}
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
                }} disabled={operationLoading}>
                    <i className="ri-close-line"></i>
                    <span className="d-none d-md-inline ms-2">Cancel</span>
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleCreateFile} disabled={operationLoading}>
                    {operationLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm" role="status" />
                        <span className="d-none d-md-inline ms-2">Creating...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-add-fill"></i>
                        <span className="d-none d-md-inline ms-2">Create</span>
                      </>
                    )}
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
                  <label className="form-label">Content</label>
                  <MarkdownHelperActions
                    onTable={() => openTableModal({ context: 'create', textareaRef: createMarkdownTextareaRef })}
                    onSpacing={() => openSpacingModal({ context: 'create', textareaRef: createMarkdownTextareaRef })}
                    onImage={() => triggerInlineImagePicker('create')}
                    imageUploading={inlineImageUploading && inlineImageContext === 'create'}
                    hasSpacing={hasSpacingBlock(newFile.content || '')}
                  />
                  <textarea
                    ref={createMarkdownTextareaRef}
                    className="form-control"
                    rows="18"
                    placeholder="Write content using markdown syntax (supports headings, lists, code blocks, etc.)"
                    value={newFile.content}
                    onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                    maxLength={50000}
                  ></textarea>
                  <small className="text-muted d-block">
                    {getContentLength(newFile.content)} / 50,000 characters
                  </small>
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
            resetEditingState();
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
                  resetEditingState();
                }}>
                    <i className="ri-close-line"></i>
                    <span className="d-none d-md-inline ms-2">Close</span>
                  </button>
                  {editingFile ? (
                  <>
                  <button type="button" className="btn btn-primary" onClick={() => handleUpdateFile(editingFile._id, editingFile)} disabled={operationLoading}>
                      {operationLoading ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span className="d-none d-md-inline ms-2">Saving...</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line"></i>
                          <span className="d-none d-md-inline ms-2">Save</span>
                        </>
                      )}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={resetEditingState} disabled={operationLoading}>
                      <i className="ri-close-line"></i>
                      <span className="d-none d-md-inline ms-2">Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                   <button type="button" className="btn btn-primary" onClick={() => beginEditingFile(viewingFile)} disabled={operationLoading}>
                      <i className="ri-edit-line"></i>
                      <span className="d-none d-md-inline ms-2">Edit</span>
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowDeleteModal(true)} disabled={operationLoading}>
                      <i className="ri-delete-bin-line"></i>
                      <span className="d-none d-md-inline ms-2">Delete</span>
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
                    <div className="mb-3">
                      <label className="form-label">Content</label>
                      <MarkdownHelperActions
                        onTable={() => openTableModal({ context: 'edit', textareaRef: editMarkdownTextareaRef })}
                        onSpacing={() => openSpacingModal({ context: 'edit', textareaRef: editMarkdownTextareaRef })}
                        onImage={() => triggerInlineImagePicker('edit')}
                        imageUploading={inlineImageUploading && inlineImageContext === 'edit'}
                        hasSpacing={hasSpacingBlock(editingFile?.content || '')}
                      />
                      <textarea
                        ref={editMarkdownTextareaRef}
                        className="form-control"
                        rows="18"
                        placeholder="Edit content in raw markdown"
                        value={editingFile.content}
                        onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                        maxLength={50000}
                      ></textarea>
                      <small className="text-muted d-block">
                        {getContentLength(editingFile.content || '')} / 50,000 characters
                      </small>
                    </div>
                  </>
                ) : (
                  <div className="file-content">
                    <div 
                      className="markdown-preview markdown-body"
                      dangerouslySetInnerHTML={{ __html: getRenderableContent(viewingFile.content) }}
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
          setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
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
                setFolderDeleteInfo({ loading: false, subfolderCount: 0, fileCount: 0 });
              }}
              disabled={operationLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => { if (folderToDelete && folderToDelete._id) handleDeleteFolder(folderToDelete._id); }}
              disabled={operationLoading || !folderToDelete?._id || folderDeleteInfo.loading || folderDeleteInfo.subfolderCount > 0 || folderDeleteInfo.fileCount > 0}
            >
              {operationLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">Are you sure you want to delete folder "{folderToDelete?.name}"?</p>
        {folderDeleteInfo.loading ? (
          <p className="mb-0 text-muted"><small>Checking folder contents...</small></p>
        ) : folderDeleteInfo.subfolderCount > 0 || folderDeleteInfo.fileCount > 0 ? (
          <div className="mb-2">
            <p className="mb-0 text-danger"><small>Folder is not empty and cannot be deleted.</small></p>
            <p className="mb-0 text-muted"><small>{folderDeleteInfo.subfolderCount} subfolder(s), {folderDeleteInfo.fileCount} file(s)</small></p>
            <p className="mb-0 text-warning"><small>Delete or move contents first, then try again.</small></p>
          </div>
        ) : (
          <p className="mb-0 text-muted"><small>Folder is empty and ready to be deleted.</small></p>
        )}
      </Modal>

      <Modal
        open={tableModalState.open}
        onClose={closeTableModal}
        title="Insert Table"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button type="button" className="btn btn-outline-secondary" onClick={closeTableModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={insertTableFromModal}
              disabled={tableConfig.rows < 1 || tableConfig.cols < 1}
            >
              Insert table
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <label className="form-label">Total rows (include header)</label>
            <input
              type="number"
              className="form-control"
              min="1"
              value={tableConfig.rows}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setTableConfig((prev) => ({ ...prev, rows: Number.isNaN(value) ? 1 : Math.max(1, value) }));
              }}
            />
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label">Columns</label>
            <input
              type="number"
              className="form-control"
              min="1"
              value={tableConfig.cols}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setTableConfig((prev) => ({ ...prev, cols: Number.isNaN(value) ? 1 : Math.max(1, value) }));
              }}
            />
          </div>
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="includeTableHeader"
                checked={tableConfig.includeHeader}
                onChange={(e) => setTableConfig((prev) => ({ ...prev, includeHeader: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="includeTableHeader">
                Include header row
              </label>
            </div>
            <small className="text-muted">You can add or delete rows later while editing.</small>
          </div>
        </div>
      </Modal>

      <Modal
        open={spacingModalState.open}
        onClose={closeSpacingModal}
        title="Add Margin & Padding"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button type="button" className="btn btn-outline-secondary" onClick={closeSpacingModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={applySpacingFromModal}>
              Apply spacing
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <label className="form-label">Margin (px)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={spacingValues.margin}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setSpacingValues((prev) => ({ ...prev, margin: Number.isNaN(value) ? 0 : Math.max(0, value) }));
              }}
            />
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label">Padding (px)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={spacingValues.padding}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setSpacingValues((prev) => ({ ...prev, padding: Number.isNaN(value) ? 0 : Math.max(0, value) }));
              }}
            />
          </div>
          <div className="col-12">
            <small className="text-muted d-block">Spacing wraps your selected content inside a div with margin/padding styles.</small>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fullscreen-image-overlay" 
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'pointer',
            padding: '20px'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(null);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 100000,
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            <i className="ri-close-line"></i>
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen view"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={createImageInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleInlineImageSelection(e, 'create')}
      />
      <input
        type="file"
        accept="image/*"
        ref={editImageInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleInlineImageSelection(e, 'edit')}
      />
    </>
  );
};

export default FilesTab;