import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import API from "../api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "./AuthContext";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

export const DataProvider = ({ children }) => {
  const { addToast } = useToast();
  const { user } = useAuth();

  // Global loading state
  const [globalLoading, setGlobalLoading] = useState(true);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [date, setDate] = useState(formatDate());
  const [tasksLoading, setTasksLoading] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [updatingTasks, setUpdatingTasks] = useState(() => new Set());
  const [deletingTasks, setDeletingTasks] = useState(() => new Set());

  // Analytics state
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);

  // Files state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState("");
  const [pinningFiles, setPinningFiles] = useState(() => new Set());
  const [pinningFolders, setPinningFolders] = useState(() => new Set());
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Bucket state
  const [bucketFiles, setBucketFiles] = useState([]);
  const [bucketLoading, setBucketLoading] = useState(false);

  // Profile state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // View preferences
  // task view mode removed (single list view now)

  const hasLoadedInitially = useRef(false);
  const hasLoadedPreferences = useRef(false);
  const folderCache = useRef({});
  const fileCache = useRef({});

  // ========================
  // TASK OPERATIONS
  // ========================

  const fetchTasks = async (targetDate = date, showLoader = false) => {
    if (showLoader) setTasksLoading(true);
    try {
      const { data } = await API.get("/api/tasks", {
        params: { date: targetDate },
      });
      setTasks(data);
      return data;
    } catch (err) {
      addToast("error", "Unable to load tasks");
      return [];
    } finally {
      if (showLoader) setTasksLoading(false);
    }
  };

  const addTask = async (title) => {
    if (!title) return false;
    try {
      setSubmittingTask(true);
      const { data } = await API.post("/api/tasks", { title, date });
      setTasks((prev) => [...prev, data]);
      addToast("success", "Task added");
      return true;
    } catch (err) {
      addToast("error", err.response?.data?.msg || "Unable to add task");
      return false;
    } finally {
      setSubmittingTask(false);
    }
  };

  const toggleTask = async (id) => {
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

  // Removed toggleDaily: recurring daily task feature removed


  const updateTask = async (id, updates) => {
    try {
      await API.put(`/api/tasks/${id}`, updates);
      await fetchTasks(date);
      addToast("success", "Task updated");
      return true;
    } catch (err) {
      addToast("error", err.response?.data?.msg || "Unable to update task");
      return false;
    }
  };

  const deleteTask = async (id) => {
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
      const { data } = await API.delete(`/api/tasks?date=${date}`);
      setTasks([]);
      addToast("success", `Deleted ${data.count} tasks`);
    } catch (err) {
      addToast("error", "Unable to delete all tasks");
    }
  };

  const uploadTaskImage = async (taskId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const { data } = await API.post(`/api/tasks/${taskId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update task in state
      setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      addToast('success', 'Image attached successfully');
      return true;
    } catch (err) {
      addToast('error', err.response?.data?.msg || 'Failed to upload image');
      return false;
    }
  };

  const deleteTaskImage = async (taskId) => {
    try {
      const { data } = await API.delete(`/api/tasks/${taskId}/upload`);
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      addToast('success', 'Image removed');
      return true;
    } catch (err) {
      addToast('error', 'Failed to remove image');
      return false;
    }
  };

  // ========================
  // ANALYTICS OPERATIONS
  // ========================

  const fetchArchives = async (showLoader = false) => {
    if (showLoader) setArchivesLoading(true);
    try {
      const { data } = await API.get("/api/archive");
      setArchives(data);
      return data;
    } catch (err) {
      addToast("error", "Unable to load archives");
      return [];
    } finally {
      if (showLoader) setArchivesLoading(false);
    }
  };

  // ========================
  // PROFILE OPERATIONS
  // ========================

  const updateProfile = async (name, email, onUpdated) => {
    try {
      setSavingProfile(true);
      await API.put("/api/auth/profile", { name, email });
      addToast("success", "Profile updated");
      if (onUpdated) await onUpdated();
      return true;
    } catch (err) {
      addToast("error", err.response?.data?.msg || "Unable to update profile");
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      addToast("error", "Please fill in both password fields");
      return false;
    }

    if (newPassword.length < 6) {
      addToast("error", "New password must be at least 6 characters");
      return false;
    }

    try {
      setSavingPassword(true);
      await API.put("/api/auth/password", { currentPassword, newPassword });
      addToast("success", "Password updated successfully");
      return true;
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || err.message || "Unable to update password";
      addToast("error", errorMsg);
      return false;
    } finally {
      setSavingPassword(false);
    }
  };

  // ========================
  // FILE OPERATIONS
  // ========================

  const sortFiles = (filesToSort) => {
    return [...filesToSort].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1;
      }

      let compareValue = 0;

      switch (sortBy) {
        case "title":
          compareValue = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          compareValue = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "updatedAt":
          compareValue = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case "size":
          compareValue = (a.content?.length || 0) - (b.content?.length || 0);
          break;
        default:
          compareValue = new Date(b.updatedAt) - new Date(a.updatedAt);
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });
  };

  const sortFolders = (foldersToSort) => {
    return [...foldersToSort].sort((a, b) => {
      // Pinned folders should come first
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1;
      }
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  };

  const fetchFolders = async () => {
    const folderKey = currentFolder || "root";

    try {
      const params = currentFolder ? { parentFolder: currentFolder } : {};
      const response = await API.get("/api/folders", { params });
      const fetchedFolders = response.data;

      const sorted = sortFolders(fetchedFolders);
      folderCache.current[folderKey] = sorted;
      setFolders(sorted);
      return sorted;
    } catch (error) {
      addToast("error", "Failed to load folders");
      return [];
    }
  };

  const fetchFiles = async () => {
    const folderKey = currentFolder || "root";

    try {
      const params = currentFolder
        ? { folder: currentFolder }
        : { folder: "null" };
      const response = await API.get("/api/files", { params });
      const fetchedFiles = sortFiles(response.data);

      fileCache.current[folderKey] = fetchedFiles;
      setFiles(fetchedFiles);
      return fetchedFiles;
    } catch (error) {
      addToast("error", "Failed to load files");
      return [];
    }
  };

  const createFile = async (title, content) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Creating file...");

      const payload = { title, content };
      if (currentFolder) {
        payload.folder = currentFolder;
      }

      const response = await API.post("/api/files", payload);
      await fetchFiles();
      addToast("success", "File created successfully");
      return response.data;
    } catch (error) {
      addToast("error", error.response?.data?.msg || "Failed to create file");
      return null;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const updateFile = async (id, updates) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Updating file...");

      await API.put(`/api/files/${id}`, updates);
      await fetchFiles();
      addToast("success", "File updated successfully");
      return true;
    } catch (error) {
      addToast("error", error.response?.data?.msg || "Failed to update file");
      return false;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const deleteFile = async (id) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Deleting file...");

      await API.delete(`/api/files/${id}`);
      await fetchFiles();
      addToast("success", "File deleted successfully");
      return true;
    } catch (error) {
      addToast("error", "Failed to delete file");
      return false;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const togglePinFile = async (id) => {
    if (pinningFiles.has(id)) return;

    setPinningFiles((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const file = files.find((f) => f._id === id);
      if (!file) return;

      await API.put(`/api/files/${id}`, { isPinned: !file.isPinned });
      await fetchFiles();
      addToast("success", file.isPinned ? "File unpinned" : "File pinned");
    } catch (error) {
      addToast("error", "Failed to update pin status");
    } finally {
      setPinningFiles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const uploadFileAttachments = async (fileId, attachmentFiles) => {
    try {
      setOperationLoading(true);
      setOperationMessage('Uploading attachments...');

      const formData = new FormData();
      for (const file of attachmentFiles) {
        formData.append('files', file);
      }

      const { data } = await API.post(`/api/files/${fileId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchFiles();
      addToast('success', `${attachmentFiles.length} file(s) attached successfully`);
      return data;
    } catch (err) {
      addToast('error', err.response?.data?.msg || 'Failed to upload attachments');
      return null;
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const deleteFileAttachment = async (fileId, attachmentId) => {
    try {
      setOperationLoading(true);
      setOperationMessage('Removing attachment...');

      await API.delete(`/api/files/${fileId}/attachments/${attachmentId}`);
      await fetchFiles();
      addToast('success', 'Attachment removed');
      return true;
    } catch (err) {
      addToast('error', 'Failed to remove attachment');
      return false;
    } finally {
      setOperationLoading(false);
      setOperationMessage('');
    }
  };

  const createFolder = async (name) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Creating folder...");

      const payload = { name };
      if (currentFolder) {
        payload.parentFolder = currentFolder;
      }

      const response = await API.post("/api/folders", payload);
      await fetchFolders();
      addToast("success", "Folder created successfully");
      return response.data;
    } catch (error) {
      addToast("error", error.response?.data?.msg || "Failed to create folder");
      return null;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const renameFolder = async (id, newName) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Renaming folder...");

      await API.put(`/api/folders/${id}`, { name: newName });
      await fetchFolders();
      addToast("success", "Folder renamed successfully");
      return true;
    } catch (error) {
      addToast("error", error.response?.data?.msg || "Failed to rename folder");
      return false;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const deleteFolder = async (id) => {
    try {
      setOperationLoading(true);
      setOperationMessage("Deleting folder...");

      await API.delete(`/api/folders/${id}`);

      // Invalidate all caches as folder structure changed
      folderCache.current = {};
      fileCache.current = {};

      await fetchFolders();
      await fetchFiles();
      addToast("success", "Folder deleted successfully");
      return true;
    } catch (error) {
      addToast("error", error.response?.data?.msg || "Failed to delete folder");
      return false;
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const togglePinFolder = async (id) => {
    if (pinningFolders.has(id)) return;

    setPinningFolders((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const folderKey = currentFolder || "root";
    const prevList = folderCache.current[folderKey] || folders;
    // Optimistic update
    const optimistic = prevList.map((f) =>
      f._id === id ? { ...f, isPinned: !f.isPinned } : f
    );
    const sortedOptimistic = sortFolders(optimistic);
    folderCache.current[folderKey] = sortedOptimistic;
    setFolders(sortedOptimistic);

    try {
      const folder = prevList.find((f) => f._id === id);
      if (!folder) return;

      await API.put(`/api/folders/${id}`, { isPinned: !folder.isPinned });
      // Refresh to ensure canonical data
      await fetchFolders();
      addToast(
        "success",
        folder.isPinned ? "Folder unpinned" : "Folder pinned"
      );
    } catch (error) {
      // Revert optimistic update
      folderCache.current[folderKey] = prevList;
      setFolders(sortFolders(prevList));
      addToast("error", "Failed to update pin status");
    } finally {
      setPinningFolders((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const navigateToFolder = (folderId, folderName) => {
    if (folderId === null) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      setCurrentFolder(folderId);
      setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const navigateToPath = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolder(newPath[newPath.length - 1].id);
      setFolderPath(newPath);
    }
  };

  // ========================
// BUCKET OPERATIONS
// ========================

const fetchBucket = async (showLoader = false) => {
  if (showLoader) {
    setBucketLoading(true);
  }

  try {
    const res = await import("../api/bucket").then((m) => m.listBucket());
    const data = res?.data ?? res;
    setBucketFiles(data);
    return data;
  } catch (err) {
    console.error("fetchBucket error:", err);

    // Improve error messages for common deployment issues
    let msg = "Unable to load bucket";
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.msg;

    if (status === 503) {
      msg = "Bucket service unavailable (storage provider not configured)";
    } else if (status === 401) {
      msg = "Not authenticated. Please login again.";
    } else if (serverMsg) {
      msg = serverMsg;
    } else if (err?.message) {
      msg = err.message;
    }

    addToast("error", msg);
    return [];
  } finally {
    if (showLoader) {
      setBucketLoading(false);
    }
  }
};

const pushToBucket = async (formData, onUploadProgress) => {
  console.debug('pushToBucket: start');
  setOperationLoading(true);
  setOperationMessage("Uploading file...");
  try {
    const mod = await import("../api/bucket");
    const pushFn = mod?.pushBucket || mod?.default?.pushBucket;
    if (typeof pushFn !== 'function') {
      console.warn('pushToBucket: pushBucket missing from module, falling back to direct API call');
      // fallback to direct API call to preserve functionality
      const { data } = await API.post('/api/bucket/push', formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      });
      setBucketFiles((prev) => [data, ...prev]);
      addToast("success", "Uploaded to bucket");
      return data;
    }

    const res = await pushFn(formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    const data = res?.data ?? res;
    // Update state locally to avoid refetch
    setBucketFiles((prev) => [data, ...prev]);
    addToast("success", "Uploaded to bucket");
    return data;
  } catch (err) {
    console.error('pushToBucket error', err);
    addToast("error", err?.response?.data?.msg || "Upload failed");
    throw err;
  } finally {
    setOperationLoading(false);
    setOperationMessage("");
    console.debug('pushToBucket: end');
  }
};

const pullFromBucket = async (id) => {
  // Use a local loader in the caller (BucketTab) instead of the global operation loader
  try {
    const res = await import("../api/bucket").then((m) => m.pullBucket(id));
    return res?.data ?? res;
  } catch (err) {
    console.error("pullFromBucket error:", err);
    let msg = "Unable to download file";
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.msg;

    if (status === 503) msg = "File storage is not configured on the server";
    else if (status === 401) msg = "Not authenticated. Please login again.";
    else if (serverMsg) msg = serverMsg;
    else if (err?.message) msg = err.message;

    addToast("error", msg);
    throw err;
  }
};

const deleteFromBucket = async (id) => {
  console.debug('deleteFromBucket: start', id);
  setOperationLoading(true);
  setOperationMessage("Deleting file...");
  try {
    const mod = await import("../api/bucket");
    const delFn = mod?.deleteBucket || mod?.default?.deleteBucket;
    if (typeof delFn === 'function') {
      await delFn(id);
    } else {
      console.warn('deleteFromBucket: deleteBucket missing from module, falling back to direct API call');
      await API.delete(`/api/bucket/delete/${id}`);
    }

    // Remove locally without refetching
    setBucketFiles((prev) => prev.filter((f) => f._id !== id));
    addToast("success", "Deleted from bucket");
    return true;
  } catch (err) {
    console.error('deleteFromBucket error', err);
    addToast("error", err?.response?.data?.msg || "Delete failed");
    return false;
  } finally {
    setOperationLoading(false);
    setOperationMessage("");
    console.debug('deleteFromBucket: end', id);
  }
};


  // ========================
  // EFFECTS
  // ========================

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await API.get("/api/auth/me");
        const settings = response.data.settings || {};

        if (settings.fileSortBy) {
          setSortBy(settings.fileSortBy);
        }
        if (settings.fileSortOrder) {
          setSortOrder(settings.fileSortOrder);
        }
        hasLoadedPreferences.current = true;
      } catch (error) {
        console.error("Failed to load user preferences:", error);
        hasLoadedPreferences.current = true;
      }
    };

    loadUserPreferences();
  }, []);

  // Save sorting preferences when they change
  useEffect(() => {
    if (!hasLoadedPreferences.current) return;

    const savePreferences = async () => {
      try {
        await API.put("/api/auth/settings", {
          settings: {
            fileSortBy: sortBy,
            fileSortOrder: sortOrder,
          },
        });
      } catch (error) {
        console.error("Failed to save sorting preferences:", error);
      }
    };

    savePreferences();
  }, [sortBy, sortOrder]);

  // Initial data load
  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) {
      setGlobalLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setGlobalLoading(true);
      try {
        await Promise.all([
          fetchTasks(date),
          fetchArchives(),
          fetchFolders(),
          fetchFiles(),
        ]);
        hasLoadedInitially.current = true;
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setGlobalLoading(false);
      }
    };

    loadInitialData();
  }, [user]); // Re-run when user changes (login/logout)

  // Debug: log operation loader changes to help trace unexpected overlay triggers
  useEffect(() => {
    console.debug('operationLoading changed', { operationLoading, operationMessage });
  }, [operationLoading, operationMessage]);

  // Fetch tasks when date changes
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user) return;

    setTasksLoading(true);
    fetchTasks(date).finally(() => setTasksLoading(false));
  }, [date, user]);

  // Fetch files/folders when currentFolder changes
  useEffect(() => {
    // Skip initial load since it's handled in the main useEffect
    if (!hasLoadedInitially.current) return;

    const folderKey = currentFolder || "root";

    if (folderCache.current[folderKey] && fileCache.current[folderKey]) {
      // Use cached data for instant navigation
      setFolders(folderCache.current[folderKey]);
      setFiles(fileCache.current[folderKey]);
      setNavigating(false);
    } else {
      // Fetch fresh data silently (no loader during navigation)
      setNavigating(true);
      Promise.all([fetchFolders(), fetchFiles()]).finally(() =>
        setNavigating(false)
      );
    }
  }, [currentFolder]);

  // Update view mode when user settings change
  useEffect(() => {
    if (user?.settings?.['task-view-mode']) {
      // preserve existing settings consideration removed for task-view-mode
    }
  }, [user]);

  // Re-sort files when sort settings change
  useEffect(() => {
    if (files.length > 0) {
      setFiles(sortFiles(files));
    }
  }, [sortBy, sortOrder]);

  const value = {
    // Global
    globalLoading,

    // Tasks
    tasks,
    date,
    setDate,
    tasksLoading,
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

    // Analytics
    archives,
    archivesLoading,
    fetchArchives,

    // Profile
    savingProfile,
    savingPassword,
    updateProfile,
    updatePassword,

    // Files
    files,
    folders,
    currentFolder,
    folderPath,
    filesLoading,
    navigating,
    operationLoading,
    operationMessage,
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
    uploadFileAttachments,
    deleteFileAttachment,
    createFolder,
    renameFolder,
    deleteFolder,
    togglePinFolder,
    navigateToFolder,
    navigateToPath,

    // Bucket
    bucketFiles,
    bucketLoading,
    fetchBucket,
    pushToBucket,
    pullFromBucket,
    deleteFromBucket,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
