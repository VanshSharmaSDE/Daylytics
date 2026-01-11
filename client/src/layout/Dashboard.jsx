import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Navbar from "./Navbar";
import ProfileModal from "../components/ProfileModal";
import Modal from "../components/Modal";
import FilesTab from "../pages/FilesTab";
import TasksTab from "../pages/TasksTab";
import AnalyticsTab from "../pages/AnalyticsTab";
import BucketTab from "../pages/BucketTab";
// import EditorTab from "../pages/EditorTab";
import Settings from "../pages/Settings";

const Dashboard = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, refreshUser } = useAuth();
  const { globalLoading, operationLoading, operationMessage } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const activeTab = location.pathname.split("/")[2] || "tasks";

  // Handle tab changes by navigating to new URL
  const handleTabChange = (tab) => {
    navigate(`/dashboard/${tab}`);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className="container py-5 dashboard-shell d-flex flex-column">
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onProfile={() => handleTabChange("settings")}
          onLogoutRequest={() => setShowLogoutModal(true)}
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={setMobileMenuOpen}
        />

        {activeTab === "tasks" && <TasksTab user={user} />}

        {activeTab === "analytics" && <AnalyticsTab />}

        <div style={{ display: activeTab === "files" ? "block" : "none" }}>
          <FilesTab />
        </div>

        <div style={{ display: activeTab === "bucket" ? "block" : "none" }}>
          <BucketTab />
        </div>

        {/* {activeTab === "editor" && <EditorTab />} */}

        {activeTab === "settings" && <Settings />}
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
        v1.7.9
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
