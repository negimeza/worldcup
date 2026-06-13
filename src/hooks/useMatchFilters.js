import { useState, useMemo } from 'react';
import {
  isMatchLive,
  isMatchFinished,
  isMatchUpcoming,
  parseMatchDate,
} from '../utils/matchStatus';

/**
 * useMatchFilters — all filter state + memoized derived data.
 * Keeps filtering logic out of App.jsx.
 */
export function useMatchFilters(games, favorites) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  // ✅ Memoized — only recalculates when games or filter values change
  const filteredGames = useMemo(() => {
    const filtered = games.filter((game) => {
      // Group dropdown
      if (selectedGroup !== 'all' && game.group !== selectedGroup) return false;

      // Search query (home or away name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = (game.home_team_name_en || '').toLowerCase();
        const away = (game.away_team_name_en || '').toLowerCase();
        const homeLabel = (game.home_team_label || '').toLowerCase();
        const awayLabel = (game.away_team_label || '').toLowerCase();
        if (!home.includes(q) && !away.includes(q) && !homeLabel.includes(q) && !awayLabel.includes(q)) {
          return false;
        }
      }

      // Country dropdown
      if (selectedCountry !== 'all') {
        const home = game.home_team_name_en || '';
        const away = game.away_team_name_en || '';
        if (home !== selectedCountry && away !== selectedCountry) return false;
      }

      // Status filter buttons
      if (activeFilter === 'live' && !isMatchLive(game)) return false;
      if (activeFilter === 'finished' && !isMatchFinished(game)) return false;
      if (activeFilter === 'upcoming' && !isMatchUpcoming(game)) return false;
      if (activeFilter === 'favorites' && !favorites.includes(game.id)) return false;

      return true;
    });

    // Sort: Live → Upcoming (asc) → Finished (desc)
    return filtered.sort((a, b) => {
      const liveA = isMatchLive(a);
      const liveB = isMatchLive(b);
      if (liveA && !liveB) return -1;
      if (!liveA && liveB) return 1;

      const finA = isMatchFinished(a);
      const finB = isMatchFinished(b);
      const upA = !liveA && !finA;
      const upB = !liveB && !finB;

      if (upA && finB) return -1;
      if (finA && upB) return 1;

      const tA = parseMatchDate(a.local_date);
      const tB = parseMatchDate(b.local_date);

      // Both upcoming → ascending (soonest first)
      if (upA && upB) return tA - tB;
      // Both finished → descending (most recent first)
      if (finA && finB) return tB - tA;
      // Both live → ascending
      return tA - tB;
    });
  }, [games, searchQuery, selectedGroup, selectedCountry, activeFilter, favorites]);

  // ✅ Memoized — group by date key "YYYY-MM-DD"
  const groupedByDate = useMemo(() => {
    const map = {};
    filteredGames.forEach((game) => {
      let key = '9999-12-31';
      if (game.local_date) {
        try {
          const [datePart] = game.local_date.split(' ');
          const [month, day, year] = datePart.split('/');
          key = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch { /* keep fallback key */ }
      }
      (map[key] ??= []).push(game);
    });
    return map;
  }, [filteredGames]);

  // ✅ Memoized live count
  const liveCount = useMemo(() => games.filter(isMatchLive).length, [games]);

  // ✅ Memoized featured match (live first, else next upcoming)
  const featuredMatch = useMemo(() => {
    const live = games.filter(isMatchLive);
    if (live.length > 0) return { match: live[0], isLive: true };

    const upcoming = games
      .filter((g) => isMatchUpcoming(g))
      .sort((a, b) => parseMatchDate(a.local_date) - parseMatchDate(b.local_date));

    if (upcoming.length > 0) return { match: upcoming[0], isLive: false };
    return null;
  }, [games]);

  return {
    // State
    activeFilter, setActiveFilter,
    searchQuery, setSearchQuery,
    selectedGroup, setSelectedGroup,
    selectedCountry, setSelectedCountry,
    // Derived
    filteredGames,
    groupedByDate,
    liveCount,
    featuredMatch,
  };
}
