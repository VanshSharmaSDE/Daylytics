import React, { useEffect, useState } from "react";
import API from "../api";
import { useToast } from "../components/ToastProvider";
import { AnalyticsLoader } from "../components/LoadingStates";

function AnalyticsTab() {
  const [archives, setArchives] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const { addToast } = useToast();

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
    fetchArchives(true);
  }, []);

  if (loadingData) {
    return <AnalyticsLoader />;
  }

  return (
    <div>
      {/* Header card */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">Daily Completion History</h5>
              <p className="text-muted mb-0">
                Tasks are automatically archived at midnight
              </p>
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
        </div>
      </div>

      {/* Analytics grid */}
      {archives.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center text-muted py-5">
            <i className="ri-bar-chart-box-line" style={{ fontSize: "3rem" }}></i>
            <p className="mt-3 mb-0">No archives yet. Complete some tasks to see your analytics!</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {archives.map((a) => (
            <div key={a._id} className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm h-100 analytics-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 fw-bold">{a.date}</h6>
                    <span className="badge bg-primary">
                      {a.completed}/{a.total}
                    </span>
                  </div>
                  <div className="display-6 fw-bold text-primary mb-1">
                    {a.percentage}%
                  </div>
                  <p className="text-muted mb-0 small">Completion rate</p>
                  
                  {/* Progress bar */}
                  <div className="progress mt-3" style={{ height: "8px" }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${a.percentage}%` }}
                      aria-valuenow={a.percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnalyticsTab;
