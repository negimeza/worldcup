import React from 'react';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Convert "YYYY-MM-DD" to a human-readable Spanish date header.
 * Pure function — safe to call on every render (cheap).
 */
function getDateHeader(dateKey) {
  if (!dateKey || dateKey === '9999-12-31') return 'Fecha por definir';
  try {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(Number(year), parseInt(month, 10) - 1, Number(day));
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return dateKey;
  }
}

/**
 * EmptyState — shown when no matches match the current filters.
 */
export function EmptyState({ icon = '🔍', title, subtitle }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <p className="empty-state-title">{title}</p>
      {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
    </div>
  );
}

/**
 * DateGroup — a section of matches grouped under a date header.
 */
export function DateGroup({ dateKey, games, renderCard }) {
  return (
    <div className="date-group-section">
      <h3 className="date-group-header">{getDateHeader(dateKey)}</h3>
      <div className="matches-grid">
        {games.map(renderCard)}
      </div>
    </div>
  );
}
