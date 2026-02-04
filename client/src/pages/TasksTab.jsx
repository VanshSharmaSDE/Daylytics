import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import InfoTooltip from "../components/InfoTooltip";
import { useData } from "../context/DataContext";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const TasksTab = ({ user }) => {
  const {
    tasks,
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

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);
  
  // Filter and sort state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const formatTimestamp = (value) => {
    if (!value) return 'N/A';
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return new Date(value).toLocaleString("en-US", options);
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category.trim(),
      dueDate: dueDate || null
    };
    
    const success = await addTask(taskData);
    if (success) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("");
      setDueDate("");
      setShowCreateModal(false);
    }
  };

  const startEdit = (task) => {
    setEditingTask({
      ...task,
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      category: task.category || "",
      dueDate: task.dueDate ? formatDate(task.dueDate) : ""
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const saveEdit = async () => {
    if (!editingTask.title.trim()) return;
    
    const updates = {
      title: editingTask.title.trim(),
      description: editingTask.description.trim(),
      priority: editingTask.priority,
      category: editingTask.category.trim(),
      dueDate: editingTask.dueDate || null
    };
    
    const success = await updateTask(editingTask._id, updates);
    if (success) cancelEdit();
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const handleBulkComplete = async () => {
    const pendingTasks = filteredTasks.filter(t => !t.done);
    for (const task of pendingTasks) {
      await toggleTask(task._id);
    }
  };

  const handleBulkDelete = async (type) => {
    setShowDeleteModal(false);
    await deleteAllTasks(type);
  };

  const handleImageUpload = async (taskId, file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setUploadingImage(taskId);
    const success = await uploadTaskImage(taskId, file);
    setUploadingImage(null);

    if (viewingTask && viewingTask._id === taskId && success) {
      const updatedTask = tasks.find(t => t._id === taskId);
      if (updatedTask) setViewingTask(updatedTask);
    }
  };

  const handleDeleteImage = async (taskId) => {
    setDeletingImage(taskId);
    const success = await deleteTaskImage(taskId);
    setDeletingImage(null);
    
    if (viewingTask && viewingTask._id === taskId && success) {
      const updatedTask = tasks.find(t => t._id === taskId);
      if (updatedTask) setViewingTask(updatedTask);
    }
  };

  // Filter and sort logic
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filterStatus === "completed" && !task.done) return false;
    if (filterStatus === "pending" && task.done) return false;
    
    // Priority filter
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description?.toLowerCase().includes(query);
      const matchCategory = task.category?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      case "newest":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const pendingTasks = tasks.filter(t => !t.done).length;
  const highPriorityPending = tasks.filter(t => !t.done && t.priority === 'high').length;

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger';
      case 'low': return 'bg-secondary';
      case 'medium':
      default: return 'bg-warning';
    }
  };

  return (
    <>
      <div className="tasks-tab">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Tasks</h2>
            <InfoTooltip content={<div>
              <strong>Advanced Task Management:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Create persistent tasks with descriptions and priorities</li>
                <li>Filter by status, priority, and search</li>
                <li>Sort by date, priority, title, or due date</li>
                <li>Optional image attachments (max 10 MB)</li>
                <li>Bulk operations for completed tasks</li>
              </ul>
            </div>} className="ms-2" />
          </div>
          
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="ri-add-line"></i><span className="d-none d-md-inline ms-2">Create Task</span>
            </button>
            {completedTasks > 0 && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowDeleteModal(true)}
                title="Delete completed tasks"
              >
                <i className="ri-delete-bin-line"></i><span className="d-none d-md-inline ms-2">Clear Completed</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{totalTasks}</h3>
                <small className="text-muted">Total Tasks</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-success">
              <div className="card-body text-center">
                <h3 className="mb-0 text-success">{completedTasks}</h3>
                <small className="text-muted">Completed</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h3 className="mb-0 text-warning">{pendingTasks}</h3>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h3 className="mb-0 text-danger">{highPriorityPending}</h3>
                <small className="text-muted">High Priority</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>
            </div>
            
            {(searchQuery || filterStatus !== "all" || filterPriority !== "all") && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Showing {filteredTasks.length} of {totalTasks} tasks
                </small>
                <button
                  className="btn btn-sm btn-link"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                    setFilterPriority("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {pendingTasks > 0 && (
          <div className="d-flex gap-2 mb-3">
            <button
              className="btn btn-sm btn-outline-success"
              onClick={handleBulkComplete}
            >
              <i className="ri-checkbox-multiple-line"></i><span className="d-none d-md-inline ms-2">Complete All Pending</span>
            </button>
          </div>
        )}

        {/* Tasks List */}
        <div className="list-group">
          {filteredTasks.length === 0 ? (
            <div className="list-group-item text-muted text-center py-5">
              {totalTasks === 0 ? (
                <>
                  <i className="ri-task-line" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="mt-3 mb-0">No tasks yet. Create your first task above!</p>
                </>
              ) : (
                <>
                  <i className="ri-filter-line" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="mt-3 mb-0">No tasks match your filters</p>
                </>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={cx(
                  "list-group-item",
                  task.done && "list-group-item-success"
                )}
              >
                {editingTask?._id === task._id ? (
                  // Edit Mode
                  <div>
                    <div className="row g-3">
                      <div className="col-12">
                        <input
                          className="form-control"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          maxLength={500}
                          autoFocus
                        />
                      </div>
                      <div className="col-12">
                        <textarea
                          className="form-control"
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          placeholder="Description"
                          maxLength={2000}
                          rows={3}
                        />
                      </div>
                      <div className="col-md-4">
                        <select
                          className="form-select"
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <input
                          className="form-control"
                          value={editingTask.category}
                          onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                          placeholder="Category"
                          maxLength={50}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="date"
                          className="form-control"
                          value={editingTask.dueDate}
                          onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={saveEdit}
                      >
                        <i className="ri-check-line"></i> Save
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={cancelEdit}
                      >
                        <i className="ri-close-line"></i> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-start gap-3 flex-grow-1">
                        {updatingTasks.has(task._id) ? (
                          <div className="spinner-border spinner-border-sm text-primary mt-1" role="status" />
                        ) : (
                          <input
                            className="form-check-input mt-1"
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(task._id)}
                          />
                        )}
                        <div className="flex-grow-1" role="button" onClick={() => setViewingTask(task)}>
                          <h6 className={cx("mb-1", task.done && "text-decoration-line-through")}>
                            {task.title}
                          </h6>
                          {task.description && (
                            <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                              {task.description.length > 100 
                                ? task.description.substring(0, 100) + '...' 
                                : task.description
                              }
                            </p>
                          )}
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className={cx("badge", getPriorityBadgeClass(task.priority))}>
                              {task.priority || 'medium'}
                            </span>
                            {task.category && (
                              <span className="badge bg-info">{task.category}</span>
                            )}
                            {task.dueDate && (
                              <span className="badge bg-secondary">
                                <i className="ri-calendar-line"></i> {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.attachment && (
                              <span className="badge bg-primary">
                                <i className="ri-attachment-line"></i> Has Attachment
                              </span>
                            )}
                            <small className="text-muted">
                              {formatTimestamp(task.createdAt)}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-1 ms-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => startEdit(task)}
                          title="Edit task"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setTaskToDelete(task._id)}
                          disabled={deletingTasks.has(task._id)}
                          title="Delete task"
                        >
                          {deletingTasks.has(task._id) ? (
                            <div className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            <i className="ri-delete-bin-line"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Task Modal */}
      <Modal
        open={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title="Task Details"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
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
                <span className={viewingTask.done ? "text-success" : "text-muted"}>
                  {viewingTask.done ? "Completed" : "Pending"}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small">Title</label>
              <p className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {viewingTask.title}
              </p>
            </div>

            {viewingTask.description && (
              <div className="mb-3">
                <label className="form-label text-muted small">Description</label>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {viewingTask.description}
                </p>
              </div>
            )}

            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label text-muted small">Priority</label>
                <p className="mb-0">
                  <span className={cx("badge", getPriorityBadgeClass(viewingTask.priority))}>
                    {viewingTask.priority || 'medium'}
                  </span>
                </p>
              </div>
              {viewingTask.category && (
                <div className="col-6">
                  <label className="form-label text-muted small">Category</label>
                  <p className="mb-0">
                    <span className="badge bg-info">{viewingTask.category}</span>
                  </p>
                </div>
              )}
            </div>

            {viewingTask.dueDate && (
              <div className="mb-3">
                <label className="form-label text-muted small">Due Date</label>
                <p className="mb-0">{formatDate(viewingTask.dueDate)}</p>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label text-muted small">Attachment</label>
              {viewingTask.attachment && viewingTask.attachment.url ? (
                <div>
                  <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '0.5rem' }}>
                    <img 
                      src={viewingTask.attachment.url} 
                      alt={viewingTask.attachment.originalName || 'Task attachment'}
                      className="img-fluid rounded"
                      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
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
                          <span className="spinner-border spinner-border-sm me-2"></span>
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
                    onChange={(e) => e.target.files && handleImageUpload(viewingTask._id, e.target.files[0])}
                    disabled={uploadingImage === viewingTask._id}
                  />
                  <small className="text-muted">Maximum file size: 10MB. Only images allowed.</small>
                  {uploadingImage === viewingTask._id && (
                    <div className="mt-2">
                      <div className="spinner-border spinner-border-sm"></div>
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

      {/* Create Task Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              <i className="ri-close-line"></i><span className="d-none d-md-inline ms-2">Cancel</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddTask}
              disabled={submittingTask || !title.trim()}
            >
              {submittingTask ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  <span className="d-none d-md-inline">Creating...</span>
                </>
              ) : (
                <>
                  <i className="ri-add-line"></i><span className="d-none d-md-inline ms-2">Create</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddTask}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                maxLength={500}
                required
                autoFocus
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task (optional)"
                maxLength={2000}
                rows={4}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Work, Personal"
                maxLength={50}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Task Modal */}
      <Modal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setTaskToDelete(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
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

      {/* Delete Completed Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Completed Tasks?"
        footer={
          <div className="d-flex gap-2 justify-content-end w-100">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleBulkDelete('completed')}
            >
              Delete All Completed
            </button>
          </div>
        }
      >
        <p className="mb-0">
          This will permanently delete all {completedTasks} completed task(s). This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default TasksTab;
