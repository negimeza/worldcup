import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wc2026_theme';

/** Returns the user's OS preference */
function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || getSystemPreference();
  } catch {
    return 'dark';
  }
}

/**
 * useTheme — manages dark/light mode.
 * Applies [data-theme] attribute to <html> so CSS variables cascade down.
 */
export function useTheme() {
  const [theme, setTheme] = useState(loadSavedTheme);

  // Apply theme attribute to <html> on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore storage errors */ }
  }, [theme]);

  // Listen for OS preference changes (e.g. system goes to auto dark)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only follow OS if user hasn't set a preference
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
