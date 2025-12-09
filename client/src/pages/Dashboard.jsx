import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import ProfileModal from "../components/ProfileModal";
import Modal from "../components/Modal";
import { useToast } from "../components/ToastProvider";
import FilesTab from "./FilesTab";

const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

const cx = (...classes) => classes.filter(Boolean).join(" ");

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDate());
  const [archives, setArchives] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  // per-task loading sets for update (toggle) and delete operations
  const [updatingTasks, setUpdatingTasks] = useState(() => new Set());
  const [deletingTasks, setDeletingTasks] = useState(() => new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "tasks";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, refreshUser } = useAuth();
  const { addToast } = useToast();

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

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

  const fetchArchives = async (showLoader = false) => {
    if (showLoader) setLoadingData(true);
    try {
      const { data } = await API.get("/api/archive");
      setArchives(data);
      return data;
    } catch (err) {
      addToast("error", "Unable to load archives");
    } finally {
      if (showLoader) setLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingData(true);
      try {
        // Load Tasks, Archives, and trigger Files data load all together
        await Promise.all([fetchTasks(date), fetchArchives()]);
      } catch (err) {
        addToast("error", "Unable to load dashboard data");
      } finally {
        if (active) setLoadingData(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [date, addToast]);

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
    if (updatingTasks.has(id)) return; // already processing

    // mark updating
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

  const rolloverYesterday = async () => {
    try {
      setLoadingData(true);
      await API.post("/api/archive/rollover");
      addToast("success", "Archived yesterday's tasks");
      await Promise.all([fetchArchives(), fetchTasks(formatDate())]);
      setDate(formatDate());
    } catch (err) {
      addToast("error", "Unable to archive");
    } finally {
      setLoadingData(false);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    window.location.href = "/login";
  };

  const greetingTitle = user?.name ? `Welcome, ${user.name}` : "Welcome back";

  return (
    <>
      <div className="container py-5 dashboard-shell d-flex flex-column">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onProfile={() => setShowProfileModal(true)}
          onLogoutRequest={() => setShowLogoutModal(true)}
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={setMobileMenuOpen}
          sidebarContent={
            activeTab !== "files" && (
              <div className="mobile-sidebar-card">
                <div className="mb-3">
                  <h5 className="mb-1">{greetingTitle}</h5>
                  <p className="text-muted mb-0">
                    Keep your tasks and completion insights in one place.
                  </p>
                </div>
                <div className="d-flex gap-4 flex-wrap mt-2 dashboard-stats dashboard-stats-compact">
                  <div className="d-flex flex-column">
                    <p className="text-muted mb-1">Working day</p>
                    <h2 className="mb-0">{date}</h2>
                  </div>
                  <div className="d-flex flex-column">
                    <p className="text-muted mb-1">Tasks today</p>
                    <strong>{tasks.length}</strong>
                  </div>
                  <div className="d-flex flex-column">
                    <p className="text-muted mb-1">Archive entries</p>
                    <strong>{archives.length}</strong>
                  </div>
                </div>
              </div>
            )
          }
        />
        {loadingData && activeTab !== "files" && (
          <Loader message="Syncing your day..." />
        )}
        <div className="mobile-quick-add panel panel-shadow d-md-none">
          <div className="mb-3">
            <h5 className="mb-1">Add a task</h5>
            <small className="text-muted">
              Capture today's priorities on the go.
            </small>
          </div>
          <div className="mobile-date-controls d-flex gap-2 mb-3">
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
          <form
            onSubmit={addTask}
            className="task-form d-flex flex-column gap-2"
          >
            <input
              className="form-control w-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task for today"
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={submittingTask}
            >
              {submittingTask ? "Adding..." : "Save task"}
            </button>
          </form>
        </div>
        {activeTab !== "files" && (
          <div className="dashboard-hero panel panel-shadow mb-4 d-none d-md-block">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
              <div>
                <h3 className="mb-1">{greetingTitle}</h3>
                <p className="text-muted mb-0">
                  Keep your tasks and completion insights in one place.
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap align-items-center">
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
            <div className="d-flex gap-4 flex-wrap mt-2 dashboard-stats">
              <div className="d-flex flex-column">
                <p className="text-muted mb-1">Working day</p>
                <h2 className="mb-0">{date}</h2>
              </div>
              <div className="d-flex flex-column">
                <p className="text-muted mb-1">Tasks today</p>
                <strong>{tasks.length}</strong>
              </div>
              <div className="d-flex flex-column">
                <p className="text-muted mb-1">Archive entries</p>
                <strong>{archives.length}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <section className="panel panel-shadow mb-4 tabbed-section active-tab">
            <div className="panel-header d-flex justify-content-between align-items-center">
              <div className="w-50">
                <h5 className="mb-0">Tasks</h5>
                <small>Track what needs attention before midnight.</small>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <form
                  onSubmit={addTask}
                  className="task-form d-none d-md-flex flex-wrap gap-2 align-items-center"
                >
                  <input
                    className="form-control flex-fill"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a task for today"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary flex-shrink-0"
                    disabled={submittingTask}
                  >
                    {submittingTask ? "Adding..." : "Add"}
                  </button>
                  {tasks.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger d-flex  gap-1 align-items-center"
                      onClick={() => setShowDeleteAllModal(true)}
                    >
                      <i class="ri-delete-bin-line"></i> All
                    </button>
                  )}
                  <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => fetchTasks(date, true)}
                  title="Refresh tasks"
                >
                  <i className="ri-refresh-line"></i>
                </button>
                </form>
              </div>
            </div>

            <div className="list-group">
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
                              toggle(t._id);
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
                            removeTask(t._id);
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
              ))}
            </div>
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="panel panel-shadow tabbed-section active-tab">
            <div className="panel-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Analytics</h5>
                <small>
                  Daily completion history (auto-archived at midnight)
                </small>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => fetchArchives(true)}
                title="Refresh analytics"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>

            <div className="analytics-grid">
              {archives.slice(0, 8).map((a) => (
                <div key={a._id} className="analytics-card p-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="mb-0">{a.date}</h6>
                    <span className="github-badge">
                      {a.completed}/{a.total}
                    </span>
                  </div>
                  <div className="display-6 fw-bold">{a.percentage}%</div>
                  <p className="text-muted mb-0">Completion rate</p>
                </div>
              ))}
              {archives.length === 0 && (
                <div className="text-muted">No archives yet.</div>
              )}
            </div>
          </section>
        )}

        <div style={{ display: activeTab === "files" ? "block" : "none" }}>
          <FilesTab dashboardLoading={loadingData} />
        </div>
      </div>

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdated={refreshUser}
      />

      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Ready to sign out?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={confirmLogout}
            >
              Logout
            </button>
          </div>
        }
      >
        <p className="mb-0">You'll be redirected to the login screen.</p>
      </Modal>

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
              onClick={deleteAllTasks}
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
                    toggle(viewingTask._id);
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

      {/* Version Display */}
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          right: "20px",
          fontSize: "11px",
          opacity: 0.7,
          padding: "6px 12px",
          borderRadius: "20px",
          backgroundColor: "var(--bs-body-bg)",
          border: "1px solid var(--bs-border-color)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontWeight: "500",
          color: "var(--bs-body-color)",
          zIndex: 1000,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        v1.4.6
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "10px",
          right: "80px",
          fontSize: "11px",
          opacity: 0.7,
          padding: "6px 12px",
          borderRadius: "20px",
          backgroundColor: "var(--bs-body-bg)",
          border: "1px solid var(--bs-border-color)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontWeight: "500",
          color: "var(--bs-body-color)",
          zIndex: 1000,
          userSelect: "none",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
        onClick={() =>
          window.open("https://github.com/VanshSharmaSDE/Daylytics/", "_blank")
        }
      >
        Github
      </div>
    </>
  );
};

export default Dashboard;
