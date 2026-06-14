import React, { useMemo } from 'react';
import { isMatchLive, isMatchFinished, isMatchUpcoming, parseMatchDate } from '../utils/matchStatus';
import { getTeamNameES } from '../utils/teamTranslations';

/**
 * ControlsBar — search, dropdowns for group/country, interactive pill chips
 * for match status, and refresh button.
 */
export default function ControlsBar({
  searchQuery, onSearchChange,
  selectedGroup, onGroupChange,
  selectedCountry, onCountryChange,
  activeFilter, onFilterChange,
  teamsMap,
  favoritesCount,
  refreshing, onRefresh,
  hasHero,
  games = [],
}) {
  const sortedTeams = useMemo(
    () => Object.values(teamsMap)
      .map(t => ({ ...t, name_es: getTeamNameES(t.name_en) }))
      .sort((a, b) => a.name_es.localeCompare(b.name_es)),
    [teamsMap]
  );

  // Counts for the filter chips
  const liveCount     = useMemo(() => games.filter(isMatchLive).length, [games]);
  const upcomingCount = useMemo(() => games.filter(isMatchUpcoming).length, [games]);
  const finishedCount = useMemo(() => games.filter(isMatchFinished).length, [games]);

  // Today's matches count (using user's local date)
  const todayCount = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return games.filter((g) => {
      const ts = parseMatchDate(g.local_date, g.stadium_id);
      if (!ts) return false;
      const d = new Date(ts);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayStr;
    }).length;
  }, [games]);

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const chips = [
    { id: 'all',       label: 'Todos',       icon: '🏟️', count: games.length },
    { id: 'today',     label: 'Hoy',         icon: '📆', count: todayCount },
    { id: 'live',      label: 'En Vivo',     icon: '🔴', count: liveCount },
    { id: 'upcoming',  label: 'Próximos',    icon: '📅', count: upcomingCount },
    { id: 'finished',  label: 'Finalizados', icon: '🏁', count: finishedCount },
    { id: 'favorites', label: 'Favoritos',   icon: '⭐', count: favoritesCount },
  ];

  return (
    <div className={`controls-bar ${hasHero ? '' : 'controls-bar--no-hero'}`}>

      {/* ── Row 1: Status filter chips ── */}
      <div className="filter-chips" role="radiogroup" aria-label="Filtrar por estado del partido">
        {chips.map((chip) => (
          <button
            key={chip.id}
            role="radio"
            aria-checked={activeFilter === chip.id}
            className={`filter-chip ${activeFilter === chip.id ? 'active' : ''}`}
            onClick={() => onFilterChange(chip.id)}
          >
            <span aria-hidden="true">{chip.icon}</span>
            {chip.label}
            <span className="filter-chip-count">{chip.count}</span>
          </button>
        ))}
      </div>

      {/* ── Row 2: Search + Dropdowns + Refresh ── */}
      <div className="controls-row" role="search">
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

        <select
          id="filter-country"
          className="filter-select"
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          aria-label="Filtrar por país"
        >
          <option value="all">Todos los países</option>
          {sortedTeams.map((team) => (
            <option key={team.id} value={team.name_en}>{team.name_es}</option>
          ))}
        </select>

        <button
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          title="Actualizar marcadores en vivo"
          aria-label={refreshing ? 'Actualizando...' : 'Actualizar marcadores en vivo'}
          disabled={refreshing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>
    </div>
  );
}
