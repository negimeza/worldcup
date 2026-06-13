import React from 'react';

/**
 * Header — sticky glassmorphism header with logo and live indicator.
 */
export default function Header({ liveCount, offline }) {
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
              🟢 API Conectada
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
