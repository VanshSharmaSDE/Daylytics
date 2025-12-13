import React, { useState, useRef, useEffect } from 'react';

const FileEditor = ({ file, onSave, onCancel, isCreating = false }) => {
  const [title, setTitle] = useState(file?.title || '');
  const [content, setContent] = useState(file?.content || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    setSaving(true);
    await onSave({ title: title.trim(), content });
    setSaving(false);
  };

  const applyFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const cursorPos = start;
    const scrollTop = textarea.scrollTop;

    let newText = content;
    let newCursorPos = cursorPos;

    switch (format) {
      case 'h1':
        newText = content.substring(0, start) + '# ' + selectedText + content.substring(end);
        newCursorPos = start + 2;
        break;
      case 'h2':
        newText = content.substring(0, start) + '## ' + selectedText + content.substring(end);
        newCursorPos = start + 3;
        break;
      case 'h3':
        newText = content.substring(0, start) + '### ' + selectedText + content.substring(end);
        newCursorPos = start + 4;
        break;
      case 'bold':
        newText = content.substring(0, start) + '**' + selectedText + '**' + content.substring(end);
        newCursorPos = start + 2;
        break;
      case 'italic':
        newText = content.substring(0, start) + '_' + selectedText + '_' + content.substring(end);
        newCursorPos = start + 1;
        break;
      case 'code':
        newText = content.substring(0, start) + '`' + selectedText + '`' + content.substring(end);
        newCursorPos = start + 1;
        break;
      case 'link':
        newText = content.substring(0, start) + '[' + selectedText + '](url)' + content.substring(end);
        newCursorPos = start + selectedText.length + 3;
        break;
      case 'bullet':
        newText = content.substring(0, start) + '- ' + selectedText + content.substring(end);
        newCursorPos = start + 2;
        break;
      case 'number':
        newText = content.substring(0, start) + '1. ' + selectedText + content.substring(end);
        newCursorPos = start + 3;
        break;
      case 'quote':
        newText = content.substring(0, start) + '> ' + selectedText + content.substring(end);
        newCursorPos = start + 2;
        break;
      default:
        return;
    }

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  return (
    <div className="file-editor h-100 d-flex flex-column">
      {/* Header */}
      <div className="file-editor-header mb-3 pb-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">
            {isCreating ? 'Create New File' : 'Edit File'}
          </h3>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              <i className="ri-close-line me-2"></i>Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-save-line me-2"></i>Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-3">
          <label className="form-label fw-bold">File Title</label>
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Enter file title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={saving}
          />
          <small className="text-muted">{title.length}/200 characters</small>
        </div>

        {/* Formatting Toolbar */}
        <div className="toolbar d-flex flex-wrap gap-1 mb-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('h1')} title="Heading 1" disabled={saving}>
            <i className="ri-h-1"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('h2')} title="Heading 2" disabled={saving}>
            <i className="ri-h-2"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('h3')} title="Heading 3" disabled={saving}>
            <i className="ri-h-3"></i>
          </button>
          <div className="vr"></div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('bold')} title="Bold" disabled={saving}>
            <i className="ri-bold"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('italic')} title="Italic" disabled={saving}>
            <i className="ri-italic"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('code')} title="Code" disabled={saving}>
            <i className="ri-code-line"></i>
          </button>
          <div className="vr"></div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('link')} title="Link" disabled={saving}>
            <i className="ri-link"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('bullet')} title="Bullet List" disabled={saving}>
            <i className="ri-list-unordered"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('number')} title="Numbered List" disabled={saving}>
            <i className="ri-list-ordered"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => applyFormat('quote')} title="Quote" disabled={saving}>
            <i className="ri-double-quotes-l"></i>
          </button>
        </div>
      </div>

      {/* Content Editor */}
      <div className="file-editor-content flex-grow-1">
        <label className="form-label fw-bold">Content (Markdown)</label>
        <textarea
          ref={textareaRef}
          className="form-control font-monospace"
          style={{ 
            height: 'calc(100% - 30px)', 
            resize: 'none',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
          placeholder="Write your content in Markdown..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={saving}
        />
      </div>
    </div>
  );
};

export default FileEditor;
