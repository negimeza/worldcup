import { backupGames, backupGroups, backupTeams } from './backupData';

const BASE_URL = 'https://worldcup26.ir';
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// Cache in memory to avoid redundant requests during fast tab switches
const cache = {
  games: null,
  groups: null,
  teams: null,
  lastFetched: {
    games: 0,
    groups: 0,
    teams: 0
  }
};

const CACHE_DURATION = 15000; // 15 seconds cache for live scores
const STATIC_CACHE_DURATION = 3600000; // 1 hour for static data like teams

// Flag codes dictionary for the 48 teams of World Cup 2026
export const flagCodes = {
  "Mexico": "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Korea Republic": "kr",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "Canada": "ca",
  "Bosnia and Herzegovina": "ba",
  "Qatar": "qa",
  "Switzerland": "ch",
  "Brazil": "br",
  "Morocco": "ma",
  "Haiti": "ht",
  "Scotland": "gb-sct",
  "United States": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turkey": "tr",
  "Turkiye": "tr",
  "Ivory Coast": "ci",
  "Ecuador": "ec",
  "Germany": "de",
  "Curaçao": "cw",
  "Netherlands": "nl",
  "Japan": "jp",
  "Sweden": "se",
  "Tunisia": "tn",
  "Iran": "ir",
  "New Zealand": "nz",
  "Belgium": "be",
  "Egypt": "eg",
  "Spain": "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  "Uruguay": "uy",
  "France": "fr",
  "Senegal": "sn",
  "Iraq": "iq",
  "Norway": "no",
  "Argentina": "ar",
  "Algeria": "dz",
  "Austria": "at",
  "Jordan": "jo",
  "Portugal": "pt",
  "Democratic Republic of the Congo": "cd",
  "Uzbekistan": "uz",
  "Colombia": "co",
  "England": "gb-eng",
  "Croatia": "hr",
  "Ghana": "gh",
  "Panama": "pa"
};

export const getFlagUrl = (teamName) => {
  if (!teamName) return '';
  const code = flagCodes[teamName] || flagCodes[teamName.trim()];
  if (code) {
    return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  }
  // Fallback to a placeholder or flagcdn query
  return `https://placehold.co/80x53/1e293b/ffffff?text=${encodeURIComponent(teamName.substring(0, 3).toUpperCase())}`;
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchWithFallback(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Try direct fetch first (4 seconds timeout)
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 4000);
    
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Direct fetch to ${url} returned status ${response.status}. Trying proxy...`);
  } catch (directError) {
    console.warn(`Direct fetch to ${url} failed or timed out:`, directError.message);
  }

  // Fallback to proxy fetch (5 seconds timeout)
  try {
    const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, {}, 5000);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Failed to fetch via proxy: ${response.status}`);
  } catch (proxyError) {
    console.error(`Proxy fetch to ${url} failed:`, proxyError.message);
    throw proxyError;
  }
}

let apiOffline = false;

export function isApiOffline() {
  return apiOffline;
}

export async function getGames(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.games && (now - cache.lastFetched.games < CACHE_DURATION)) {
    return cache.games;
  }

  try {
    const data = await fetchWithFallback('/get/games');
    if (data && data.games) {
      apiOffline = false;
      cache.games = data.games;
      cache.lastFetched.games = now;
      return data.games;
    }
    throw new Error('Invalid games data received');
  } catch (error) {
    apiOffline = true;
    console.warn('API fetch failed. Falling back to backup/cached games data...', error.message);
    if (cache.games) {
      return cache.games;
    }
    cache.games = backupGames;
    return backupGames;
  }
}

export async function getGroups(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.groups && (now - cache.lastFetched.groups < CACHE_DURATION)) {
    return cache.groups;
  }

  try {
    const data = await fetchWithFallback('/get/groups');
    if (data && data.groups) {
      apiOffline = false;
      cache.groups = data.groups;
      cache.lastFetched.groups = now;
      return data.groups;
    }
    throw new Error('Invalid groups standings data received');
  } catch (error) {
    apiOffline = true;
    console.warn('API fetch failed. Falling back to backup/cached groups data...', error.message);
    if (cache.groups) {
      return cache.groups;
    }
    cache.groups = backupGroups;
    return backupGroups;
  }
}

export async function getTeams(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.teams && (now - cache.lastFetched.teams < STATIC_CACHE_DURATION)) {
    return cache.teams;
  }

  try {
    const data = await fetchWithFallback('/get/teams');
    if (data && data.teams) {
      apiOffline = false;
      cache.teams = data.teams;
      cache.lastFetched.teams = now;
      return data.teams;
    }
    throw new Error('Invalid teams data received');
  } catch (error) {
    apiOffline = true;
    console.warn('API fetch failed. Falling back to backup/cached teams data...', error.message);
    if (cache.teams) {
      return cache.teams;
    }
    cache.teams = backupTeams;
    return backupTeams;
  }
}
