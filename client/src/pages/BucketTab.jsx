import React, { useEffect, useState, useRef } from "react";
import { useToast } from "../components/ToastProvider";
import { useData } from "../context/DataContext";
import Modal from "../components/Modal";
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
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileRef = useRef(null);

  const fetchFiles = async () => {
    await fetchBucket(true);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

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
    setViewFile({ ...file, url: null });
    setViewLoading(true);
    try {
      const res = await pullFromBucket(file._id);
      setViewFile({ ...file, url: res.url || res.data?.url });
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
            <h2 className="mb-0">Bucket</h2>
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
                      <div className="mb-3 position-relative">
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
                        <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
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
                            disabled={downloadingId === f._id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
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
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                          >
                            {deletingId === f._id ? (
                              <span className="spinner-border spinner-border-sm text-danger"></span>
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
