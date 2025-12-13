import React from 'react';

// Main workspace loader - shown during initial app load
export const WorkspaceLoader = () => {
  return (
    <div className="workspace-loader">
      <div className="workspace-loader-content">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="mb-2">Preparing your workspace</h4>
        <p className="text-muted">Setting up your daily productivity hub...</p>
      </div>
    </div>
  );
};

// Content loaders - shown in right screen for specific tabs
export const TasksLoader = () => {
  return (
    <div className="content-loader">
      <div className="content-loader-inner">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mb-1">Syncing your day</h5>
        <p className="text-muted mb-0">Loading tasks and updates...</p>
      </div>
    </div>
  );
};

export const AnalyticsLoader = () => {
  return (
    <div className="content-loader">
      <div className="content-loader-inner">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mb-1">Crunching latest data</h5>
        <p className="text-muted mb-0">Analyzing your productivity...</p>
      </div>
    </div>
  );
};

export const FilesLoader = () => {
  return (
    <div className="content-loader">
      <div className="content-loader-inner">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mb-1">Loading your files and folders</h5>
        <p className="text-muted mb-0">Fetching your documents...</p>
      </div>
    </div>
  );
};

export const PlannerLoader = () => {
  return (
    <div className="content-loader">
      <div className="content-loader-inner">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mb-1">Loading your weekly planner</h5>
        <p className="text-muted mb-0">Fetching your plans...</p>
      </div>
    </div>
  );
};

export const FlowChartLoader = () => {
  return (
    <div className="content-loader">
      <div className="content-loader-inner">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mb-1">Loading your flow charts</h5>
        <p className="text-muted mb-0">Fetching your workflows...</p>
      </div>
    </div>
  );
};

// GitHub-style progress bar for Files tab
export const ProgressBar = () => {
  return (
    <div className="github-progress-bar">
      <div className="github-progress-bar-inner"></div>
    </div>
  );
};
