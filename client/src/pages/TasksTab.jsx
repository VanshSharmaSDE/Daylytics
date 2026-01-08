import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { useData } from "../context/DataContext";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

const TasksTab = ({ user }) => {
  const {
    tasks,
    date,
    setDate,
    submittingTask,
    updatingTasks,
    deletingTasks,
    fetchTasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    deleteAllTasks,
    uploadTaskImage,
    deleteTaskImage,

  } = useData();

  const [title, setTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  const formatTimestamp = (value) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return new Date(value).toLocaleString("en-US", options);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    const success = await addTask(title);
    if (success) setTitle("");
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTitle("");
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    const success = await updateTask(editingTask._id, { title: editTitle });
    if (success) cancelEdit();
  };

  const handleDeleteAll = async () => {
    setShowDeleteAllModal(false);
    await deleteAllTasks();
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const handleImageUpload = async (taskId, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setUploadingImage(taskId);
    const success = await uploadTaskImage(taskId, file);
    setUploadingImage(null);

    // Update viewing task if it's the current one
    if (viewingTask && viewingTask._id === taskId) {
      const updatedTask = tasks.find(t => t._id === taskId);
      if (updatedTask) {
        setViewingTask(updatedTask);
      }
    }
  };

  const handleDeleteImage = async (taskId) => {
    setDeletingImage(taskId);
    const success = await deleteTaskImage(taskId);
    setDeletingImage(null);
    
    // Update viewing task if it's the current one
    if (viewingTask && viewingTask._id === taskId) {
      const updatedTask = tasks.find(t => t._id === taskId);
      if (updatedTask) {
        setViewingTask(updatedTask);
      }
    }
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    setDate(formatDate(currentDate));
  };

  const goToNextDay = () => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + 1);
    setDate(formatDate(currentDate));
  };

  const renderTaskActions = (t) => (
    <div className="d-flex align-items-center gap-1">
      <button
        className="task-edit-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          startEdit(t);
        }}
      >
        <i className="ri-edit-line"></i>
      </button>
      <button
        className="task-delete-btn"
        type="button"
        disabled={deletingTasks.has(t._id)}
        onClick={(e) => {
          e.stopPropagation();
          setTaskToDelete(t._id);
        }}
      >
        {deletingTasks.has(t._id) ? (
          <div
            className="spinner-border spinner-border-sm text-danger"
            role="status"
          />
        ) : (
          <i className="ri-delete-bin-line"></i>
        )}
      </button>
    </div>
  );

  const renderListView = () => (
    <div key="list-view" className="list-group">
      {tasks.length === 0 ? (
        <div className="list-group-item text-muted text-center py-4">
          No tasks for this day
        </div>
      ) : (
        tasks.map((t) => (
          <div
            key={t._id}
            className={cx(
              "list-group-item d-flex justify-content-between align-items-center",
              t.done && "list-group-item-success"
            )}
          >
            {editingTask?._id === t._id ? (
              <>
                <div className="d-flex align-items-center gap-2 me-1 flex-grow-1">
                  <input
                    className="form-control"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={500}
                    autoFocus
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="task-edit-save-btn"
                    onClick={saveEdit}
                    title="Save"
                  >
                    <i className="ri-check-line"></i>
                  </button>
                  <button
                    className="task-edit-cancel-btn"
                    onClick={cancelEdit}
                    title="Cancel"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="d-flex align-items-center gap-3 flex-grow-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingTask(t);
                  }}
                  role="button"
                >
                  {updatingTasks.has(t._id) ? (
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    />
                  ) : (
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={t.done}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTask(t._id);
                      }}
                    />
                  )}
                  <span
                    className={cx(
                      "task-title-truncate",
                      t.done && "text-decoration-line-through"
                    )}
                  >
                    {t.title}
                  </span>
                </div>
                <div className="d-flex align-items-center ms-1 gap-1">
                  <span className="task-item-time">
                    {formatTimestamp(t.createdAt)}
                  </span>
                  {renderTaskActions(t)}
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderCardView = () => (
    <div key="card-view" className="row g-3">
      {tasks.length === 0 ? (
        <div className="col-12">
          <div className="card">
            <div className="card-body text-muted text-center py-4">
              No tasks for this day
            </div>
          </div>
        </div>
      ) : (
        tasks.map((t) => (
          <div key={t._id} className="col-12 col-md-6 col-lg-4">
            <div className={cx("card h-100", t.done && "border-success")}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-start gap-2 flex-grow-1">
                    {updatingTasks.has(t._id) ? (
                      <div
                        className="spinner-border spinner-border-sm text-primary mt-1"
                        role="status"
                      />
                    ) : (
                      <input
                        className="form-check-input mt-1"
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTask(t._id)}
                      />
                    )}
                    <div className="flex-grow-1">
                      <p
                        className={cx(
                          "card-text mb-2",
                          t.done && "text-decoration-line-through"
                        )}
                        style={{ cursor: "pointer" }}
                        onClick={() => setViewingTask(t)}
                      >
                        {t.title}
                      </p>

                      <small className="text-muted d-block">
                        {formatTimestamp(t.createdAt)}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    {renderTaskActions(t)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCompactView = () => (
    <div key="compact-view" className="list-group list-group-flush">
      {tasks.length === 0 ? (
        <div className="list-group-item text-muted text-center py-3">
          No tasks for this day
        </div>
      ) : (
        tasks.map((t) => (
          <div
            key={t._id}
            className={cx(
              "list-group-item compact-view-item d-flex justify-content-between align-items-center py-2",
              t.done && "bg-success bg-opacity-10"
            )}
          >
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              {updatingTasks.has(t._id) ? (
                <div
                  className="spinner-border spinner-border-sm text-primary"
                  role="status"
                  style={{ width: "1rem", height: "1rem" }}
                />
              ) : (
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t._id)}
                  style={{ width: "1rem", height: "1rem" }}
                />
              )}
              <span
                className={cx(
                  "small",
                  t.done && "text-decoration-line-through"
                )}
                style={{ cursor: "pointer" }}
                onClick={() => setViewingTask(t)}
              >
                {t.title}
              </span>
            </div>
            <div className="d-flex align-items-center gap-1">
              {renderTaskActions(t)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCircleView = () => (
    <div key="circle-view" className="row g-4">
      {tasks.length === 0 ? (
        <div className="col-12">
          <div className="text-muted text-center py-4">
            No tasks for this day
          </div>
        </div>
      ) : (
        tasks.map((t) => (
          <div key={t._id} className="col-6 col-md-4 col-lg-3">
            <div className="text-center circle-view-item">
              <div
                className={cx(
                  "rounded-circle mx-auto d-flex align-items-center justify-content-center position-relative",
                  t.done ? "bg-success" : "bg-secondary bg-opacity-25"
                )}
                style={{
                  width: "120px",
                  height: "120px",
                  cursor: "pointer",
                  border: t.done ? "3px solid var(--bs-success)" : "3px solid var(--border)"
                }}
                onClick={() => setViewingTask(t)}
              >
                {updatingTasks.has(t._id) ? (
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />
                ) : (
                  <div className="text-center p-3">
                    <i
                      className={cx(
                        t.done ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line",
                        t.done ? "text-white" : ""
                      )}
                      style={{ fontSize: "2rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(t._id);
                      }}
                    ></i>
                  </div>
                )}
              </div>
              <p
                className={cx(
                  "mt-2 mb-1 small",
                  t.done && "text-decoration-line-through"
                )}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {t.title}
              </p>

              <div className="d-flex justify-content-center gap-1 mt-2">
                {renderTaskActions(t)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderTasks = () => renderListView();

  return (
    <>
      <div className="tasks-tab">
        {/* Header - Mobile */}
        <div className="d-flex d-md-none justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Tasks</h2>
          <div className="d-flex gap-2">

            {tasks.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowDeleteAllModal(true)}
                title="Delete all tasks"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Date Controls */}
        <div className="d-flex d-md-none gap-2 mb-4">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={goToPreviousDay}
            title="Previous day"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={goToNextDay}
            title="Next day"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={() => setDate(formatDate())}
          >
            Today
          </button>
        </div>

        {/* Header - Desktop */}
        <div className="d-none d-md-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Tasks</h2>
          
          <div className="d-flex gap-2 align-items-center">


            {/* Date Picker Group */}
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={goToPreviousDay}
              title="Previous day"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={goToNextDay}
              title="Next day"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={() => setDate(formatDate())}
            >
              Today
            </button>

            {/* Action Buttons */}
            {tasks.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setShowDeleteAllModal(true)}
                title="Delete all tasks"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>
        </div>

        {/* Add Task Form - Desktop */}
        <form
          onSubmit={handleAddTask}
          className="d-none d-md-flex gap-2 mb-4"
        >
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task for today"
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingTask}
            style={{ minWidth: '100px' }}
          >
            {submittingTask ? "Adding..." : "Add Task"}
          </button>
        </form>

        {/* Add Task Form - Mobile */}
        <form
          onSubmit={handleAddTask}
          className="d-md-none mb-4"
        >
          <div className="d-flex gap-2">
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task..."
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingTask}
            >
              {submittingTask ? <i className="ri-loader-4-line"></i> : <i className="ri-add-line"></i>}
            </button>
          </div>
        </form>

        {renderTasks()}
      </div>

      <Modal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="Delete all tasks?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setShowDeleteAllModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={handleDeleteAll}
            >
              Delete All
            </button>
          </div>
        }
      >
        <p className="mb-0">
          This will permanently delete all {tasks.length} task(s) for {date}.
          This action cannot be undone.
        </p>
      </Modal>

      <Modal
        open={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title="Task Details"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setViewingTask(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {viewingTask && (
          <div>
            <div className="mb-3">
              <label className="form-label text-muted small">Status</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={viewingTask.done}
                  onChange={() => {
                    toggleTask(viewingTask._id);
                    setViewingTask({ ...viewingTask, done: !viewingTask.done });
                  }}
                />
                <span
                  className={viewingTask.done ? "text-success" : "text-muted"}
                >
                  {viewingTask.done ? "Completed" : "Pending"}
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted small">Task</label>
              <p
                className="mb-0"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {viewingTask.title}
              </p>
            </div>
            
            {/* Image Attachment Section */}
            <div className="mb-3">
              <label className="form-label text-muted small">Attachment</label>
              {viewingTask.attachment && viewingTask.attachment.url ? (
                <div>
                  <img 
                    src={viewingTask.attachment.url} 
                    alt={viewingTask.attachment.originalName || 'Task attachment'}
                    className="img-fluid rounded mb-2"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  <div className="d-flex gap-2">
                    <a 
                      href={viewingTask.attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="ri-external-link-line"></i> Open
                    </a>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteImage(viewingTask._id)}
                      disabled={deletingImage === viewingTask._id}
                    >
                      {deletingImage === viewingTask._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Removing...
                        </>
                      ) : (
                        <>
                          <i className="ri-delete-bin-line"></i> Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    id={`task-image-${viewingTask._id}`}
                    onChange={(e) => e.target.files && handleImageUpload(viewingTask._id, e.target.files[0])}
                    disabled={uploadingImage === viewingTask._id}
                  />
                  <small className="text-muted">Maximum file size: 10MB. Only images allowed.</small>
                  {uploadingImage === viewingTask._id && (
                    <div className="mt-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                      <span className="ms-2">Uploading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-0">
              <label className="form-label text-muted small">Created</label>
              <p className="mb-0">{formatTimestamp(viewingTask.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete task?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setTaskToDelete(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={confirmDeleteTask}
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="mb-0">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default TasksTab;
