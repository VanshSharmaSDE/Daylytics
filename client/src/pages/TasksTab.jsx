import React, { useState } from "react";
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
  } = useData();

  const [title, setTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

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

  return (
    <>
      <div className="tasks-tab">
        {/* Header - Mobile */}
        <div className="d-flex d-md-none justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Tasks</h2>
        </div>

        {/* Mobile Date Controls */}
        <div className="d-flex d-md-none gap-2 mb-4">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
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
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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

        <div className="list-group">
          {tasks.length === 0 ? (
            <div className="list-group-item text-muted text-center py-4">
              No tasks for this day
            </div>
          ) : (
            tasks.map((t) => (
            <div
              key={t._id}
              className={`list-group-item d-flex justify-content-between align-items-center ${
                t.done ? "list-group-item-success" : ""
              }`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
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
                        deleteTask(t._id);
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
                </>
              )}
            </div>
          ))
          )}
        </div>
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
            <div className="mb-0">
              <label className="form-label text-muted small">Created</label>
              <p className="mb-0">{formatTimestamp(viewingTask.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TasksTab;
