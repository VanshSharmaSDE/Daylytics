import React from "react";
import { useData } from "../context/DataContext";

const AnalyticsTab = () => {
  const { archives, fetchArchives } = useData();

  return (
    <div className="analytics-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Analytics</h2>
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
    </div>
  );
};

export default AnalyticsTab;
