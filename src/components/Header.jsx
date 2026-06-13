import React from 'react';

/**
 * Header — sticky glassmorphism header with logo, live indicator and theme toggle.
 */
export default function Header({ liveCount, offline, theme, onToggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <header className="app-header">
      <div className="container header-content">
        <a href="/" className="logo-container">
          <div className="logo-icon">🏆</div>
          <div className="logo-text">
            <h1>MUNDIAL 2026</h1>
            <span>Estadísticas &amp; Marcadores</span>
          </div>
        </a>

        <div className="header-actions">
          {/* Live / Offline indicator */}
          {offline ? (
            <div
              className="live-indicator-badge offline"
              aria-live="polite"
              aria-label="Mostrando datos locales, sin conexión a la API"
            >
              ⚠️ Datos Locales
            </div>
          ) : liveCount > 0 ? (
            <div
              className="live-indicator-badge"
              aria-live="polite"
              aria-label={`${liveCount} ${liveCount === 1 ? 'partido en vivo' : 'partidos en vivo'}`}
            >
              <span className="pulse-dot" aria-hidden="true" />
              {liveCount} {liveCount === 1 ? 'partido' : 'partidos'} en vivo
            </div>
          ) : (
            <span className="api-status-ok" aria-label="API conectada">
              <span aria-hidden="true">●</span> En línea
            </span>
          )}

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-thumb">
                {isDark ? '🌙' : '☀️'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
