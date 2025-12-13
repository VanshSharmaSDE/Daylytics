import React, { useState, useEffect } from "react";
import api from "../api";
import { PlannerLoader } from "../components/LoadingStates";

const PlannerTab = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [plans, setPlans] = useState({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  // Get the Monday of the current week
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get date for specific day of the week
  const getDateForDay = (weekStart, dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  // Initialize current week
  useEffect(() => {
    const monday = getMondayOfWeek(new Date());
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  }, []);

  // Load planner data when week changes
  useEffect(() => {
    if (currentWeekStart) {
      loadPlanner(currentWeekStart);
    }
  }, [currentWeekStart]);

  const loadPlanner = async (weekStart) => {
    try {
      setLoading(true);
      const dateStr = weekStart.toISOString().split("T")[0];
      const res = await api.get(`/api/planner/${dateStr}`);
      setPlans(res.data.plans || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (day, value) => {
    setPlans((prev) => ({ ...prev, [day]: value }));
  };

  const savePlans = async () => {
    if (!currentWeekStart) return;

    try {
      setSaving(true);
      const dateStr = currentWeekStart.toISOString().split("T")[0];
      await api.put(`/api/planner/${dateStr}`, { plans });
    } catch (error) {
      console.error(error);
      alert("Failed to save plans");
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction) => {
    if (!currentWeekStart) return;

    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeekStart(newWeek);
  };

  const goToCurrentWeek = () => {
    const monday = getMondayOfWeek(new Date());
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const isCurrentWeek = () => {
    if (!currentWeekStart) return false;
    const thisWeekMonday = getMondayOfWeek(new Date());
    thisWeekMonday.setHours(0, 0, 0, 0);
    return currentWeekStart.getTime() === thisWeekMonday.getTime();
  };

  // Check if a day is today
  const isToday = (dayIndex) => {
    if (!currentWeekStart) return false;
    const dayDate = getDateForDay(currentWeekStart, dayIndex);
    const today = new Date();
    return (
      dayDate.getDate() === today.getDate() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getFullYear() === today.getFullYear()
    );
  };

  // Check if a day is in the past
  const isPastDay = (dayIndex) => {
    if (!currentWeekStart) return false;
    const dayDate = getDateForDay(currentWeekStart, dayIndex);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate < today;
  };

  if (loading) {
    return <PlannerLoader />;
  }

  return (
    <div className="planner-container">
      {/* Week Navigation */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigateWeek(-1)}
            >
              <i className="ri-arrow-left-line me-1"></i>Previous
            </button>
            <div className="text-center">
              <h5 className="mb-1">Weekly Planner</h5>
              <h6 className="mb-0 text-muted">
                {currentWeekStart &&
                  `${formatDate(currentWeekStart)} - ${formatDate(
                    getDateForDay(currentWeekStart, 6)
                  )}`}
              </h6>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigateWeek(1)}
            >
              Next<i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>

          {!isCurrentWeek() && (
            <div className="text-center">
              <button
                className="btn btn-outline-primary"
                onClick={goToCurrentWeek}
              >
                <i className="ri-calendar-today-line me-1"></i>Current Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Plans Section */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0">Weekly Plans</h6>
              <small className="text-muted">Plan your week ahead</small>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => loadPlanner(currentWeekStart)}
                disabled={loading || saving}
                title="Reload plans"
              >
                <i className="ri-refresh-line"></i>
              </button>
              <button
                className="btn btn-primary"
                onClick={savePlans}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-1"></i>Save Plans
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Plans */}
      <div className="row g-3">
        {daysOfWeek.map((day, index) => (
          <div className="col-12" key={day}>
            <div
              className={`card shadow-sm ${isToday(index) ? "border-primary" : ""} ${
                isPastDay(index) ? "opacity-75" : ""
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    {dayLabels[day]}
                    {isToday(index) && (
                      <span className="badge bg-primary">Today</span>
                    )}
                    {isPastDay(index) && (
                      <span className="badge bg-secondary">Past</span>
                    )}
                  </h6>
                  <small className="text-muted">
                    {currentWeekStart &&
                      formatDate(getDateForDay(currentWeekStart, index))}
                  </small>
                </div>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder={`What's your plan for ${dayLabels[day]}?`}
                  value={plans[day] || ""}
                  onChange={(e) => handlePlanChange(day, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Save Button at Bottom */}
      <div className="card shadow-sm mt-3">
        <div className="card-body text-center">
          <button
            className="btn btn-primary"
            onClick={savePlans}
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line me-1"></i>Save All Plans
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlannerTab;
