import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const EditorTab = () => {
  const { theme } = useTheme();
  const { 
    editorFiles, 
    editorLoading, 
    fetchEditorFiles, 
    updateEditorFile, 
    resetEditorFiles 
  } = useData();
  
  const [activeFileId, setActiveFileId] = useState(null);
  const [windowConsoleOutput, setWindowConsoleOutput] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [activeView, setActiveView] = useState('window'); // 'window' or 'console'
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const iframeRef = useRef(null);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Load editor files on mount
  useEffect(() => {
    fetchEditorFiles();
  }, []);
  
  // Set active file when files are loaded
  useEffect(() => {
    if (editorFiles.length > 0 && !activeFileId) {
      const windowFiles = editorFiles.filter(f => f.view === 'window');
      if (windowFiles.length > 0) {
        setActiveFileId(windowFiles[0]._id);
      }
    }
  }, [editorFiles, activeFileId]);
  
  const windowFiles = editorFiles.filter(f => f.view === 'window');
  const consoleFile = editorFiles.find(f => f.view === 'console');
  const files = activeView === 'window' ? windowFiles : (consoleFile ? [consoleFile] : []);
  const activeFile = files.find(f => f._id === activeFileId) || files[0];
  
  // Determine Monaco theme based on app theme
  const appliedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
    : theme;
  const monacoTheme = appliedTheme === 'dark' ? 'vs-dark' : 'vs';
  
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save functionality (you can implement auto-save or show a toast)
      console.log('Save triggered');
    });
  };
  
  const updateFileContent = (content) => {
    if (activeFile) {
      // Update local state immediately for responsive UI
      const updatedFile = { ...activeFile, content };
      if (activeView === 'window') {
        const index = editorFiles.findIndex(f => f._id === activeFileId);
        if (index !== -1) {
          const newFiles = [...editorFiles];
          newFiles[index] = updatedFile;
        }
      }
      
      // Debounce save to database
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateEditorFile(activeFileId, content);
      }, 1000); // Save after 1 second of inactivity
    }
  };
  
  const runCode = () => {
    if (activeView === 'window') {
      setWindowConsoleOutput([]);
      // Window mode - run HTML/CSS/JS from windowFiles
      const htmlFile = windowFiles.find(f => f.language === 'html');
      const cssFile = windowFiles.find(f => f.language === 'css');
      const jsFile = windowFiles.find(f => f.language === 'javascript');
      
      let html = htmlFile?.content || '';
      
      // Ensure HTML has proper structure
      if (!html.includes('</head>')) {
        html = html.replace('<head>', '<head>\n').replace('</head>', '\n</head>');
      }
      
      // Inject theme-aware default styles (without !important so user CSS can override)
      const themeStyles = `<style>
html, body {
  background-color: ${appliedTheme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${appliedTheme === 'dark' ? '#d4d4d4' : '#000000'};
  margin: 0;
  padding: 0;
}
</style>`;
      
      // Inject theme styles first, then user CSS so user styles take priority
      if (html.includes('</head>')) {
        if (cssFile) {
          html = html.replace('</head>', `${themeStyles}<style>${cssFile.content}</style></head>`);
        } else {
          html = html.replace('</head>', `${themeStyles}</head>`);
        }
      }
      
      // Inject console capture and JS
      if (jsFile && html) {
        const consoleCapture = `
          <script>
            (function() {
              const oldLog = console.log;
              const oldError = console.error;
              const oldWarn = console.warn;
              
              window.consoleOutput = [];
              
              console.log = function(...args) {
                window.consoleOutput.push({ type: 'log', message: args.join(' ') });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldLog.apply(console, args);
              };
              
              console.error = function(...args) {
                window.consoleOutput.push({ type: 'error', message: args.join(' ') });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldError.apply(console, args);
              };
              
              console.warn = function(...args) {
                window.consoleOutput.push({ type: 'warn', message: args.join(' ') });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldWarn.apply(console, args);
              };
              
              window.addEventListener('error', function(e) {
                window.consoleOutput.push({ type: 'error', message: e.message });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
              });
            })();
          </script>
        `;
        html = html.replace('</head>', `${consoleCapture}</head>`);
        html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
      }
      
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.srcdoc = html;
      }
    } else {
      // Console mode - run JavaScript from consoleFile
      setConsoleOutput([]);
      const script = consoleFile.content;
      
      const consoleHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            (function() {
              const oldLog = console.log;
              const oldError = console.error;
              const oldWarn = console.warn;
              
              window.consoleOutput = [];
              
              console.log = function(...args) {
                const message = args.map(arg => {
                  if (typeof arg === 'object') {
                    try {
                      return JSON.stringify(arg, null, 2);
                    } catch {
                      return String(arg);
                    }
                  }
                  return String(arg);
                }).join(' ');
                window.consoleOutput.push({ type: 'log', message });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldLog.apply(console, args);
              };
              
              console.error = function(...args) {
                const message = args.map(arg => String(arg)).join(' ');
                window.consoleOutput.push({ type: 'error', message });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldError.apply(console, args);
              };
              
              console.warn = function(...args) {
                const message = args.map(arg => String(arg)).join(' ');
                window.consoleOutput.push({ type: 'warn', message });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
                oldWarn.apply(console, args);
              };
              
              window.addEventListener('error', function(e) {
                window.consoleOutput.push({ type: 'error', message: 'Error: ' + e.message + ' (line ' + e.lineno + ')' });
                window.parent.postMessage({ type: 'console', data: window.consoleOutput }, '*');
              });
            })();
          </script>
        </head>
        <body>
          <script>
            try {
              ${script}
            } catch(error) {
              console.error('Error: ' + error.message);
            }
          </script>
        </body>
        </html>
      `;
      
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.srcdoc = consoleHTML;
      }
    }
  };
  
  // Update active file when switching views
  React.useEffect(() => {
    if (activeView === 'window') {
      const windowFiles = editorFiles.filter(f => f.view === 'window');
      // Only set to first file if no active file or active file is not in window files
      if (windowFiles.length > 0 && (!activeFileId || !windowFiles.find(f => f._id === activeFileId))) {
        setActiveFileId(windowFiles[0]._id);
      }
      // Auto-run code to show proper theme
      setTimeout(() => runCode(), 100);
    } else {
      const consoleFile = editorFiles.find(f => f.view === 'console');
      if (consoleFile && activeFileId !== consoleFile._id) {
        setActiveFileId(consoleFile._id);
      }
    }
  }, [activeView]);
  
  // Run code when theme changes to update colors
  React.useEffect(() => {
    if (activeView === 'window' && iframeRef.current && iframeRef.current.srcdoc) {
      runCode();
    }
  }, [appliedTheme]);
  
  // Listen for console messages from iframe
  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'console') {
        if (activeView === 'window') {
          setWindowConsoleOutput(event.data.data);
        } else {
          setConsoleOutput(event.data.data);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeView]);
  
  const handleResetFiles = async () => {
    setIsResetting(true);
    const success = await resetEditorFiles();
    if (success && editorFiles.length > 0) {
      const windowFiles = editorFiles.filter(f => f.view === 'window');
      if (windowFiles.length > 0) {
        setActiveFileId(windowFiles[0]._id);
      }
    }
    setIsResetting(false);
    setShowResetModal(false);
  };

  return (
    <div className="editor-tab">
      {editorLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Code Editor</h2>
              <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>BETA</span>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowResetModal(true)}
                disabled={isResetting}
                title="Reset to default files"
              >
                <i className="ri-restart-line me-1"></i>
                Reset
              </button>
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${activeView === 'window' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('window')}
                >
                  <i className="ri-window-line me-1"></i>
                  Window
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeView === 'console' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('console')}
                >
                  <i className="ri-terminal-line me-1"></i>
                  Console
                </button>
              </div>
            </div>
          </div>
      
      <div className="row g-3">
        {/* Editor Section */}
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-header d-flex gap-2 overflow-auto" style={{ borderBottom: '1px solid var(--border)' }}>
              {files
                .filter(file => activeView === 'console' ? file.language === 'javascript' : true)
                .map(file => (
                  <div
                    key={file._id}
                    className={`px-3 py-2 ${activeFileId === file._id ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      borderBottom: activeFileId === file._id ? '2px solid var(--bs-primary)' : '2px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => setActiveFileId(file._id)}
                  >
                    <i className={`ri-${file.language === 'html' ? 'html5' : file.language === 'css' ? 'css3' : 'javascript'}-line me-1`}></i>
                    {file.name}
                  </div>
                ))
              }
            </div>
            <div className="card-body p-0">
              <Editor
                height="500px"
                language={activeFile?.language}
                value={activeFile?.content || ''}
                onChange={(value) => updateFileContent(value || '')}
                theme={monacoTheme}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Output Section */}
        <div className="col-12 col-lg-6">
          {/* Window - Rendered Output */}
          <div className="card" style={{ display: activeView === 'window' ? 'block' : 'none' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>
                <i className="ri-window-line me-2"></i>
                Window
              </span>
              <button 
                className="btn btn-primary btn-sm"
                onClick={runCode}
              >
                <i className="ri-play-line me-1"></i>
                Run
              </button>
            </div>
            <div className="card-body p-0">
              <iframe
                ref={iframeRef}
                title="preview"
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none',
                  background: appliedTheme === 'dark' ? '#1e1e1e' : 'white'
                }}
                sandbox="allow-scripts allow-modals"
              />
            </div>
          </div>

          {/* Console Output */}
          <div className="card" style={{ display: activeView === 'console' ? 'block' : 'none' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>
                <i className="ri-terminal-line me-2"></i>
                Console
              </span>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={runCode}
                >
                  <i className="ri-play-line me-1"></i>
                  Run
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => activeView === 'console' ? setConsoleOutput([]) : setWindowConsoleOutput([])}
                  title="Clear console"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <div 
              className="card-body p-2" 
              style={{ 
                background: appliedTheme === 'dark' ? '#000' : '#f5f5f5',
                color: appliedTheme === 'dark' ? '#d4d4d4' : '#333',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
                height: '500px',
                overflowY: 'auto'
              }}
            >
              {(activeView === 'console' ? consoleOutput : windowConsoleOutput).length === 0 ? (
                <div style={{ color: appliedTheme === 'dark' ? '#6a9955' : '#28a745' }}>Console output will appear here...</div>
              ) : (
                (activeView === 'console' ? consoleOutput : windowConsoleOutput).map((log, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '4px 8px',
                      borderBottom: appliedTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      color: log.type === 'error' ? (appliedTheme === 'dark' ? '#f48771' : '#dc3545') : 
                             log.type === 'warn' ? (appliedTheme === 'dark' ? '#dcdcaa' : '#ffc107') : 
                             (appliedTheme === 'dark' ? '#d4d4d4' : '#333')
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>[{log.type}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="alert alert-info mt-3" role="alert">
        <i className="ri-information-line me-2"></i>
        <strong>Beta Feature:</strong> Practice HTML, CSS & JavaScript with Monaco Editor (VS Code). Write code, click "Run Code" to see output in Window and Console!
      </div>
        </>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetModal}
        title="Reset Editor Files"
        onClose={() => setShowResetModal(false)}
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setShowResetModal(false)}
              disabled={isResetting}
            >
              Cancel
            </button>
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={handleResetFiles}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Resetting...
                </>
              ) : (
                'Reset Files'
              )}
            </button>
          </div>
        }
      >
        <p className="mb-0">
          Are you sure you want to reset all editor files to default? This will permanently delete your current code and cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default EditorTab;
