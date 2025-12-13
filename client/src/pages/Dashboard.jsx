import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import RightScreen from "../components/RightScreen";
import { useAuth } from "../context/AuthContext";
import { WorkspaceLoader } from "../components/LoadingStates";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "tasks";
  });
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const { user } = useAuth();

  // Initial workspace load
  useEffect(() => {
    // Simulate initial workspace setup
    const timer = setTimeout(() => {
      setWorkspaceLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  if (workspaceLoading) {
    return <WorkspaceLoader />;
  }

  return (
    <div className="app-container">
      <div className="container-fluid">
        <div className="row g-0">
          <aside className="col-auto px-0">
            <Sidebar activeTab={activeTab} onChange={setActiveTab} />
          </aside>
          <main className="col">
            <RightScreen 
              activeTab={activeTab} 
              onChange={setActiveTab}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
