/**
 * Centralized match status helpers.
 * Single source of truth — used by App, MatchCard, hooks, and filters.
 */

export const isMatchLive = (game) =>
  game.time_elapsed === 'live' ||
  (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted');

export const isMatchFinished = (game) =>
  game.finished === 'TRUE' || game.time_elapsed === 'finished';

export const isMatchUpcoming = (game) =>
  !isMatchLive(game) && !isMatchFinished(game);

/** Returns 'live' | 'finished' | 'upcoming' */
export const getMatchStatus = (game) => {
  if (isMatchLive(game)) return 'live';
  if (isMatchFinished(game)) return 'finished';
  return 'upcoming';
};

/** Parse "MM/DD/YYYY HH:mm" → timestamp (ms) */
export const parseMatchDate = (dateStr) => {
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
