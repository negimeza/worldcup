import React, { useState, useEffect, useCallback } from 'react';
import { getGames, getGroups, getTeams, isApiOffline } from './services/worldCupApi';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';

export default function App() {
  // Data States
  const [games, setGames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('partidos'); // 'partidos' | 'grupos'
  
  // Filter States
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'live' | 'finished' | 'upcoming' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('wc2026_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch all data
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch teams first for mapping team IDs to names in standings
      const teamsData = await getTeams(forceRefresh);
      const tempTeamsMap = {};
      if (teamsData && Array.isArray(teamsData)) {
        teamsData.forEach(team => {
          tempTeamsMap[team.id] = team;
        });
      }
      setTeamsMap(tempTeamsMap);

      // Fetch games and groups
      const [gamesData, groupsData] = await Promise.all([
        getGames(forceRefresh),
        getGroups(forceRefresh)
      ]);

      setGames(gamesData || []);
      setGroups(groupsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setOffline(isApiOffline());
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Autorefresh every 60 seconds if there are active live matches
  useEffect(() => {
    const hasLiveMatches = games.some(game => {
      const isLive = game.time_elapsed === 'live' || (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted');
      return isLive;
    });

    if (hasLiveMatches) {
      const interval = setInterval(() => {
        console.log('Autorefreshing live matches...');
        fetchData(true);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [games, fetchData]);

  // Handle Favorites toggle
  const toggleFavorite = (matchId) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(matchId)) {
        updated = prev.filter(id => id !== matchId);
      } else {
        updated = [...prev, matchId];
      }
      localStorage.setItem('wc2026_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Live matches counter
  const liveCount = games.filter(game => {
    return game.time_elapsed === 'live' || (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted');
  }).length;

  // Helper to parse date string "MM/DD/YYYY HH:mm" into a timestamp
  const parseMatchDate = (dateStr) => {
    if (!dateStr) return 0;
    try {
      const [datePart, timePart] = dateStr.split(' ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute] = timePart.split(':');
      return new Date(year, month - 1, day, hour, minute).getTime();
    } catch {
      return 0;
    }
  };

  // Find featured match (live first, otherwise next upcoming)
  const getFeaturedMatch = () => {
    const liveMatches = games.filter(game => {
      return game.time_elapsed === 'live' || (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted');
    });
    
    if (liveMatches.length > 0) {
      return { match: liveMatches[0], isLive: true };
    }

    // Find first upcoming match
    const upcomingMatches = games
      .filter(game => game.finished === 'FALSE' && game.time_elapsed === 'notstarted')
      .sort((a, b) => parseMatchDate(a.local_date) - parseMatchDate(b.local_date));
      
    if (upcomingMatches.length > 0) {
      return { match: upcomingMatches[0], isLive: false };
    }

    return null;
  };

  const featured = getFeaturedMatch();

  // Filter games based on search, group dropdown, and filter buttons
  const getFilteredGames = () => {
    const filtered = games.filter(game => {
      // 1. Group Filter (Dropdown)
      if (selectedGroup !== 'all' && game.group !== selectedGroup) {
        return false;
      }

      // 2. Search query (Matches home or away team name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const homeName = (game.home_team_name_en || '').toLowerCase();
        const awayName = (game.away_team_name_en || '').toLowerCase();
        const homeLabel = (game.home_team_label || '').toLowerCase();
        const awayLabel = (game.away_team_label || '').toLowerCase();
        
        if (!homeName.includes(query) && !awayName.includes(query) && 
            !homeLabel.includes(query) && !awayLabel.includes(query)) {
          return false;
        }
      }

      // 3. Country Filter (Dropdown)
      if (selectedCountry !== 'all') {
        const homeName = game.home_team_name_en || '';
        const awayName = game.away_team_name_en || '';
        if (homeName !== selectedCountry && awayName !== selectedCountry) {
          return false;
        }
      }

      // 4. Status Filter (Tab buttons)
      const isLive = game.time_elapsed === 'live' || (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted');
      const isFinished = game.finished === 'TRUE' || game.time_elapsed === 'finished';
      const isUpcoming = !isLive && !isFinished;

      if (activeFilter === 'live' && !isLive) return false;
      if (activeFilter === 'finished' && !isFinished) return false;
      if (activeFilter === 'upcoming' && !isUpcoming) return false;
      if (activeFilter === 'favorites' && !favorites.includes(game.id)) return false;

      return true;
    });

    // Sort: Live first, then Upcoming (ascending date), then Finished (descending date)
    return filtered.sort((a, b) => {
      const isLiveA = a.time_elapsed === 'live' || (a.finished === 'FALSE' && a.time_elapsed !== 'notstarted');
      const isLiveB = b.time_elapsed === 'live' || (b.finished === 'FALSE' && b.time_elapsed !== 'notstarted');
      
      const isFinishedA = a.finished === 'TRUE' || a.time_elapsed === 'finished';
      const isFinishedB = b.finished === 'TRUE' || b.time_elapsed === 'finished';

      // 1. Live games first
      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;

      // 2. Upcoming games second (before finished)
      const isUpcomingA = !isLiveA && !isFinishedA;
      const isUpcomingB = !isLiveB && !isFinishedB;
      if (isUpcomingA && isFinishedB) return -1;
      if (isFinishedA && isUpcomingB) return 1;

      const timeA = parseMatchDate(a.local_date);
      const timeB = parseMatchDate(b.local_date);

      // 3. Both are upcoming: sort ascending (nearest/closest first)
      if (isUpcomingA && isUpcomingB) {
        return timeA - timeB;
      }

      // 4. Both are finished: sort descending (most recent first)
      if (isFinishedA && isFinishedB) {
        return timeB - timeA;
      }

      // 5. Both are live: sort ascending
      return timeA - timeB;
    });
  };

  const filteredGames = getFilteredGames();

  // Group games by sortable date "YYYY-MM-DD"
  const groupGamesByDate = (gamesList) => {
    const groupsMap = {};
    gamesList.forEach(game => {
      let dateKey = '9999-12-31';
      if (game.local_date) {
        try {
          const [datePart] = game.local_date.split(' ');
          const [month, day, year] = datePart.split('/');
          dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch {}
      }
      if (!groupsMap[dateKey]) {
        groupsMap[dateKey] = [];
      }
      groupsMap[dateKey].push(game);
    });
    return groupsMap;
  };

  const groupedGames = groupGamesByDate(filteredGames);

  const getLocalDateHeader = (dateStr) => {
    if (!dateStr || dateStr === '9999-12-31') return 'Fecha por definir';
    try {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
      return dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    } catch {
      return dateStr;
    }
  };

  // Sort groups alphabetically
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="container header-content">
          <a href="/" className="logo-container">
            <div className="logo-icon">🏆</div>
            <div className="logo-text">
              <h1>MUNDIAL 2026</h1>
              <span>Estadísticas & Marcadores</span>
            </div>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {offline ? (
              <div className="live-indicator-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', animation: 'none' }}>
                ⚠️ Datos Locales
              </div>
            ) : liveCount > 0 ? (
              <div className="live-indicator-badge">
                <span className="pulse-dot"></span>
                {liveCount} {liveCount === 1 ? 'partido' : 'partidos'} en vivo
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                🟢 API Conectada
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="container">
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'partidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('partidos')}
          >
            ⚽ Partidos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'grupos' ? 'active' : ''}`}
            onClick={() => setActiveTab('grupos')}
          >
            📊 Posiciones
          </button>
        </div>
      </div>

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Cargando datos oficiales del Mundial 2026...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3 className="error-title">Error al cargar datos</h3>
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={() => fetchData(true)}>Reintentar</button>
          </div>
        ) : (
          <>
            {/* Hero Section (Active Live Match or Next Match) */}
            {activeTab === 'partidos' && featured && !searchQuery && selectedGroup === 'all' && activeFilter === 'all' && (
              <div className="hero-banner">
                <span className="hero-tag">
                  {featured.isLive ? '🔴 EN VIVO AHORA' : '📅 PRÓXIMO PARTIDO DESTACADO'}
                </span>
                <h2 className="hero-title">
                  {featured.match.home_team_name_en} vs {featured.match.away_team_name_en}
                </h2>
                <p className="hero-subtitle">
                  {featured.isLive 
                    ? `Marcador actual: ${featured.match.home_score} - ${featured.match.away_score}. Sigue el minuto a minuto en directo.` 
                    : `El encuentro se disputará el ${new Date(featured.match.local_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
                  }
                </p>
                <div style={{ transform: 'scale(1.15)', transformOrigin: 'center', margin: '10px 0' }}>
                  <MatchCard 
                    match={featured.match} 
                    isFavorite={favorites.includes(featured.match.id)}
                    onToggleFavorite={() => toggleFavorite(featured.match.id)}
                  />
                </div>
              </div>
            )}

            {/* Partidos Tab */}
            {activeTab === 'partidos' && (
              <>
                {/* Search & Filters */}
                <div className="controls-bar" style={{ marginTop: featured ? '0px' : '40px' }}>
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Buscar país o partido..." 
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    className="filter-select"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <option value="all">Todos los grupos</option>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(g => (
                      <option key={g} value={g}>Grupo {g}</option>
                    ))}
                  </select>

                  <select 
                    className="filter-select"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="all">Todos los países</option>
                    {Object.values(teamsMap)
                      .sort((a, b) => a.name_en.localeCompare(b.name_en))
                      .map(team => (
                        <option key={team.id} value={team.name_en}>
                          {team.name_en}
                        </option>
                      ))
                    }
                  </select>

                  <select 
                    className="filter-select"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="live">🔴 En Vivo</option>
                    <option value="upcoming">📅 Próximos</option>
                    <option value="finished">🏁 Finalizados</option>
                    <option value="favorites">⭐ Mis Favoritos ({favorites.length})</option>
                  </select>

                  <button 
                    className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                    onClick={() => fetchData(true)}
                    title="Actualizar marcadores en vivo"
                    disabled={refreshing}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                  </button>
                </div>

                {/* Match Grid grouped by Date */}
                {filteredGames.length > 0 ? (
                  Object.keys(groupedGames)
                    .sort((a, b) => {
                      // If filtering by finished, show most recent dates first (descending)
                      if (activeFilter === 'finished') {
                        return b.localeCompare(a);
                      }
                      // Default: show closest/upcoming dates first (ascending)
                      return a.localeCompare(b);
                    })
                    .map(dateKey => {
                      const gamesForDate = groupedGames[dateKey];
                      return (
                        <div key={dateKey} className="date-group-section">
                          <h3 className="date-group-header">
                            {getLocalDateHeader(dateKey)}
                          </h3>
                          <div className="matches-grid">
                            {gamesForDate.map(game => (
                              <MatchCard 
                                key={game.id} 
                                match={game} 
                                isFavorite={favorites.includes(game.id)}
                                onToggleFavorite={() => toggleFavorite(game.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '18px', fontWeight: '600' }}>No se encontraron partidos para este filtro.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Intenta cambiando la búsqueda o seleccionando otros grupos.</p>
                  </div>
                )}
              </>
            )}

            {/* Standings Tab */}
            {activeTab === 'grupos' && (
              <div style={{ marginTop: '40px' }}>
                <div className="groups-container">
                  {sortedGroups.map(group => (
                    <StandingsTable 
                      key={group._id} 
                      group={group} 
                      teamsMap={teamsMap}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container footer-content">
          <p>Mundial FIFA 2026 - Panel de Control de Amigos</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Desarrollado con ❤️ de forma <span className="footer-highlight">100% gratuita</span> usando React, variables CSS nativas y la API abierta de la comunidad.
          </p>
        </div>
      </footer>
    </div>
  );
}
