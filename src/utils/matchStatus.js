/**
 * Centralized match status helpers.
 * Single source of truth — used by App, MatchCard, hooks, and filters.
 */

/**
 * Parse "MM/DD/YYYY HH:mm" → timestamp (ms) in TRUE UTC.
 *
 * The API's `local_date` (both from server.js and backupData.js) is always 
 * formatted in America/New_York time (EDT, UTC-4) during the World Cup.
 * We subtract the UTC-4 offset to produce the correct absolute timestamp.
 *
 * @param {string} dateStr  - e.g. "06/13/2026 12:00"
 * @param {string} [stadiumId] - (unused, kept for signature compatibility)
 * @returns {number} UTC timestamp in milliseconds, or 0 on failure
 */
export const parseMatchDate = (dateStr, stadiumId) => {
  if (!dateStr) return 0;
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');

    // Build a UTC timestamp from the raw numbers
    const utcMs = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );

    // The raw numbers represent America/New_York (EDT) time.
    // EDT is UTC-4. Subtract -4 hours to get true UTC.
    // e.g. 13:00 EDT → 13:00 - (-4) = 17:00 UTC
    const offsetHours = -4;
    return utcMs - offsetHours * 3600000;
  } catch {
    return 0;
  }
};

export const isMatchLive = (game) => {
  const startTime = parseMatchDate(game.local_date, game.stadium_id);
  if (startTime > 0) {
    const now = Date.now();
    const elapsed = now - startTime;

    // A match cannot be live if it hasn't started yet (more than 15 mins in future)
    // or if it started more than 5 hours ago (stale API state).
    if (elapsed < -15 * 60 * 1000 || elapsed > 5 * 60 * 60 * 1000) {
      return false;
    }
  }

  if (game.time_elapsed === 'live') return true;
  if (game.finished === 'FALSE' && game.time_elapsed !== 'notstarted') return true;

  // Fallback for matches that have started but API hasn't updated status yet
  if (startTime > 0 && game.finished === 'FALSE') {
    const now = Date.now();
    if (now >= startTime) {
      return true;
    }
  }
  return false;
};

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

/**
 * Format a match date to Colombia timezone (America/Bogota).
 * e.g. "13 Jun · 2:00 PM"
 */
export const formatMatchDateToLocal = (dateStr, stadiumId) => {
  const ts = parseMatchDate(dateStr, stadiumId);
  if (!ts) return dateStr || '';
  const d = new Date(ts);

  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find(p => p.type === type)?.value;

  const day = getPart('day');
  let month = getPart('month');
  if (month) month = month.charAt(0).toUpperCase() + month.slice(1);
  const hour = getPart('hour');
  const minute = getPart('minute');
  let dayPeriod = getPart('dayPeriod') || '';
  
  // Clean up typical day periods like "p. m." to "PM"
  dayPeriod = dayPeriod.toUpperCase().replace(/\./g, '').replace(/\s+/g, '');

  return `${day} ${month} · ${hour}:${minute} ${dayPeriod}`;
};

/**
 * Format a match date to Colombia timezone — long format.
 * e.g. "sábado, 13 de junio, 2:00 PM"
 */
export const formatMatchDateToLocalLong = (dateStr, stadiumId) => {
  const ts = parseMatchDate(dateStr, stadiumId);
  if (!ts) return dateStr || '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
