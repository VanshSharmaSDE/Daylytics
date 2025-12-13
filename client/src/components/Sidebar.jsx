import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileModal from "./ProfileModal";

function Sidebar({ activeTab, onChange }) {
  const { logout, user, refreshUser } = useAuth();
  const { toggleTheme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const closeMobileSidebar = () => {
    const offcanvasElement = document.getElementById('mobileSidebar');
    if (!offcanvasElement) return;
    
    // Try multiple methods to close the offcanvas
    try {
      // Method 1: Bootstrap instance
      if (window.bootstrap?.Offcanvas) {
        const instance = window.bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
        instance.hide();
      }
      // Method 2: Trigger Bootstrap's dismiss
      const closeBtn = offcanvasElement.querySelector('[data-bs-dismiss="offcanvas"]');
      if (closeBtn) {
        closeBtn.click();
      }
    } catch (error) {
      console.error('Error closing sidebar:', error);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar d-none d-md-flex flex-column p-3 vh-100">
        <div className="d-flex align-items-center mb-4">
          <i className="ri-dashboard-line fs-3 me-2 text-primary"></i>
          <span className="fs-5 fw-bold">Daylytics</span>
        </div>
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "tasks" ? "active" : ""
              }`}
              onClick={() => onChange("tasks")}
            >
              <i className="ri-checkbox-multiple-line me-2"></i> Tasks
            </button>
          </li>
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "analytics" ? "active" : ""
              }`}
              onClick={() => onChange("analytics")}
            >
              <i className="ri-bar-chart-box-line me-2"></i> Analytics
            </button>
          </li>
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "files" ? "active" : ""
              }`}
              onClick={() => onChange("files")}
            >
              <i className="ri-folder-4-line me-2"></i> Files
            </button>
          </li>
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "planner" ? "active" : ""
              }`}
              onClick={() => onChange("planner")}
            >
              <i className="ri-calendar-line me-2"></i> Planner
            </button>
          </li>
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "dictionary" ? "active" : ""
              }`}
              onClick={() => onChange("dictionary")}
            >
              <i className="ri-book-open-line me-2"></i> Dictionary
            </button>
          </li>
          <li className="nav-item mb-1">
            <button
              className={`nav-link btn w-100 d-flex align-items-center ${
                activeTab === "flowchart" ? "active" : ""
              }`}
              onClick={() => onChange("flowchart")}
            >
              <i className="ri-flow-chart me-2"></i> Flow Chart
            </button>
          </li>
        </ul>

        <div className="mt-auto">
          <div className="d-flex gap-2 mb-3">
            <button
              className="btn btn-outline-secondary w-50"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              <i className="ri-contrast-2-line"></i>
            </button>
            <button
              className="btn btn-outline-primary w-50"
              onClick={() => setShowProfileModal(true)}
              title="Profile"
            >
              <i className="ri-user-3-line"></i>
            </button>
          </div>
          <a
            href="https://github.com/vansh-codes/Daylytics"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center mb-2"
          >
            <i className="ri-github-fill me-2"></i> GitHub
          </a>
          <button
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
            onClick={logout}
          >
            <i className="ri-logout-box-line me-2"></i> Logout
          </button>
          <div className="mt-3 small text-muted text-center">
            v1.5.0 • © {new Date().getFullYear()}
          </div>
        </div>
      </div>

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdated={refreshUser}
      />

      {/* Mobile navbar */}
      <nav className="d-md-none navbar px-3 sticky-top">
        <div className="d-flex justify-content-between align-items-center w-100">
          <button
            className="btn btn-outline-primary"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#mobileSidebar"
            aria-controls="mobileSidebar"
          >
            <i className="ri-menu-line"></i>
          </button>
          <span className="navbar-brand mb-0 fw-bold">Daylytics</span>
        </div>
      </nav>

      {/* Mobile offcanvas */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
        style={{ width: '280px' }}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title fw-bold" id="mobileSidebarLabel">
            <i className="ri-dashboard-line me-2 text-primary"></i>
            Daylytics
          </h5>
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="list-unstyled">
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "tasks" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("tasks");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-checkbox-multiple-line me-2"></i>Tasks
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "analytics" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("analytics");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-bar-chart-box-line me-2"></i>Analytics
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "files" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("files");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-folder-4-line me-2"></i>Files
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "planner" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("planner");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-calendar-line me-2"></i>Planner
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "dictionary" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("dictionary");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-book-open-line me-2"></i>Dictionary
              </button>
            </li>
            <li className="mb-2">
              <button
                className={`btn w-100 d-flex align-items-center ${
                  activeTab === "flowchart" ? "btn-primary text-white" : "btn-light"
                }`}
                onClick={() => {
                  onChange("flowchart");
                  closeMobileSidebar();
                }}
              >
                <i className="ri-flow-chart me-2"></i>Flow Chart
              </button>
            </li>
          </ul>

          <div className="mt-auto pt-3">
            <div className="d-flex gap-2 mb-3">
              <button
                className="btn btn-outline-secondary w-50"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                <i className="ri-contrast-2-line"></i> Theme
              </button>
              <button
                className="btn btn-outline-primary w-50"
                onClick={() => {
                  setShowProfileModal(true);
                  closeMobileSidebar();
                }}
                title="Profile"
              >
                <i className="ri-user-3-line"></i> Profile
              </button>
            </div>
            <a
              href="https://github.com/vansh-codes/Daylytics"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center mb-2"
            >
              <i className="ri-github-fill me-2"></i> GitHub
            </a>
            <button
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
              onClick={() => {
                logout();
                closeMobileSidebar();
              }}
            >
              <i className="ri-logout-box-line me-2"></i> Logout
            </button>
            <div className="mt-3 small text-muted text-center">
              v1.5.0 • © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
