import { useState, useMemo } from 'react';
import {
  isMatchLive,
  isMatchFinished,
  isMatchUpcoming,
  parseMatchDate,
} from '../utils/matchStatus';
import { getTeamNameES, getTeamAliases, normalizeString } from '../utils/teamTranslations';

/**
 * useMatchFilters — all filter state + memoized derived data.
 * Keeps filtering logic out of App.jsx.
 */
export function useMatchFilters(games, favorites) {
  const [activeFilter, setActiveFilter] = useState('today');
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
        const q = normalizeString(searchQuery);
        
        const homeEng = game.home_team_name_en || '';
        const awayEng = game.away_team_name_en || '';
        const homeEs = normalizeString(getTeamNameES(homeEng));
        const awayEs = normalizeString(getTeamNameES(awayEng));
        
        const homeAliases = getTeamAliases(homeEng).map(normalizeString);
        const awayAliases = getTeamAliases(awayEng).map(normalizeString);

        const homeLabel = normalizeString(game.home_team_label || '');
        const awayLabel = normalizeString(game.away_team_label || '');

        const matchesHome = homeEs.includes(q) || homeLabel.includes(q) || homeAliases.some(alias => alias.includes(q));
        const matchesAway = awayEs.includes(q) || awayLabel.includes(q) || awayAliases.some(alias => alias.includes(q));

        if (!matchesHome && !matchesAway) {
          return false;
        }
      }

      // Country dropdown
      if (selectedCountry !== 'all') {
        const home = game.home_team_name_en || '';
        const away = game.away_team_name_en || '';
        // Dropdown already returns the English identifier to filter by
        if (home !== selectedCountry && away !== selectedCountry) return false;
      }

      // Status filter buttons
      if (activeFilter === 'live' && !isMatchLive(game)) return false;
      if (activeFilter === 'finished' && !isMatchFinished(game)) return false;
      if (activeFilter === 'upcoming' && !isMatchUpcoming(game)) return false;
      if (activeFilter === 'favorites' && !favorites.includes(game.id)) return false;
      if (activeFilter === 'today') {
        const ts = parseMatchDate(game.local_date, game.stadium_id);
        if (!ts) return false;
        const d = new Date(ts);
        const now = new Date();
        if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth() || d.getDate() !== now.getDate()) {
          return false;
        }
      }

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

      const tA = parseMatchDate(a.local_date, a.stadium_id);
      const tB = parseMatchDate(b.local_date, b.stadium_id);

      // Both upcoming → ascending (soonest first)
      if (upA && upB) return tA - tB;
      // Both finished → descending (most recent first)
      if (finA && finB) return tB - tA;
      // Both live → ascending
      return tA - tB;
    });
  }, [games, searchQuery, selectedGroup, selectedCountry, activeFilter, favorites]);

  // ✅ Memoized — group by date key "YYYY-MM-DD" in user's local timezone
  const groupedByDate = useMemo(() => {
    const map = {};
    filteredGames.forEach((game) => {
      let key = '9999-12-31';
      const ts = parseMatchDate(game.local_date, game.stadium_id);
      if (ts > 0) {
        const d = new Date(ts);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        key = `${y}-${m}-${day}`;
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
      .sort((a, b) => parseMatchDate(a.local_date, a.stadium_id) - parseMatchDate(b.local_date, b.stadium_id));

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
