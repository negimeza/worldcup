/**
 * Centralized match status helpers.
 * Single source of truth — used by App, MatchCard, hooks, and filters.
 */

/**
 * UTC offsets (in hours) for each stadium during summer (DST).
 * World Cup 2026 matches run June–July, so all venues observe DST.
 *
 * Mexico (CDT):        UTC-5  → stadiums 1, 2, 3
 * US Central (CDT):    UTC-5  → stadiums 4, 5, 6
 * US/Canada East (EDT):UTC-4  → stadiums 7, 8, 9, 10, 11, 12
 * US/Canada West (PDT):UTC-7  → stadiums 13, 14, 15, 16
 */
const STADIUM_UTC_OFFSET = {
  // Mexico
  '1': -5,  // Estadio Azteca – Mexico City (CDT)
  '2': -5,  // Estadio Akron – Guadalajara (CDT)
  '3': -5,  // Estadio BBVA – Monterrey (CDT)
  // US Central
  '4': -5,  // AT&T Stadium – Dallas (CDT)
  '5': -5,  // NRG Stadium – Houston (CDT)
  '6': -5,  // GEHA Field – Kansas City (CDT)
  // US / Canada Eastern
  '7': -4,  // Mercedes-Benz Stadium – Atlanta (EDT)
  '8': -4,  // Hard Rock Stadium – Miami (EDT)
  '9': -4,  // Gillette Stadium – Boston (EDT)
  '10': -4, // Lincoln Financial Field – Philadelphia (EDT)
  '11': -4, // MetLife Stadium – New York/New Jersey (EDT)
  '12': -4, // BMO Field – Toronto (EDT)
  // US / Canada Western
  '13': -7, // BC Place – Vancouver (PDT)
  '14': -7, // Lumen Field – Seattle (PDT)
  '15': -7, // Levi's Stadium – San Francisco Bay Area (PDT)
  '16': -7, // SoFi Stadium – Los Angeles (PDT)
};

/**
 * Parse "MM/DD/YYYY HH:mm" → timestamp (ms) in TRUE UTC.
 *
 * The API's `local_date` is local to the *stadium*, NOT to the user's browser.
 * We look up the stadium's UTC offset and produce the correct absolute timestamp.
 *
 * @param {string} dateStr  - e.g. "06/13/2026 12:00"
 * @param {string} [stadiumId] - e.g. "15"
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

    // The raw numbers represent local time at the stadium.
    // Subtract the stadium offset to get true UTC.
    // e.g. 12:00 PDT (UTC-7) → 12:00 + 7h = 19:00 UTC
    const offsetHours = STADIUM_UTC_OFFSET[String(stadiumId)] ?? -5; // fallback CDT
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
 * Format a match date to the user's local timezone — short format.
 * e.g. "13 Jun · 2:00 PM"
 */
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const formatTime12h = (date) => {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export const formatMatchDateToLocal = (dateStr, stadiumId) => {
  const ts = parseMatchDate(dateStr, stadiumId);
  if (!ts) return dateStr || '';
  const d = new Date(ts);
  const day = d.getDate();
  const month = MONTHS_ES[d.getMonth()];
  return `${day} ${month} · ${formatTime12h(d)}`;
};

/**
 * Format a match date to the user's local timezone — long format.
 * e.g. "sábado, 13 de junio, 2:00 PM"
 */
export const formatMatchDateToLocalLong = (dateStr, stadiumId) => {
  const ts = parseMatchDate(dateStr, stadiumId);
  if (!ts) return dateStr || '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
