import React, { useState } from 'react';
import { useWorldCupData } from './hooks/useWorldCupData';
import { useFavorites } from './hooks/useFavorites';
import { useMatchFilters } from './hooks/useMatchFilters';

import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import ControlsBar from './components/ControlsBar';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import { EmptyState, DateGroup } from './components/MatchListUI';

export default function App() {
  const [activeTab, setActiveTab] = useState('partidos');

  // Data layer
  const { games, groups, teamsMap, loading, refreshing, offline, error, refresh } = useWorldCupData();

  // Favorites
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Filters + memoized derived data
  const {
    activeFilter, setActiveFilter,
    searchQuery, setSearchQuery,
    selectedGroup, setSelectedGroup,
    selectedCountry, setSelectedCountry,
    filteredGames,
    groupedByDate,
    liveCount,
    featuredMatch,
  } = useMatchFilters(games, favorites);

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  const showHero =
    activeTab === 'partidos' &&
    featuredMatch &&
    !searchQuery &&
    selectedGroup === 'all' &&
    activeFilter === 'all';

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) =>
    activeFilter === 'finished' ? b.localeCompare(a) : a.localeCompare(b)
  );

  return (
    <div className="app-container">
      <Header liveCount={liveCount} offline={offline} />

      {/* Tab switcher */}
      <div className="container">
        <div className="tabs-navigation" role="tablist" aria-label="Secciones del Mundial">
          <button
            id="tab-partidos"
            role="tab"
            aria-selected={activeTab === 'partidos'}
            aria-controls="panel-partidos"
            className={`tab-btn ${activeTab === 'partidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('partidos')}
          >
            ⚽ Partidos
          </button>
          <button
            id="tab-grupos"
            role="tab"
            aria-selected={activeTab === 'grupos'}
            aria-controls="panel-grupos"
            className={`tab-btn ${activeTab === 'grupos' ? 'active' : ''}`}
            onClick={() => setActiveTab('grupos')}
          >
            📊 Posiciones
          </button>
        </div>
      </div>

      <main className="container main-content">
        {loading ? (
          <div className="loading-container" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p className="loading-text">Cargando datos oficiales del Mundial 2026...</p>
          </div>
        ) : error ? (
          <div className="error-container" role="alert">
            <h2 className="error-title">Error al cargar datos</h2>
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={refresh}>Reintentar</button>
          </div>
        ) : (
          <>
            {/* Partidos tab */}
            <div
              id="panel-partidos"
              role="tabpanel"
              aria-labelledby="tab-partidos"
              hidden={activeTab !== 'partidos'}
            >
              {showHero && (
                <HeroBanner
                  featured={featuredMatch}
                  isFavorite={isFavorite(featuredMatch.match.id)}
                  onToggleFavorite={() => toggleFavorite(featuredMatch.match.id)}
                />
              )}

              <ControlsBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedGroup={selectedGroup}
                onGroupChange={setSelectedGroup}
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                teamsMap={teamsMap}
                favoritesCount={favorites.length}
                refreshing={refreshing}
                onRefresh={refresh}
                hasHero={!!showHero}
              />

              {filteredGames.length > 0 ? (
                sortedDateKeys.map((dateKey) => (
                  <DateGroup
                    key={dateKey}
                    dateKey={dateKey}
                    games={groupedByDate[dateKey]}
                    renderCard={(game) => (
                      <MatchCard
                        key={game.id}
                        match={game}
                        isFavorite={isFavorite(game.id)}
                        onToggleFavorite={() => toggleFavorite(game.id)}
                      />
                    )}
                  />
                ))
              ) : (
                <EmptyState
                  icon="🔍"
                  title="No se encontraron partidos para este filtro."
                  subtitle="Intenta cambiando la búsqueda o seleccionando otros grupos."
                />
              )}
            </div>

            {/* Posiciones tab */}
            <div
              id="panel-grupos"
              role="tabpanel"
              aria-labelledby="tab-grupos"
              hidden={activeTab !== 'grupos'}
              className="groups-panel"
            >
              <div className="groups-container">
                {sortedGroups.map((group) => (
                  <StandingsTable
                    key={group._id}
                    group={group}
                    teamsMap={teamsMap}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-content">
          <p>Mundial FIFA 2026 — Panel de Control de Amigos</p>
          <p className="footer-sub">
            Desarrollado con ❤️ de forma{' '}
            <span className="footer-highlight">100% gratuita</span>{' '}
            usando React, variables CSS nativas y la API abierta de la comunidad.
          </p>
        </div>
      </footer>
    </div>
  );
}
