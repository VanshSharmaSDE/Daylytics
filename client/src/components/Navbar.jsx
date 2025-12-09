import React from "react";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { id: "tasks", label: "Tasks", icon: "ri-list-check-2" },
  { id: "analytics", label: "Analytics", icon: "ri-line-chart-line" },
  { id: "files", label: "Files", icon: "ri-file-text-line" },
];

const Navbar = ({
  activeTab,
  onTabChange,
  onProfile,
  onLogoutRequest,
  user,
  mobileMenuOpen,
  onToggleMenu,
  sidebarContent,
}) => {
  const { theme, toggleTheme } = useTheme();
  const initials =
    user?.name?.slice(0, 1)?.toUpperCase() ||
    user?.email?.slice(0, 1)?.toUpperCase() ||
    "?";

  const handleTab = (id) => {
    onTabChange(id);
    if (mobileMenuOpen) onToggleMenu(false);
  };

  // compute the currently applied theme (resolve 'system' to light/dark)
  const appliedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
    : theme;

  // toggle target based on applied theme so toggling always flips light <-> dark
  const nextTheme = appliedTheme === 'light' ? 'dark' : 'light';
  const toggleMenu = () => onToggleMenu((prev) => !prev);

  return (
    <>
      <header className="app-navbar panel-shadow">
        <div className="brand">Daylytics</div>
        <div className="nav-icons-mobile d-flex d-md-none">
          {navItems.filter(item => item.id !== 'files').map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-icon-btn ${
                item.id === activeTab ? "is-active" : ""
              }`}
              onClick={() => handleTab(item.id)}
              aria-label={item.label}
            >
              <i className={item.icon} aria-hidden="true"></i>
            </button>
          ))}
        </div>
        <nav className="nav-links d-none d-md-flex">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === activeTab ? "is-active" : ""}
              onClick={() => handleTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-none d-md-inline-flex"
            onClick={onProfile}
          >
            Profile
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-none d-md-inline-flex"
            onClick={onLogoutRequest}
          >
            Logout
          </button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => toggleTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
          >
            <i
              className={
                appliedTheme === "light" ? "ri-moon-line" : "ri-sun-line"
              }
              aria-hidden="true"
            ></i>
          </button>
          <button type="button" className="avatar-btn">
            {initials}
          </button>
          <button
            type="button"
            className={`hamburger d-md-none ${mobileMenuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div
            className="mobile-menu-backdrop open"
            onClick={() => onToggleMenu(false)}
          />
          <div className="mobile-menu open">
            <div className="mobile-menu-header">
              <span className="fw-semibold">Menu</span>
              <button
                type="button"
                className="menu-close-btn"
                onClick={() => onToggleMenu(false)}
                aria-label="Close menu"
              >
                <i className="ri-close-line" aria-hidden="true"></i>
              </button>
            </div>
            <div className="d-flex flex-column gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  handleTab('files');
                }}
              >
                <i className="ri-file-text-line me-2"></i>Files
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  onProfile();
                  onToggleMenu(false);
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  onLogoutRequest();
                  onToggleMenu(false);
                }}
              >
                Logout
              </button>
            </div>
            {sidebarContent && (
              <>
                <div className="menu-divider"></div>
                <div className="mobile-sidebar-section">{sidebarContent}</div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
