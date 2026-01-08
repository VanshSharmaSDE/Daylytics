import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from './AuthContext'
import API from '../api'

const STORAGE_KEY = "daylytics-theme";
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

const VALID_THEMES = ['light', 'dark', 'system'];

const isValidTheme = (t) => typeof t === 'string' && VALID_THEMES.includes(t);

const getPreferredTheme = (userThemeFromServer = null) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  // allow server/user theme to override local storage when present (only accept valid strings)
  const storedIsValid = isValidTheme(stored);
  // if localStorage contains an invalid value (eg. "[object Object]"), clear it immediately
  if (stored !== null && !storedIsValid) {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  // server value -> stored value -> system pref fallback
  const chosen = isValidTheme(userThemeFromServer)
    ? userThemeFromServer
    : storedIsValid
    ? stored
    : (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? 'dark' : 'light');

  // appliedTheme is what we set on the document (only 'light' or 'dark')
  const applied = chosen === 'system' ? (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? 'dark' : 'light') : chosen;

  document.documentElement.dataset.theme = applied;
  document.documentElement.style.colorScheme = applied === 'dark' ? 'dark' : 'light';

  return chosen;
};

export const ThemeProvider = ({ children }) => {
  const { token, user, refreshUser, loadingUser } = useAuth() || {}

  // If the logged-in user has a stored setting, prefer that. Pass the user's theme during initialization.
  const initialThemeCandidate = typeof user !== 'undefined' && user?.settings?.['daylytics-theme']
    ? user.settings['daylytics-theme']
    : undefined
  const initialTheme = isValidTheme(initialThemeCandidate) ? initialThemeCandidate : undefined

  const [theme, setTheme] = useState(() => getPreferredTheme(initialTheme));

  // whenever the user finishes loading / changes, prefer the user's saved theme if present
  // do not apply until loadingUser is false so we don't override a local selection while auth is initializing
  useEffect(() => {
    if (loadingUser) return;
    try {
      const userTheme = user?.settings?.['daylytics-theme'];
      if (userTheme && VALID_THEMES.includes(userTheme) && userTheme !== theme) {
        setTheme(userTheme);
      }
    } catch (err) {
      // ignore
    }
  }, [user, loadingUser]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const applied = theme === 'system' ? (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? 'dark' : 'light') : theme;
    root.dataset.theme = applied;
    root.style.colorScheme = applied === "dark" ? "dark" : "light";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleTheme = async (explicit) => {
    // ensure explicit value is valid, otherwise compute next based on current sanitized theme
    const safeCurrent = isValidTheme(theme) ? theme : getPreferredTheme();
    const next = isValidTheme(explicit) ? explicit : (safeCurrent === 'light' ? 'dark' : 'light')
    setTheme(next);

    // if logged in, send the setting to the server so it's persisted
    if (token) {
      try {
        // send only the single theme key to avoid accidentally serializing
        // any non-serializable values that may exist elsewhere in user.settings
        const payload = { ['daylytics-theme']: next };
        await API.put('/api/auth/settings', { settings: payload });
        // Don't refresh user to avoid triggering loader - just update locally
      } catch (err) {
        // best-effort - don't block UI on failure
        console.error('Failed saving theme to server', err?.response?.data || err.message || err);
      }
    }
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
