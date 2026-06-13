import { useState, useEffect, useCallback, useRef } from 'react';
import { getGames, getGroups, getTeams, isApiOffline } from '../services/worldCupApi';
import { isMatchLive } from '../utils/matchStatus';

const AUTOREFRESH_INTERVAL = 60_000; // 60 seconds

/**
 * useWorldCupData — fetches and manages all World Cup data.
 * Handles: parallel fetch, caching, error state, offline fallback, auto-refresh.
 */
export function useWorldCupData() {
  const [games, setGames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(null);

  // Keep a stable ref to fetchData for use inside the interval
  const fetchDataRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // ✅ All 3 endpoints in parallel — eliminates the waterfall
      const [teamsData, gamesData, groupsData] = await Promise.all([
        getTeams(forceRefresh),
        getGames(forceRefresh),
        getGroups(forceRefresh),
      ]);

      // Build teams map: { [team_id]: teamObject }
      const map = {};
      if (Array.isArray(teamsData)) {
        teamsData.forEach((team) => { map[team.id] = team; });
      }

      setTeamsMap(map);
      setGames(gamesData || []);
      setGroups(groupsData || []);
    } catch (err) {
      console.error('Error fetching World Cup data:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setOffline(isApiOffline());
    }
  }, []);

  // Store latest fetchData in ref so the interval always calls the fresh version
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60s when there are live matches
  useEffect(() => {
    const hasLive = games.some(isMatchLive);
    if (!hasLive) return;

    const interval = setInterval(() => {
      fetchDataRef.current?.(true);
    }, AUTOREFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [games]);

  return {
    games,
    groups,
    teamsMap,
    loading,
    refreshing,
    offline,
    error,
    refresh: () => fetchData(true),
  };
}
