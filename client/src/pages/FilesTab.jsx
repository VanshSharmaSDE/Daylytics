import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { marked } from 'marked';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import API from '../api';
import { useToast } from '../components/ToastProvider';

const DELETE_OVERLAY_DEFAULT = { visible: false, top: 0, left: 0, target: null, editorRef: null, updater: null };

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
  const [createEditorMode, setCreateEditorMode] = useState('visual');
  const [editEditorMode, setEditEditorMode] = useState('visual');
  const [editingHtmlInitialized, setEditingHtmlInitialized] = useState(false);
  const [createHtmlInitialized, setCreateHtmlInitialized] = useState(false);
  const [inlineImageUploading, setInlineImageUploading] = useState(false);
  const [inlineImageContext, setInlineImageContext] = useState(null);
  const [linkModalState, setLinkModalState] = useState({ open: false, editorRef: null, updater: null });
  const [linkUrl, setLinkUrl] = useState('');
  const [tableModalState, setTableModalState] = useState({ open: false, mode: 'visual', context: 'create', editorRef: null, textareaRef: null, updater: null });
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 2, includeHeader: true });
  const [spacingModalState, setSpacingModalState] = useState({ open: false, mode: 'visual', context: 'create', editorRef: null, textareaRef: null, updater: null });
  const [spacingValues, setSpacingValues] = useState({ margin: 16, padding: 16 });
  const [deleteOverlay, setDeleteOverlay] = useState(DELETE_OVERLAY_DEFAULT);

  const createEditorRef = useRef(null);
  const editEditorRef = useRef(null);
  const createImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const createMarkdownTextareaRef = useRef(null);
  const editMarkdownTextareaRef = useRef(null);
  const linkSelectionRef = useRef(null);
  const tableSelectionRef = useRef(null);
  const spacingSelectionRef = useRef(null);
  const overlayHoverRef = useRef(false);
  const overlayHideTimeoutRef = useRef(null);

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

  const getPlainTextLength = (html = '') => {
    if (typeof window === 'undefined') return html?.length || 0;
    const temp = document.createElement('div');
    temp.innerHTML = html || '';
    return temp.textContent?.length || 0;
  };

  const isHTMLContent = (content = '') => /<\/?[a-z][\s\S]*>/i.test(content.trim());

  const escapeHTML = (value = '') =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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

  const DELETABLE_SELECTORS = 'table, pre, blockquote, ul, ol, img, div[data-spacing-block]';

  const applyAnchorAttributes = (editorRef) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection) return;
    let node = selection.focusNode;
    if (!node) return;
    if (typeof Node !== 'undefined' && node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    const anchor = node?.closest('a');
    if (anchor) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  };

  const getRenderableContent = (content = '') => {
    if (!content?.trim()) {
      return '<p class="text-muted">No content added yet.</p>';
    }
    const html = renderMarkdown(content);
    return sanitizeHTML(html);
  };

  const getEditorReadyHTML = (content = '') => {
    if (!content?.trim()) return '';
    const html = isHTMLContent(content) ? content : renderMarkdown(content);
    return sanitizeHTML(html);
  };

  const getContentLength = (content = '', mode = 'visual') => (
    mode === 'visual' ? getPlainTextLength(content || '') : (content || '').length
  );

  const determineModeForContent = (content = '') => (isHTMLContent(content) ? 'visual' : 'markdown');

  const updateNewFileContent = (value) => {
    setNewFile((prev) => ({ ...prev, content: value }));
  };

  const updateEditingContent = (value) => {
    setEditingFile((prev) => (prev ? { ...prev, content: value } : prev));
  };

  const resetEditingState = () => {
    setEditingFile(null);
    setEditingHtmlInitialized(false);
    setEditEditorMode('visual');
    if (editEditorRef.current) {
      editEditorRef.current.innerHTML = '';
    }
  };

  const beginEditingFile = (file) => {
    if (!file) return;
    const mode = determineModeForContent(file.content || '');
    setEditEditorMode(mode);
    setEditingHtmlInitialized(false);
    setEditingFile({ ...file });
  };

  const handleVisualInput = (ref, updater) => {
    if (!ref.current) return;
    const sanitized = sanitizeHTML(ref.current.innerHTML);
    updater(sanitized);
  };

  const execEditorCommand = (command, value, ref, updater) => {
    if (!ref.current) return;
    ref.current.focus();

    if (command === 'createLink') {
      openLinkModal(ref, updater);
      return;
    }

    if (command === 'formatBlock') {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, value);
    }

    handleVisualInput(ref, updater);
  };

  const insertInlineCode = (editorRef, updater) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const text = selection?.toString() || 'inline code';
    const html = `<code>${escapeHTML(text)}</code>`;
    document.execCommand('insertHTML', false, html);
    handleVisualInput(editorRef, updater);
  };

  const insertCodeBlock = (editorRef, updater) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const text = selection?.toString() || 'const example = true;';
    const html = `<pre><code>${escapeHTML(text)}</code></pre><p></p>`;
    document.execCommand('insertHTML', false, html);
    handleVisualInput(editorRef, updater);
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

  const buildTableHTML = (rows = 3, cols = 2, includeHeader = true) => {
    const safeRows = Math.max(1, rows);
    const safeCols = Math.max(1, cols);
    const headerCells = Array.from({ length: safeCols }, (_, index) => `<th>Header ${index + 1}</th>`).join('');
    const thead = includeHeader ? `<thead><tr>${headerCells}</tr></thead>` : '';
    const bodyRowCount = includeHeader ? Math.max(safeRows - 1, 1) : safeRows;
    const tbodyRows = Array.from({ length: bodyRowCount }, (_, rowIndex) => {
      const cells = Array.from({ length: safeCols }, (_, colIndex) => `<td>Cell ${rowIndex + 1}-${colIndex + 1}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="table table-bordered">${thead}<tbody>${tbodyRows}</tbody></table><p></p>`;
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

  const openTableModal = ({ mode, context, editorRef, textareaRef, updater }) => {
    if (mode === 'visual' && editorRef?.current && typeof window !== 'undefined') {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        tableSelectionRef.current = selection.getRangeAt(0);
      } else {
        tableSelectionRef.current = null;
      }
    } else {
      tableSelectionRef.current = null;
    }

    setTableConfig({ rows: 3, cols: 2, includeHeader: true });
    setTableModalState({ open: true, mode, context, editorRef, textareaRef, updater });
  };

  const closeTableModal = () => {
    setTableModalState({ open: false, mode: 'visual', context: 'create', editorRef: null, textareaRef: null, updater: null });
    tableSelectionRef.current = null;
  };

  const insertTableFromModal = () => {
    const { rows, cols, includeHeader } = tableConfig;
    if (rows < 1 || cols < 1) return;
    const { mode, context, editorRef, textareaRef, updater } = tableModalState;

    if (mode === 'visual') {
      if (!editorRef?.current || typeof window === 'undefined') {
        closeTableModal();
        return;
      }
      editorRef.current.focus();
      const selection = window.getSelection();
      if (tableSelectionRef.current && selection) {
        selection.removeAllRanges();
        selection.addRange(tableSelectionRef.current);
      }
      const html = buildTableHTML(rows, cols, includeHeader);
      document.execCommand('insertHTML', false, html);
      const changeHandler = updater || (context === 'edit' ? updateEditingContent : updateNewFileContent);
      handleVisualInput(editorRef, changeHandler);
    } else if (textareaRef) {
      const markdown = buildTableMarkdown(rows, cols, includeHeader);
      insertMarkdownSnippet(textareaRef, markdown, context === 'edit');
    }

    closeTableModal();
  };

  const openSpacingModal = ({ mode, context, editorRef, textareaRef, updater }) => {
    if (mode === 'visual' && editorRef?.current && typeof window !== 'undefined') {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        spacingSelectionRef.current = selection.getRangeAt(0);
      } else {
        spacingSelectionRef.current = null;
      }
    } else {
      spacingSelectionRef.current = null;
    }

    setSpacingModalState({ open: true, mode, context, editorRef, textareaRef, updater });
  };

  const closeSpacingModal = () => {
    setSpacingModalState({ open: false, mode: 'visual', context: 'create', editorRef: null, textareaRef: null, updater: null });
    spacingSelectionRef.current = null;
    setSpacingValues({ margin: 16, padding: 16 });
  };

  const applySpacingToVisual = (editorRef, updater, marginValue, paddingValue) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection) return;
    if (spacingSelectionRef.current && selection.rangeCount > 0) {
      selection.removeAllRanges();
      selection.addRange(spacingSelectionRef.current);
    }
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const cloned = range.cloneContents();
    const hasContent = cloned && cloned.childNodes && cloned.childNodes.length > 0;
    const wrapper = document.createElement('div');
    const safeMargin = Number.isFinite(marginValue) ? Math.max(0, marginValue) : 0;
    const safePadding = Number.isFinite(paddingValue) ? Math.max(0, paddingValue) : 0;
    wrapper.style.margin = `${safeMargin}px`;
    wrapper.style.padding = `${safePadding}px`;
    wrapper.setAttribute('data-spacing-block', 'true');

    if (hasContent) {
      wrapper.appendChild(cloned);
    } else {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'Add content here';
      wrapper.appendChild(placeholder);
    }

    range.deleteContents();
    range.insertNode(wrapper);
    range.setStartAfter(wrapper);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleVisualInput(editorRef, updater);
  };

  const buildSpacingMarkdown = (marginValue, paddingValue) => {
    const safeMargin = Number.isFinite(marginValue) ? Math.max(0, marginValue) : 0;
    const safePadding = Number.isFinite(paddingValue) ? Math.max(0, paddingValue) : 0;
    const styleParts = [`margin: ${safeMargin}px`, `padding: ${safePadding}px`];
    return `\n<div data-spacing-block="true" style="${styleParts.join('; ')}">\n\n</div>\n`;
  };

  const applySpacingFromModal = () => {
    const { margin, padding } = spacingValues;
    const { mode, context, editorRef, textareaRef, updater } = spacingModalState;
    const safeMargin = Number.isFinite(margin) ? margin : 0;
    const safePadding = Number.isFinite(padding) ? padding : 0;

    if (mode === 'visual') {
      const changeHandler = updater || (context === 'edit' ? updateEditingContent : updateNewFileContent);
      applySpacingToVisual(editorRef, changeHandler, safeMargin, safePadding);
    } else if (textareaRef) {
      const snippet = buildSpacingMarkdown(safeMargin, safePadding);
      insertMarkdownSnippet(textareaRef, snippet, context === 'edit');
    }

    closeSpacingModal();
  };

  const hideDeleteOverlay = useCallback(() => {
    overlayHoverRef.current = false;
    setDeleteOverlay((prev) => (prev.visible ? DELETE_OVERLAY_DEFAULT : prev));
  }, []);

  const clearOverlayHideTimeout = useCallback(() => {
    if (overlayHideTimeoutRef.current) {
      clearTimeout(overlayHideTimeoutRef.current);
      overlayHideTimeoutRef.current = null;
    }
  }, []);

  const requestOverlayHide = useCallback(() => {
    clearOverlayHideTimeout();
    overlayHideTimeoutRef.current = setTimeout(() => {
      if (!overlayHoverRef.current) {
        hideDeleteOverlay();
      }
    }, 120);
  }, [clearOverlayHideTimeout, hideDeleteOverlay]);

  const handleEditorMouseLeave = (editorRef) => {
    if (deleteOverlay.editorRef === editorRef) {
      requestOverlayHide();
    }
  };

  const handleEditorMouseMove = (event, editorRef, updater) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    const eventTarget = event.target instanceof Element ? event.target : null;
    const targetElement = eventTarget?.closest(DELETABLE_SELECTORS);
    if (!targetElement || !editorRef.current.contains(targetElement)) {
      if (deleteOverlay.editorRef === editorRef) {
        requestOverlayHide();
      }
      return;
    }

    clearOverlayHideTimeout();

    const rect = targetElement.getBoundingClientRect();
    setDeleteOverlay((prev) => {
      if (prev.visible && prev.target === targetElement) {
        return prev;
      }
      return {
        visible: true,
        top: rect.top - 8,
        left: rect.right - 16,
        target: targetElement,
        editorRef,
        updater,
      };
    });
  };

  const handleDeleteOverlayClick = () => {
    const { target, editorRef, updater } = deleteOverlay;
    if (!target || !editorRef?.current) return;
    target.remove();
    hideDeleteOverlay();
    const nextUpdater = typeof updater === 'function'
      ? updater
      : editorRef === editEditorRef
        ? updateEditingContent
        : updateNewFileContent;
    if (typeof nextUpdater === 'function') {
      handleVisualInput(editorRef, nextUpdater);
    }
  };

  const insertImageIntoVisual = (editorRef, updater, url) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    editorRef.current.focus();
    document.execCommand('insertImage', false, url);
    handleVisualInput(editorRef, updater);
  };

  const triggerInlineImagePicker = (context) => {
    if (context === 'edit') {
      editImageInputRef.current?.click();
    } else {
      createImageInputRef.current?.click();
    }
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
      if (editEditorMode === 'visual') {
        insertImageIntoVisual(editEditorRef, updateEditingContent, url);
      } else {
        insertMarkdownSnippet(editMarkdownTextareaRef, `![image](${url})\n`, true);
      }
    } else {
      if (createEditorMode === 'visual') {
        insertImageIntoVisual(createEditorRef, updateNewFileContent, url);
      } else {
        insertMarkdownSnippet(createMarkdownTextareaRef, `![image](${url})\n`);
      }
    }
  };

  const openLinkModal = (editorRef, updater) => {
    if (!editorRef?.current || typeof window === 'undefined') return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      linkSelectionRef.current = selection.getRangeAt(0);
    } else {
      linkSelectionRef.current = null;
    }
    setLinkUrl('');
    setLinkModalState({ open: true, editorRef, updater });
  };

  const closeLinkModal = () => {
    setLinkModalState({ open: false, editorRef: null, updater: null });
    setLinkUrl('');
    linkSelectionRef.current = null;
  };

  const insertLinkFromModal = () => {
    const url = linkUrl.trim();
    const { editorRef, updater } = linkModalState;
    if (!url || !editorRef?.current || typeof window === 'undefined') {
      closeLinkModal();
      return;
    }

    editorRef.current.focus();
    const selection = window.getSelection();
    if (linkSelectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(linkSelectionRef.current);
    }

    const hasSelection = selection && selection.toString().length > 0;
    if (!hasSelection) {
      const anchorHTML = `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(url)}</a>`;
      document.execCommand('insertHTML', false, anchorHTML);
    } else {
      document.execCommand('createLink', false, url);
      applyAnchorAttributes(editorRef);
    }

    handleVisualInput(editorRef, updater);
    closeLinkModal();
  };

  const handleEditorKeyDown = (event, editorRef, updater) => {
    if (event.key !== 'Enter' || typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || !editorRef?.current) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    const hasNodeApi = typeof Node !== 'undefined';
    const isElementNode = hasNodeApi && anchorNode.nodeType === Node.ELEMENT_NODE;
    const elementRef = isElementNode ? anchorNode : anchorNode.parentElement;
    const preParent = elementRef?.closest?.('pre');
    const codeParent = elementRef?.closest?.('code');

    if (preParent || codeParent) {
      event.preventDefault();
      const isBlockCode = Boolean(preParent);
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.rangeCount === 0) return;
      const range = currentSelection.getRangeAt(0);
      range.deleteContents();

      if (isBlockCode) {
        const newlineNode = document.createTextNode('\n');
        range.insertNode(newlineNode);
        range.setStartAfter(newlineNode);
        range.collapse(true);
        currentSelection.removeAllRanges();
        currentSelection.addRange(range);
      } else {
        const br = document.createElement('br');
        range.insertNode(br);
        const textNode = document.createTextNode('\u200B');
        br.parentNode?.insertBefore(textNode, br.nextSibling);
        range.setStartAfter(textNode);
        range.collapse(true);
        currentSelection.removeAllRanges();
        currentSelection.addRange(range);
      }

      handleVisualInput(editorRef, updater);
    }
  };

  const EditorToolbar = ({
    editorRef,
    onChange,
    onLink,
    onInlineCode,
    onCodeBlock,
    onTable,
    onSpacing,
    onImage,
    imageUploading,
  }) => (
    <div className="toolbar editor-toolbar mb-2 p-2 border rounded d-flex flex-wrap gap-2">
      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Paragraph" onClick={() => execEditorCommand('formatBlock', 'P', editorRef, onChange)}>
          <i className="ri-paragraph"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Heading 1" onClick={() => execEditorCommand('formatBlock', 'H1', editorRef, onChange)}>
          <i className="ri-h-1"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Heading 2" onClick={() => execEditorCommand('formatBlock', 'H2', editorRef, onChange)}>
          <i className="ri-h-2"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Heading 3" onClick={() => execEditorCommand('formatBlock', 'H3', editorRef, onChange)}>
          <i className="ri-h-3"></i>
        </button>
      </div>

      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Bold" onClick={() => execEditorCommand('bold', null, editorRef, onChange)}>
          <i className="ri-bold"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Italic" onClick={() => execEditorCommand('italic', null, editorRef, onChange)}>
          <i className="ri-italic"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Underline" onClick={() => execEditorCommand('underline', null, editorRef, onChange)}>
          <i className="ri-underline"></i>
        </button>
      </div>

      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Bullet List" onClick={() => execEditorCommand('insertUnorderedList', null, editorRef, onChange)}>
          <i className="ri-list-unordered"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Numbered List" onClick={() => execEditorCommand('insertOrderedList', null, editorRef, onChange)}>
          <i className="ri-list-ordered"></i>
        </button>
      </div>

      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Quote" onClick={() => execEditorCommand('formatBlock', 'BLOCKQUOTE', editorRef, onChange)}>
          <i className="ri-double-quotes-l"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Link" onClick={onLink}>
          <i className="ri-link"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Remove Formatting" onClick={() => execEditorCommand('removeFormat', null, editorRef, onChange)}>
          <i className="ri-eraser-line"></i>
        </button>
      </div>

      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Divider" onClick={() => execEditorCommand('insertHorizontalRule', null, editorRef, onChange)}>
          <i className="ri-separator"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Inline Code" onClick={onInlineCode}>
          <i className="ri-code-line"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Code Block" onClick={onCodeBlock}>
          <i className="ri-code-box-line"></i>
        </button>
      </div>

      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Table" onClick={onTable}>
          <i className="ri-table-line"></i>
        </button>
        <button type="button" className="btn btn-outline-secondary" title="Add Spacing" onClick={onSpacing}>
          <i className="ri-focus-2-line"></i>
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          title="Insert Image"
          onClick={onImage}
          disabled={imageUploading}
        >
          {imageUploading ? (
            <div className="spinner-border spinner-border-sm" role="status" />
          ) : (
            <i className="ri-image-add-line"></i>
          )}
        </button>
      </div>
    </div>
  );

  const MarkdownHelperActions = ({ onTable, onImage, onSpacing, imageUploading }) => (
    <div className="d-flex flex-wrap gap-2 mb-2">
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onTable}>
        <i className="ri-table-line me-1"></i>
        Insert table
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onSpacing}>
        <i className="ri-focus-2-line me-1"></i>
        Add spacing
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
    if (getContentLength(newFile.content, createEditorMode) > 50000) {
      addToast('error', 'Content is too long (max 50,000 characters)');
      return;
    }

    const payloadContent = createEditorMode === 'visual'
      ? sanitizeHTML(newFile.content || '')
      : (newFile.content || '');

    const success = await createFile(title, payloadContent);
    if (success) {
      setShowCreateModal(false);
      setNewFile({ title: '', content: '' });
      setCreateEditorMode('visual');
      setCreateHtmlInitialized(false);
      if (createEditorRef.current) {
        createEditorRef.current.innerHTML = '';
      }
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
      if (getContentLength(payload.content, editEditorMode) > 50000) {
        addToast('error', 'Content is too long (max 50,000 characters)');
        return;
      }
      payload.content = editEditorMode === 'visual'
        ? sanitizeHTML(payload.content)
        : payload.content;
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

  useEffect(() => {
    if (editingFile && editEditorMode === 'visual' && editEditorRef.current && !editingHtmlInitialized) {
      const initialHTML = getEditorReadyHTML(editingFile.content || '');
      editEditorRef.current.innerHTML = initialHTML;
      updateEditingContent(initialHTML);
      setEditingHtmlInitialized(true);
    }

    if ((!editingFile || editEditorMode !== 'visual') && editingHtmlInitialized) {
      setEditingHtmlInitialized(false);
      if (editEditorRef.current) {
        editEditorRef.current.innerHTML = '';
      }
    }
  }, [editingFile, editingHtmlInitialized, editEditorMode]);

  useEffect(() => {
    if (createEditorMode === 'visual' && createEditorRef.current && !createHtmlInitialized) {
      const initialHTML = getEditorReadyHTML(newFile.content || '');
      createEditorRef.current.innerHTML = initialHTML;
      setCreateHtmlInitialized(true);
    }

    if (createEditorMode !== 'visual' && createHtmlInitialized) {
      setCreateHtmlInitialized(false);
      if (createEditorRef.current) {
        createEditorRef.current.innerHTML = '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createEditorMode, createHtmlInitialized]);

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

  useEffect(() => () => clearOverlayHideTimeout(), [clearOverlayHideTimeout]);

  useEffect(() => {
    if ((!showCreateModal || createEditorMode !== 'visual') && deleteOverlay.editorRef === createEditorRef) {
      hideDeleteOverlay();
    }
  }, [showCreateModal, createEditorMode, deleteOverlay.editorRef, hideDeleteOverlay, createEditorRef]);

  useEffect(() => {
    if ((!viewingFile || !editingFile || editEditorMode !== 'visual') && deleteOverlay.editorRef === editEditorRef) {
      hideDeleteOverlay();
    }
  }, [viewingFile, editingFile, editEditorMode, deleteOverlay.editorRef, hideDeleteOverlay, editEditorRef]);

  return (
    <>
      {navigating ? (
        <Loader message="Loading folder contents..." />
      ) : (
      <div className="files-tab">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Files</h2>
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
            setCreateEditorMode('visual');
            setCreateHtmlInitialized(false);
            if (createEditorRef.current) {
              createEditorRef.current.innerHTML = '';
            }
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
                  setCreateEditorMode('visual');
                  setCreateHtmlInitialized(false);
                  if (createEditorRef.current) {
                    createEditorRef.current.innerHTML = '';
                  }
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
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <label className="form-label mb-0">Content</label>
                    <div className="btn-group editor-mode-toggle" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${createEditorMode === 'visual' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCreateEditorMode('visual')}
                      >
                        Visual
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${createEditorMode === 'markdown' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCreateEditorMode('markdown')}
                      >
                        Markdown
                      </button>
                    </div>
                  </div>

                  {createEditorMode === 'visual' ? (
                    <>
                      <EditorToolbar
                        editorRef={createEditorRef}
                        onChange={updateNewFileContent}
                        onLink={() => openLinkModal(createEditorRef, updateNewFileContent)}
                        onInlineCode={() => insertInlineCode(createEditorRef, updateNewFileContent)}
                        onCodeBlock={() => insertCodeBlock(createEditorRef, updateNewFileContent)}
                        onTable={() => openTableModal({ mode: 'visual', context: 'create', editorRef: createEditorRef, updater: updateNewFileContent })}
                        onSpacing={() => openSpacingModal({ mode: 'visual', context: 'create', editorRef: createEditorRef, updater: updateNewFileContent })}
                        onImage={() => triggerInlineImagePicker('create')}
                        imageUploading={inlineImageUploading && inlineImageContext === 'create'}
                      />
                      <div
                        ref={createEditorRef}
                        className="form-control visual-editor"
                        contentEditable
                        data-placeholder="Design your document visually..."
                        onKeyDown={(e) => handleEditorKeyDown(e, createEditorRef, updateNewFileContent)}
                        onInput={() => handleVisualInput(createEditorRef, updateNewFileContent)}
                        onMouseMove={(e) => handleEditorMouseMove(e, createEditorRef, updateNewFileContent)}
                        onMouseLeave={() => handleEditorMouseLeave(createEditorRef)}
                        suppressContentEditableWarning={true}
                        style={{ minHeight: '320px', overflowY: 'auto' }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <MarkdownHelperActions
                        onTable={() => openTableModal({ mode: 'markdown', context: 'create', textareaRef: createMarkdownTextareaRef })}
                        onSpacing={() => openSpacingModal({ mode: 'markdown', context: 'create', textareaRef: createMarkdownTextareaRef })}
                        onImage={() => triggerInlineImagePicker('create')}
                        imageUploading={inlineImageUploading && inlineImageContext === 'create'}
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
                    </>
                  )}

                  <small className="text-muted d-block">
                    {getContentLength(newFile.content, createEditorMode)} / 50,000 characters
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
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <label className="form-label mb-0">Content</label>
                        <div className="btn-group editor-mode-toggle" role="group">
                          <button
                            type="button"
                            className={`btn btn-sm ${editEditorMode === 'visual' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setEditEditorMode('visual')}
                          >
                            Visual
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${editEditorMode === 'markdown' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setEditEditorMode('markdown')}
                          >
                            Markdown
                          </button>
                        </div>
                      </div>

                      {editEditorMode === 'visual' ? (
                        <>
                          <EditorToolbar
                            editorRef={editEditorRef}
                            onChange={updateEditingContent}
                            onLink={() => openLinkModal(editEditorRef, updateEditingContent)}
                            onInlineCode={() => insertInlineCode(editEditorRef, updateEditingContent)}
                            onCodeBlock={() => insertCodeBlock(editEditorRef, updateEditingContent)}
                            onTable={() => openTableModal({ mode: 'visual', context: 'edit', editorRef: editEditorRef, updater: updateEditingContent })}
                            onSpacing={() => openSpacingModal({ mode: 'visual', context: 'edit', editorRef: editEditorRef, updater: updateEditingContent })}
                            onImage={() => triggerInlineImagePicker('edit')}
                            imageUploading={inlineImageUploading && inlineImageContext === 'edit'}
                          />
                          <div
                            ref={editEditorRef}
                            className="form-control visual-editor"
                            contentEditable
                            onKeyDown={(e) => handleEditorKeyDown(e, editEditorRef, updateEditingContent)}
                            onInput={() => handleVisualInput(editEditorRef, updateEditingContent)}
                            onMouseMove={(e) => handleEditorMouseMove(e, editEditorRef, updateEditingContent)}
                            onMouseLeave={() => handleEditorMouseLeave(editEditorRef)}
                            suppressContentEditableWarning={true}
                            style={{ minHeight: '360px', overflowY: 'auto' }}
                          ></div>
                        </>
                      ) : (
                        <>
                          <MarkdownHelperActions
                            onTable={() => openTableModal({ mode: 'markdown', context: 'edit', textareaRef: editMarkdownTextareaRef })}
                            onSpacing={() => openSpacingModal({ mode: 'markdown', context: 'edit', textareaRef: editMarkdownTextareaRef })}
                            onImage={() => triggerInlineImagePicker('edit')}
                            imageUploading={inlineImageUploading && inlineImageContext === 'edit'}
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
                        </>
                      )}

                      <small className="text-muted d-block">
                        {getContentLength(editingFile.content || '', editEditorMode)} / 50,000 characters
                      </small>
                    </div>
                  </>
                ) : (
                  <div className="file-content">
                    <div 
                      className="visual-preview markdown-body"
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

      {/* Insert Link Modal */}
      <Modal
        open={linkModalState.open}
        onClose={closeLinkModal}
        title="Insert Link"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button type="button" className="btn btn-outline-secondary" onClick={closeLinkModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={insertLinkFromModal}
              disabled={!linkUrl.trim()}
            >
              Insert
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label className="form-label">URL</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <small className="text-muted">Highlight text in the editor before inserting a link.</small>
        </div>
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
            <small className="text-muted d-block">Spacing wraps your selected content inside a div with margin/padding styles. Works in both visual and markdown modes.</small>
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

      {deleteOverlay.visible && deleteOverlay.target && (
        <button
          type="button"
          className="content-delete-overlay"
          style={{ top: deleteOverlay.top, left: deleteOverlay.left }}
          onClick={handleDeleteOverlayClick}
          title="Remove"
          aria-label="Delete block"
          onMouseEnter={() => {
            overlayHoverRef.current = true;
            clearOverlayHideTimeout();
          }}
          onMouseLeave={() => {
            overlayHoverRef.current = false;
            requestOverlayHide();
          }}
        >
          <i className="ri-close-circle-line"></i>
        </button>
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