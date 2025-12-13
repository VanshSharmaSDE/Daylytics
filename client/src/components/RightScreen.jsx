import React from "react";
import { useAuth } from "../context/AuthContext";
import TasksTab from "../pages/TasksTab";
import AnalyticsTab from "../pages/AnalyticsTab";
import FilesTab from "../pages/FilesTab";
import PlannerTab from "../pages/PlannerTab";
import DictionaryTab from "../pages/DictionaryTab";
import FlowChartTab from "../pages/FlowChartTab";

function RightScreen({ activeTab, onChange }) {
  const { user } = useAuth();

  const safeActiveTab =
    activeTab === "tasks" ||
    activeTab === "analytics" ||
    activeTab === "files" ||
    activeTab === "planner" ||
    activeTab === "dictionary" ||
    activeTab === "flowchart"
      ? activeTab
      : "tasks";

  const titleMap = { 
    tasks: "Tasks", 
    analytics: "Analytics", 
    files: "Files",
    planner: "Weekly Planner",
    dictionary: "Dictionary",
    flowchart: "Flow Chart",
  };

  const renderContent = () => {
    switch (safeActiveTab) {
      case "tasks":
        return <TasksTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "files":
        return <FilesTab />;
      case "planner":
        return <PlannerTab />;
      case "dictionary":
        return <DictionaryTab />;
      case "flowchart":
        return <FlowChartTab />;
      default:
        return <TasksTab />;
    }
  };

  const contentClassName = `content${safeActiveTab === "flowchart" ? " content--flowchart" : ""}`;

  return (
    <div className="right-screen p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <h3 className="m-0 fw-bold">{titleMap[activeTab]}</h3>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted d-none d-md-block">
            <i className="ri-user-3-line me-1"></i>
            {user?.name || user?.email}
          </span>
        </div>
      </div>
      <div className={contentClassName}>{renderContent()}</div>
    </div>
  );
}

export default RightScreen;
