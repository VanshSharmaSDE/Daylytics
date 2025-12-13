import React from 'react';
import { marked } from 'marked';

const FileViewer = ({ file, onEdit, onDelete, onBack }) => {
  const renderMarkdown = (content) => {
    return { __html: marked(content || '') };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-viewer h-100 d-flex flex-column">
      {/* Header */}
      <div className="file-viewer-header d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn btn-outline-secondary"
            onClick={onBack}
            title="Back to files"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
          <div>
            <h3 className="mb-1">{file.title}</h3>
            <div className="text-muted small">
              <span className="me-3">
                <i className="ri-time-line me-1"></i>
                Modified: {new Date(file.updatedAt).toLocaleString()}
              </span>
              <span>
                <i className="ri-file-text-line me-1"></i>
                {formatFileSize(file.content?.length || 0)}
              </span>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={onEdit}
          >
            <i className="ri-edit-line me-2"></i>Edit
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={onDelete}
          >
            <i className="ri-delete-bin-line me-2"></i>Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="file-viewer-content flex-grow-1 overflow-auto">
        <div 
          className="markdown-preview p-4 rounded shadow-sm"
          dangerouslySetInnerHTML={renderMarkdown(file.content)}
        />
      </div>
    </div>
  );
};

export default FileViewer;
