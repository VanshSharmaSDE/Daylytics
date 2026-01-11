import React, { useState } from "react";
import { useData } from "../context/DataContext";
import InfoTooltip from "../components/InfoTooltip";

const AnalyticsTab = () => {
  const { archives, fetchArchives } = useData();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Generate year options (from 2025 to next 10 years)
  const yearOptions = [];
  for (let year = 2025; year <= 2025 + 10; year++) {
    yearOptions.push(year);
  }

  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Filter archives by selected year and month
  const filteredArchives = archives.filter(archive => {
    const archiveDate = new Date(archive.date);
    return archiveDate.getFullYear() === selectedYear && 
           (archiveDate.getMonth() + 1) === selectedMonth;
  });

  return (
    <div className="analytics-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h2 className="mb-0">Analytics</h2>
          <InfoTooltip content={<div>
            <strong>Archiving:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              <li>Automatic daily archiving runs at midnight</li>
              <li>Archives are accessible via management tools for audit and export</li>
            </ul>
          </div>} className="ms-2" />
        </div>
        <div className="d-flex gap-2"> 
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="analytics-grid">
        {filteredArchives.map((a) => (
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
        {filteredArchives.length === 0 && (
          <div className="text-muted">No archives for this month.</div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
