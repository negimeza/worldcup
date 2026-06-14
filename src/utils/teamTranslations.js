/**
 * Translates English team names to Spanish and provides aliases for search.
 */

const teamTranslations = {
  "Mexico": "México",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "Czech Republic": "República Checa",
  "Czechia": "República Checa",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suiza",
  "Brazil": "Brasil",
  "Morocco": "Marruecos",
  "Haiti": "Haití",
  "Scotland": "Escocia",
  "United States": "Estados Unidos",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Turkey": "Turquía",
  "Turkiye": "Turquía",
  "Ivory Coast": "Costa de Marfil",
  "Ecuador": "Ecuador",
  "Germany": "Alemania",
  "Curaçao": "Curazao",
  "Netherlands": "Países Bajos",
  "Japan": "Japón",
  "Sweden": "Suecia",
  "Tunisia": "Túnez",
  "Iran": "Irán",
  "New Zealand": "Nueva Zelanda",
  "Belgium": "Bélgica",
  "Egypt": "Egipto",
  "Spain": "España",
  "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita",
  "Uruguay": "Uruguay",
  "France": "Francia",
  "Senegal": "Senegal",
  "Iraq": "Irak",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argelia",
  "Austria": "Austria",
  "Jordan": "Jordania",
  "Portugal": "Portugal",
  "Democratic Republic of the Congo": "RD Congo",
  "Uzbekistan": "Uzbekistán",
  "Colombia": "Colombia",
  "England": "Inglaterra",
  "Croatia": "Croacia",
  "Ghana": "Ghana",
  "Panama": "Panamá",
  "Congo DR": "RD Congo",
  "C\u00F4te d'Ivoire": "Costa de Marfil",
  "Cote d'Ivoire": "Costa de Marfil",
  "IR Iran": "Ir\u00E1n",
  "T\u00FCrkiye": "Turqu\u00EDa",
  "USA": "Estados Unidos",
  "Curacao": "Curazao"
};

const searchAliases = {
  "United States": ["eeuu", "usa"],
  "England": ["uk", "reinounido", "granbretaña"],
  "Netherlands": ["holanda"]
};

export const getTeamNameES = (englishName) => {
  if (!englishName || englishName === '0') return '';
  return teamTranslations[englishName] || englishName;
};

export const getTeamAliases = (englishName) => {
  if (!englishName || englishName === '0') return [];
  return searchAliases[englishName] || [];
};

/**
 * Normalizes a string by removing accents and making it lowercase
 */
export const normalizeString = (str) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};
