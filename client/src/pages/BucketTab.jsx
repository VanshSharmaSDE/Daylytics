import React, { useEffect, useState, useRef } from "react";
import { useToast } from "../components/ToastProvider";
import { useData } from "../context/DataContext";
import Modal from "../components/Modal";
import InfoTooltip from "../components/InfoTooltip";
import Loader from "../components/Loader";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const humanFileSize = (size) => {
  if (!size) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "KB", "MB", "GB"][i]
  );
};

const fileIconFor = (mime) => {
  if (!mime) return "ri-file-line";
  if (mime.startsWith("image/")) return "ri-image-line";
  if (mime === "application/pdf") return "ri-file-pdf-line";
  if (mime.startsWith("audio/")) return "ri-file-audio-line";
  if (mime.startsWith("video/")) return "ri-file-video-line";
  return "ri-file-line";
};

const BucketTab = () => {
  const { addToast } = useToast();
  const { bucketFiles: files, bucketLoading: loading, fetchBucket, pushToBucket, pullFromBucket, deleteFromBucket, operationLoading, operationMessage } = useData();

  // local UI-only states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFetchError, setPdfFetchError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileRef = useRef(null);

  const fetchFiles = async () => {
    await fetchBucket(true);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Revoke PDF blob URL when viewer is closed to avoid memory leaks
  useEffect(() => {
    if (!viewFile && pdfBlobUrl) {
      try {
        URL.revokeObjectURL(pdfBlobUrl);
      } catch (e) {
        // ignore
      }
      setPdfBlobUrl(null);
      setPdfFetchError(null);
    }

    // cleanup on unmount
    return () => {
      if (pdfBlobUrl) {
        try { URL.revokeObjectURL(pdfBlobUrl); } catch (e) {}
      }
    };
  }, [viewFile, pdfBlobUrl]);

  const onSelectFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      addToast("error", "File too large. Maximum allowed per file is 10 MB.");
      fileRef.current.value = null;
      return;
    }

    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await pushToBucket(fd, (e) => setProgress(Math.round((e.loaded / e.total) * 100)));
      // pushToBucket already adds the file to bucketFiles and shows toasts
      fileRef.current.value = null;
    } catch (err) {
      // pushToBucket handles errors and toasts; log for debugging only
      console.error('onSelectFile upload error', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const openView = async (file) => {
    // clear any previous pdf blob/error
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfFetchError(null);

    setViewFile({ ...file, url: null, textContent: null });
    setViewLoading(true);
    try {
      const res = await pullFromBucket(file._id);
      const url = res.url || res.data?.url;
      if (!url) throw new Error('Unable to resolve file URL');

      // For text files, fetch content for inline preview
      let textContent = null;
      const mime = file.mimeType || '';
      const isText = mime.startsWith('text/') || mime === 'application/json' || (file.fileName && file.fileName.endsWith('.txt'));
      if (isText) {
        try {
          const resp = await fetch(url, { mode: 'cors' });
          if (resp.ok) {
            textContent = await resp.text();
            // Limit content length for safety
            if (textContent.length > 200000) textContent = textContent.slice(0, 200000) + '\n\n[Truncated]';
          } else {
            console.warn('Text file fetch returned non-ok status', resp.status);
          }
        } catch (err) {
          console.warn('Unable to fetch text file content, CORS or network issue', err);
        }
      }

      setViewFile({ ...file, url, textContent });
    } catch (err) {
      console.error('Error loading file preview:', err);
      const errorMsg = err?.response?.data?.msg || err?.message || "Unable to load file preview";
      addToast("error", errorMsg);
      setViewFile(null);
    } finally {
      setViewLoading(false);
    }
  };

  const onPull = async (id, fileName) => {
    setDownloadingId(id);
    try {
      const res = await pullFromBucket(id);
      const url = res.url || res.data?.url;
      // Download without mutating state: fetch blob and force download with provided filename
      const resp = await fetch(url, { mode: "cors" });
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      addToast("success", "Download started");
    } catch (err) {
      addToast("error", err?.response?.data?.msg || "Unable to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const onDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteFromBucket(id);
      // deleteFromBucket updates bucketFiles and shows toasts
    } catch (err) {
      addToast("error", err?.response?.data?.msg || "Delete failed");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      {uploading && (
        <div className="mb-3">
          <div className="progress" style={{ height: 8 }}>
            <div
              className={`progress-bar ${
                progress === 0 ? "indeterminate" : ""
              }`}
              role="progressbar"
              style={{ width: `${progress === 0 ? 100 : progress}%` }}
            ></div>
          </div>
        </div>
      )}


      {loading ? (
        <Loader message="Loading bucket..." />
      ) : (
        <div className="files-tab">
          

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <h2 className="mb-0">Bucket</h2>
              <InfoTooltip content={<div>
                <strong>Bucket limits:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Per-file upload limit: 10 MB</li>
                  <li>Per-user storage quota applies (default 100 MB)</li>
                  <li>Files are stored via Cloudinary; deletions reduce used storage</li>
                </ul>
              </div>} className="ms-2" />
            </div>
            <div>
              <label
                className="btn btn-primary mb-0"
                style={{ cursor: "pointer" }}
              >
                <i className="ri-upload-cloud-line"></i>
                <span className="d-none d-md-inline ms-2">Upload</span>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) =>
                    onSelectFile(e.target.files && e.target.files[0])
                  }
                />
              </label>
            </div>
          </div>
          {files.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="ri-archive-line" style={{ fontSize: "3rem" }}></i>
              <p className="mt-3">
                No files in your bucket yet. Upload files using the Upload
                button above.
              </p>
            </div>
          )}
          <div className="row g-3">
            {files.map((f) => (
              <div key={f._id} className="col-12 col-md-6 col-lg-4">
                <div className="card folder-card h-100">
                  <div
                    className="card-body"
                    onClick={() => openView(f)}
                    style={{ cursor: "pointer" }}
                  >
                    {f.mimeType && f.mimeType.startsWith("image/") ? (
                      <div className="mb-3 position-relative" style={{ overflow: 'visible' }}>
                        <img 
                          src={f.url} 
                          alt={f.fileName}
                          style={{ 
                            width: '100%', 
                            height: '200px', 
                            objectFit: 'cover', 
                            borderRadius: '8px' 
                          }}
                        />
                        <div className="position-absolute top-0 end-0 p-2 d-flex gap-1" style={{ flexWrap: 'nowrap' }}>
                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(f);
                            }}
                            title="View file"
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                          >
                            <i className="ri-eye-line"></i>
                          </button>

                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPull(f._id, f.fileName);
                            }}
                            title="Download"
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                            disabled={downloadingId === f._id}
                          >
                            {downloadingId === f._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="ri-download-line"></i>
                            )}
                          </button>

                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(f);
                            }}
                            title="Delete"
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              color: '#dc3545'
                            }}
                            disabled={deletingId === f._id}
                          >
                            {deletingId === f._id ? (
                              <span className="spinner-border spinner-border-sm text-danger"></span>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : f.mimeType && f.mimeType.startsWith("video/") ? (
                      <div className="mb-3 position-relative">
                        <video
                          src={f.url}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            background: '#000'
                          }}
                        />

                        {/* Center play overlay */}
                        <div style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}>
                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(f);
                            }}
                            title="Play video"
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.85)',
                              border: '0'
                            }}
                          >
                            <i className="ri-play-fill" style={{ fontSize: '1.5rem' }} />
                          </button>
                        </div>

                        <div className="position-absolute top-0 end-0 p-2 d-flex gap-1" style={{ zIndex: 10 }}>
                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(f);
                            }}
                            title="View file"
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                          >
                            <i className="ri-eye-line"></i>
                          </button>

                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPull(f._id, f.fileName);
                            }}
                            title="Download"
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                            disabled={downloadingId === f._id}
                          >
                            {downloadingId === f._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="ri-download-line"></i>
                            )}
                          </button>

                          <button
                            className="file-pin-btn text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(f);
                            }}
                            title="Delete"
                            style={{
                              background: '#dc3545',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              // border: '1px solid #dc3545',
                              // color: 'white'
                            }}
                            disabled={deletingId === f._id}
                          >
                            {deletingId === f._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <i
                          className={`${fileIconFor(f.mimeType)} text-muted`}
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <div className="d-flex gap-1">
                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(f);
                            }}
                            title="View file"
                          >
                            <i className="ri-eye-line"></i>
                          </button>

                          <button
                            className="file-pin-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPull(f._id, f.fileName);
                            }}
                            title="Download"
                            disabled={downloadingId === f._id}
                          >
                            {downloadingId === f._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="ri-download-line"></i>
                            )}
                          </button>

                          <button
                            className="file-pin-btn text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(f);
                            }}
                            title="Delete"
                            disabled={deletingId === f._id}
                          >
                            {deletingId === f._id ? (
                              <span className="spinner-border spinner-border-sm text-danger"></span>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <h6 className="mt-2 mb-0">{f.fileName}</h6>
                    <div className="text-muted small">
                      {f.mimeType} • {humanFileSize(f.fileSize)}
                    </div>
                    <small className="text-muted">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        title="Delete file?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={() => onDelete(confirmDelete._id)}
              disabled={deletingId === confirmDelete?._id}
            >
              {deletingId === confirmDelete?._id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="mb-0">
          This will permanently remove the file from storage and your bucket.
          This action cannot be undone.
        </p>
      </Modal>

      <Modal
        open={!!viewFile}
        title={viewFile ? viewFile.fileName : "Preview"}
        onClose={() => setViewFile(null)}
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setViewFile(null)}
            >
              <i className="ri-close-line" />{" "}
              <span className="d-none ms-1 d-md-inline">Close</span>
            </button>
            {viewFile && (
              <button
                className="btn btn-outline-primary"
                onClick={() => onPull(viewFile._id, viewFile.fileName)}
              >
                <i className="ri-download-line" />{" "}
                <span className="d-none ms-1 d-md-inline">Download</span>
              </button>
            )}
          </div>
        }
      >
        <div style={{ minHeight: 200 }}>
          {viewLoading ? (
            <Loader message="Loading preview..." />
          ) : viewFile ? (
            <div>
              {viewFile.mimeType && viewFile.mimeType.startsWith("image/") ? (
                <img
                  src={viewFile.url}
                  alt={viewFile.fileName}
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                />
              ) : viewFile.mimeType && viewFile.mimeType.startsWith("video/") ? (
                <video
                  src={viewFile.url}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                />
              ) : (viewFile.mimeType === 'application/pdf' || (viewFile.fileName && viewFile.fileName.toLowerCase().endsWith('.pdf'))) ? (
                // Native PDF preview using <object> with <embed> fallback (no proxy/API used)
                <div>
                  <object
                    data={pdfBlobUrl || viewFile.url}
                    type="application/pdf"
                    width="100%"
                    height="70vh"
                  >
                    {/* Fallback content when embedding is not supported or blocked */}
                    <div className="text-center p-4">
                      <p className="mb-2">Unable to display PDF inline in this browser.</p>
                      <p className="small text-muted">This can be due to browser settings or CORS restrictions on the file host.</p>
                      <div className="mt-3">
                        <button className="btn btn-primary me-2" onClick={() => onPull(viewFile._id, viewFile.fileName)}>Download PDF</button>
                        <a className="btn btn-outline-secondary" href={pdfBlobUrl || viewFile.url} target="_blank" rel="noreferrer">Open in new tab</a>
                      </div>
                    </div>
                  </object>
                </div>
              ) : (viewFile.mimeType === 'application/msword' || viewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (viewFile.fileName && (viewFile.fileName.toLowerCase().endsWith('.doc') || viewFile.fileName.toLowerCase().endsWith('.docx')))) ? (
                // Word preview via Microsoft Office viewer
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewFile.url)}`}
                  title={viewFile.fileName}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (viewFile.mimeType && viewFile.mimeType.startsWith('text')) || viewFile.textContent ? (
                // Plain text preview (fetched content)
                <div style={{ maxHeight: '70vh', overflow: 'auto', background: 'var(--panel-muted)', padding: 12, borderRadius: 6 }}>
                  {viewFile.textContent ? (
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewFile.textContent}</pre>
                  ) : (
                    <p className="text-muted">Unable to fetch text content for preview (possible CORS restriction).</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted">
                    File preview is not available for this file type. Use
                    Download to retrieve the file.
                  </p>
                  <div className="small text-muted">
                    Type: {viewFile.mimeType}
                  </div>
                  <div className="small text-muted">
                    Size: {humanFileSize(viewFile.fileSize)}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default BucketTab;
