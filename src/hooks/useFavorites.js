import { useState, useCallback } from 'react';

const STORAGE_KEY = 'wc2026_favorites';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * useFavorites — manages favorite match IDs with localStorage persistence.
 * @returns {{ favorites: string[], toggleFavorite: (id: string) => void, isFavorite: (id: string) => boolean }}
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFromStorage);

  const toggleFavorite = useCallback((matchId) => {
    setFavorites((prev) => {
      const updated = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Silently ignore storage errors (e.g. private browsing quota)
      }
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (matchId) => favorites.includes(matchId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
