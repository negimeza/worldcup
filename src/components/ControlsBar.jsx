import React from 'react';

/**
 * ControlsBar — search, group/country/status dropdowns, and refresh button.
 */
export default function ControlsBar({
  searchQuery,
  onSearchChange,
  selectedGroup,
  onGroupChange,
  selectedCountry,
  onCountryChange,
  activeFilter,
  onFilterChange,
  teamsMap,
  favoritesCount,
  refreshing,
  onRefresh,
  hasHero,
}) {
  const sortedTeams = Object.values(teamsMap).sort((a, b) =>
    a.name_en.localeCompare(b.name_en)
  );

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div className={`controls-bar ${hasHero ? '' : 'controls-bar--no-hero'}`} role="search">
      {/* Search */}
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          id="match-search"
          type="search"
          placeholder="Buscar país o partido..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar partidos por país"
          autoComplete="off"
        />
      </div>

      {/* Group filter */}
      <select
        id="filter-group"
        className="filter-select"
        value={selectedGroup}
        onChange={(e) => onGroupChange(e.target.value)}
        aria-label="Filtrar por grupo"
      >
        <option value="all">Todos los grupos</option>
        {groups.map((g) => (
          <option key={g} value={g}>Grupo {g}</option>
        ))}
      </select>

      {/* Country filter */}
      <select
        id="filter-country"
        className="filter-select"
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        aria-label="Filtrar por país"
      >
        <option value="all">Todos los países</option>
        {sortedTeams.map((team) => (
          <option key={team.id} value={team.name_en}>{team.name_en}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        id="filter-status"
        className="filter-select"
        value={activeFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        aria-label="Filtrar por estado del partido"
      >
        <option value="all">Todos los estados</option>
        <option value="live">🔴 En Vivo</option>
        <option value="upcoming">📅 Próximos</option>
        <option value="finished">🏁 Finalizados</option>
        <option value="favorites">⭐ Mis Favoritos ({favoritesCount})</option>
      </select>

      {/* Refresh button */}
      <button
        className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
        onClick={onRefresh}
        title="Actualizar marcadores en vivo"
        aria-label={refreshing ? 'Actualizando marcadores...' : 'Actualizar marcadores en vivo'}
        disabled={refreshing}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      </button>
    </div>
  );
}
