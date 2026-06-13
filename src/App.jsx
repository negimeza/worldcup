import React, { useState, useEffect, useMemo } from 'react';
import { useWorldCupData } from './hooks/useWorldCupData';
import { useFavorites } from './hooks/useFavorites';
import { useMatchFilters } from './hooks/useMatchFilters';
import { useTheme } from './hooks/useTheme';
import { useGoalNotifier } from './hooks/useGoalNotifier';

import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import ControlsBar from './components/ControlsBar';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import TopScorersTable from './components/TopScorersTable';
import MatchDetailsModal from './components/MatchDetailsModal';
import SkeletonLoading from './components/SkeletonLoading';
import { EmptyState, DateGroup } from './components/MatchListUI';
import AdminPanel from './components/AdminPanel';

const DATES_PER_PAGE = 5;

export default function App() {
  const [activeTab, setActiveTab] = useState('partidos');
  const [visibleDates, setVisibleDates] = useState(DATES_PER_PAGE);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Hash router simple
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');

  useEffect(() => {
    const handleHashChange = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme
  const { theme, toggleTheme } = useTheme();

  if (isAdmin) {
    return <AdminPanel />;
  }

  // Data layer
  const { games, groups, teamsMap, loading, refreshing, offline, error, refresh } = useWorldCupData();

  // Favorites
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Goal Notifications
  const { toast, clearToast } = useGoalNotifier(games, teamsMap);

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

  // Reset visible count when any filter changes
  useEffect(() => {
    setVisibleDates(DATES_PER_PAGE);
  }, [activeFilter, searchQuery, selectedGroup, selectedCountry, activeTab]);

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  const showHero =
    activeTab === 'partidos' &&
    featuredMatch &&
    !searchQuery &&
    selectedGroup === 'all' &&
    activeFilter === 'all';

  const sortedDateKeys = useMemo(
    () => Object.keys(groupedByDate).sort((a, b) =>
      activeFilter === 'finished' ? b.localeCompare(a) : a.localeCompare(b)
    ),
    [groupedByDate, activeFilter]
  );

  // Only the slice the user has requested to see
  const visibleDateKeys = sortedDateKeys.slice(0, visibleDates);
  const remainingDates = sortedDateKeys.length - visibleDates;
  const hasMore = remainingDates > 0;

  // Count how many extra matches are hidden
  const hiddenMatchCount = useMemo(() => {
    const nextBatch = sortedDateKeys.slice(visibleDates, visibleDates + DATES_PER_PAGE);
    return nextBatch.reduce((acc, key) => acc + (groupedByDate[key]?.length ?? 0), 0);
  }, [sortedDateKeys, visibleDates, groupedByDate]);

  return (
    <div className="app-container">
      <Header liveCount={liveCount} offline={offline} theme={theme} onToggleTheme={toggleTheme} />

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
          <button
            id="tab-goleadores"
            role="tab"
            aria-selected={activeTab === 'goleadores'}
            aria-controls="panel-goleadores"
            className={`tab-btn ${activeTab === 'goleadores' ? 'active' : ''}`}
            onClick={() => setActiveTab('goleadores')}
          >
            👟 Goleadores
          </button>
        </div>
      </div>

      <main className="container main-content">
        {loading ? (
          <SkeletonLoading />
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
                  onClick={() => setSelectedMatch(featuredMatch.match)}
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
                games={games}
              />

              {filteredGames.length > 0 ? (
                <>
                  {visibleDateKeys.map((dateKey) => (
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
                          onClick={() => setSelectedMatch(game)}
                        />
                      )}
                    />
                  ))}

                  {/* Ver más / Load more */}
                  {hasMore && (
                    <div className="load-more-wrapper">
                      <button
                        className="load-more-btn"
                        onClick={() => setVisibleDates((v) => v + DATES_PER_PAGE)}
                        aria-label={`Ver más partidos, ${hiddenMatchCount} partidos ocultos`}
                      >
                        <span className="load-more-icon" aria-hidden="true">⚽</span>
                        Ver más partidos
                        <span className="load-more-badge">
                          +{hiddenMatchCount} partidos · {Math.min(remainingDates, DATES_PER_PAGE)} fechas más
                        </span>
                      </button>
                    </div>
                  )}

                  {/* When all loaded — show a final indicator */}
                  {!hasMore && sortedDateKeys.length > DATES_PER_PAGE && (
                    <div className="all-loaded-msg" role="status" aria-live="polite">
                      <span>✅ Mostrando todos los {filteredGames.length} partidos</span>
                    </div>
                  )}
                </>
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

            {/* Goleadores tab */}
            <div
              id="panel-goleadores"
              role="tabpanel"
              aria-labelledby="tab-goleadores"
              hidden={activeTab !== 'goleadores'}
            >
              <TopScorersTable games={games} />
            </div>

            {selectedMatch && (
              <MatchDetailsModal
                match={selectedMatch}
                onClose={() => setSelectedMatch(null)}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-content">
          <p>Mundial FIFA 2026 — Panel de Control de Amigos</p>
          <p className="footer-sub">
            Desarrollado con ❤️ de forma{' '}
            <span className="footer-highlight">100% gratuita</span>.
          </p>
        </div>
      </footer>

      {/* Goal Toast Notification */}
      {toast && (
        <div className="goal-toast slide-in-bottom" role="alert" aria-live="assertive">
          <div className="toast-content">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={clearToast} aria-label="Cerrar notificación">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
