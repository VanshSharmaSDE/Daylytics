import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Navbar from "../components/Navbar";
import ProfileModal from "../components/ProfileModal";
import Modal from "../components/Modal";
import FilesTab from "./FilesTab";
import TasksTab from "./TasksTab";
import AnalyticsTab from "./AnalyticsTab";

const Dashboard = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "tasks";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, refreshUser } = useAuth();
  const { globalLoading, operationLoading, operationMessage } = useData();
  const navigate = useNavigate();

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

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
          onTabChange={setActiveTab}
          onProfile={() => setShowProfileModal(true)}
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
        v1.5.7
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
