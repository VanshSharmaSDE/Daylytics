import React from "react";
import { useTheme } from "../context/ThemeContext";


const navItems = [
  { id: "tasks", label: "Tasks", icon: "ri-list-check-2" },
  { id: "analytics", label: "Analytics", icon: "ri-line-chart-line" },
  { id: "files", label: "Files", icon: "ri-file-text-line" },
  { id: "bucket", label: "Bucket", icon: "ri-archive-line" },
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
          {navItems.filter(item => item.id !== 'editor').map((item) => (
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
              {item.beta && <span className="badge bg-primary ms-1" style={{ fontSize: '0.6rem', verticalAlign: 'super' }}>BETA</span>}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle-btn d-none d-md-inline-flex"
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
          <button
            type="button"
            className="theme-toggle-btn d-none d-md-inline-flex"
            onClick={onProfile}
            aria-label="Settings"
          >
            <i className="ri-settings-3-line" aria-hidden="true"></i>
          </button>
          <div className="avatar-wrap d-none d-md-inline-flex" style={{ position: 'relative' }}>
            <button type="button" className="avatar-btn" aria-label={`User: ${user?.name || user?.email || 'User'}`}>
              {initials}
            </button>
            <span className="avatar-tooltip" role="tooltip">{user?.name || user?.email || 'User'}</span>
          </div>
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
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="avatar-btn" title={user?.name || user?.email || 'User'} aria-label={`User: ${user?.name || user?.email || 'User'}`}>
                  {initials}
                </button>
                <span className="fw-semibold" title={user?.name || user?.email || 'Menu'}>{user?.name || user?.email || "Menu"}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
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
                <button
                  type="button"
                  className="menu-close-btn"
                  onClick={() => onToggleMenu(false)}
                  aria-label="Close menu"
                >
                  <i className="ri-close-line" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div className="d-flex flex-column gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  onProfile();
                  onToggleMenu(false);
                }}
              >
                <i className="ri-settings-3-line me-2"></i>
                Settings
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
