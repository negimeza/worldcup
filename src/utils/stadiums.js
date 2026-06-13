/**
 * Static stadium data for all 16 World Cup 2026 venues.
 * Avoids an extra API call since these don't change.
 */
export const STADIUMS = {
  '1':  { name: 'Estadio Azteca',        city: 'Ciudad de México', country: '🇲🇽' },
  '2':  { name: 'Estadio Akron',          city: 'Guadalajara',     country: '🇲🇽' },
  '3':  { name: 'Estadio BBVA',           city: 'Monterrey',       country: '🇲🇽' },
  '4':  { name: 'AT&T Stadium',           city: 'Dallas',          country: '🇺🇸' },
  '5':  { name: 'NRG Stadium',            city: 'Houston',         country: '🇺🇸' },
  '6':  { name: 'Arrowhead Stadium',      city: 'Kansas City',     country: '🇺🇸' },
  '7':  { name: 'Mercedes-Benz Stadium',  city: 'Atlanta',         country: '🇺🇸' },
  '8':  { name: 'Hard Rock Stadium',      city: 'Miami',           country: '🇺🇸' },
  '9':  { name: 'Gillette Stadium',       city: 'Boston',          country: '🇺🇸' },
  '10': { name: 'Lincoln Financial Field', city: 'Filadelfia',     country: '🇺🇸' },
  '11': { name: 'MetLife Stadium',        city: 'Nueva York',      country: '🇺🇸' },
  '12': { name: 'BMO Field',             city: 'Toronto',          country: '🇨🇦' },
  '13': { name: 'BC Place',              city: 'Vancouver',        country: '🇨🇦' },
  '14': { name: 'Lumen Field',           city: 'Seattle',          country: '🇺🇸' },
  '15': { name: "Levi's Stadium",        city: 'San Francisco',    country: '🇺🇸' },
  '16': { name: 'SoFi Stadium',          city: 'Los Ángeles',      country: '🇺🇸' },
};

/**
 * Get stadium display string for a match card.
 * e.g. "MetLife Stadium, Nueva York 🇺🇸"
 */
export const getStadiumInfo = (stadiumId) => {
  const s = STADIUMS[String(stadiumId)];
  if (!s) return null;
  return { name: s.name, city: s.city, country: s.country, full: `${s.name}, ${s.city}` };
};
