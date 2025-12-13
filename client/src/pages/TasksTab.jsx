import React, { useEffect, useState } from "react";
import API from "../api";
import { useToast } from "../components/ToastProvider";
import { TasksLoader } from "../components/LoadingStates";
import Modal from "../components/Modal";

const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);
const cx = (...classes) => classes.filter(Boolean).join(" ");

function TasksTab() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDate());
  const [loadingData, setLoadingData] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [updatingTasks, setUpdatingTasks] = useState(() => new Set());
  const [deletingTasks, setDeletingTasks] = useState(() => new Set());
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const { addToast } = useToast();

  const formatTimestamp = (value) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return new Date(value).toLocaleString("en-US", options);
  };

  const fetchTasks = async (d = date, showLoader = false) => {
    if (showLoader) setLoadingData(true);
    try {
      const { data } = await API.get("/api/tasks", { params: { date: d } });
      setTasks(data);
      return data;
    } catch (err) {
      addToast("error", "Unable to load tasks");
    } finally {
      if (showLoader) setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTasks(date, true);
  }, [date]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      setSubmittingTask(true);
      const { data } = await API.post("/api/tasks", { title, date });
      setTasks((prev) => [...prev, data]);
      setTitle("");
      addToast("success", "Task added");
    } catch (err) {
      addToast("error", err.response?.data?.msg || "Unable to add task");
    } finally {
      setSubmittingTask(false);
    }
  };

  const toggle = async (id) => {
    if (updatingTasks.has(id)) return;

    setUpdatingTasks((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await API.patch(`/api/tasks/${id}`);
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, done: !t.done } : t))
      );
    } catch (err) {
      addToast("error", "Unable to update task");
    } finally {
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const removeTask = async (id) => {
    if (deletingTasks.has(id)) return;

    setDeletingTasks((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await API.delete(`/api/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      addToast("success", "Task removed");
    } catch (err) {
      addToast("error", "Unable to delete task");
    } finally {
      setDeletingTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteAllTasks = async () => {
    try {
      setLoadingData(true);
      setShowDeleteAllModal(false);
      const { data } = await API.delete(`/api/tasks?date=${date}`);
      setTasks([]);
      addToast("success", `Deleted ${data.count} tasks`);
    } catch (err) {
      addToast("error", "Unable to delete all tasks");
    } finally {
      setLoadingData(false);
    }
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
    if (!editTitle.trim()) {
      addToast("error", "Task title cannot be empty");
      return;
    }

    try {
      const { data } = await API.put(`/api/tasks/${editingTask._id}`, {
        title: editTitle,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? data : t))
      );
      addToast("success", "Task updated");
      cancelEdit();
    } catch (err) {
      addToast("error", err.response?.data?.msg || "Unable to update task");
    }
  };

  const toggleRecurring = async (id) => {
    if (updatingTasks.has(id)) return;

    setUpdatingTasks((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const { data } = await API.patch(`/api/tasks/${id}/recurring`);
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? data : t))
      );
      addToast("success", data.isRecurring ? "Task set as daily" : "Daily task removed");
    } catch (err) {
      addToast("error", "Unable to update task");
    } finally {
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loadingData) {
    return <TasksLoader />;
  }

  return (
    <div>
      {/* Date selector card */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="mb-1">Working Day</h5>
              <h3 className="mb-0 text-primary">{date}</h3>
            </div>
            <div className="d-flex gap-2 align-items-center">
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
          </div>
          <div className="mt-3">
            <p className="text-muted mb-1">
              <strong>{tasks.length}</strong> tasks today
            </p>
          </div>
        </div>
      </div>

      {/* Add task form */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <form onSubmit={addTask} className="d-flex gap-2">
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
            >
              {submittingTask ? "Adding..." : "Add"}
            </button>
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
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => fetchTasks(date, true)}
              title="Refresh tasks"
            >
              <i className="ri-refresh-line"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Tasks list */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Tasks</h5>
          <div className="list-group list-group-flush">
            {tasks.length === 0 && (
              <div className="list-group-item text-muted text-center py-4">
                No tasks for this day
              </div>
            )}
            {tasks.map((t) => (
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
                        className="btn btn-sm btn-success"
                        onClick={saveEdit}
                        title="Save"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
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
                            toggle(t._id);
                          }}
                        />
                      )}
                      <span
                        className={cx(
                          t.done && "text-decoration-line-through"
                        )}
                      >
                        {t.title}
                        {t.isRecurring && (
                          <i 
                            className="ri-repeat-line ms-2 text-primary" 
                            title="Daily recurring task"
                            style={{ fontSize: '0.9rem' }}
                          ></i>
                        )}
                      </span>
                    </div>
                    <div className="d-flex align-items-center ms-1 gap-2">
                      <small className="text-muted">
                        {formatTimestamp(t.createdAt)}
                      </small>
                      <button
                        className={`btn btn-sm ${t.isRecurring ? 'btn-primary' : 'btn-outline-secondary'}`}
                        type="button"
                        disabled={updatingTasks.has(t._id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRecurring(t._id);
                        }}
                        title={t.isRecurring ? "Remove from daily tasks" : "Set as daily task"}
                      >
                        <i className="ri-repeat-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(t);
                        }}
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        type="button"
                        disabled={deletingTasks.has(t._id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTask(t._id);
                        }}
                      >
                        {deletingTasks.has(t._id) ? (
                          <div
                            className="spinner-border spinner-border-sm"
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
            ))}
          </div>
        </div>
      </div>

      {/* Task details modal */}
      {viewingTask && (
        <Modal
          open={!!viewingTask}
          onClose={() => setViewingTask(null)}
          title="Task Details"
        >
          <div>
            <h6 className="mb-3">{viewingTask.title}</h6>
            <p className="text-muted mb-2">
              <strong>Status:</strong> {viewingTask.done ? "Completed" : "Pending"}
            </p>
            <p className="text-muted mb-2">
              <strong>Created:</strong> {formatTimestamp(viewingTask.createdAt)}
            </p>
            <p className="text-muted mb-0">
              <strong>Last Updated:</strong> {formatTimestamp(viewingTask.updatedAt)}
            </p>
          </div>
        </Modal>
      )}

      {/* Delete all confirmation */}
      <Modal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="Delete All Tasks?"
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
              onClick={deleteAllTasks}
            >
              Delete All
            </button>
          </div>
        }
      >
        <p className="mb-0">
          Are you sure you want to delete all {tasks.length} tasks for {date}?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default TasksTab;
