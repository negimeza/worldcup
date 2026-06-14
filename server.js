import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_FOOTBALL_KEY;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Dynamic in-memory cache
let gamesCache = null;
let lastFetchTime = 0;
let cacheDurationMs = 60000; // starts at 1 minute, updated dynamically

function updateCacheDuration(games) {
  if (!games || games.length === 0) {
    cacheDurationMs = 60000; // 1 minute if empty
    return;
  }

  const now = Date.now();
  let hasActiveMatchToday = false;

  for (const game of games) {
    if (!game.kickoff_utc) continue;

    const kickoffTime = new Date(game.kickoff_utc).getTime();
    const elapsed = now - kickoffTime;

    // A match is active if current time is within:
    // - 30 minutes before kickoff (pre-match buildup)
    // - up to 3 hours after kickoff (game length + padding)
    if (elapsed > -30 * 60 * 1000 && elapsed < 3 * 60 * 60 * 1000) {
      hasActiveMatchToday = true;
      break;
    }
  }

  if (hasActiveMatchToday) {
    cacheDurationMs = 15 * 60 * 1000; // 15 minutes cache during active match times
    console.log(`[Cache Manager] Active match window detected. Cache duration: 15 minutes.`);
  } else {
    cacheDurationMs = 6 * 60 * 60 * 1000; // 6 hours cache during off-times
    console.log(`[Cache Manager] No active matches today or all finished. Cache duration: 6 hours.`);
  }
}

const ZAFRONIX_STADIUM_MAP = {
  'estadio-azteca': '1',
  'estadio-akron': '2',
  'estadio-bbva': '3',
  'att-stadium': '4',
  'nrg-stadium': '5',
  'arrowhead-stadium': '6',
  'geha-field': '6',
  'mercedes-benz-stadium': '7',
  'hard-rock-stadium': '8',
  'gillette-stadium': '9',
  'lincoln-financial-field': '10',
  'metlife-stadium': '11',
  'bmo-field': '12',
  'bc-place': '13',
  'lumen-field': '14',
  'levis-stadium': '15',
  'sofi-stadium': '16'
};

function getKnockoutLabelES(ref) {
  if (!ref) return 'TBD';
  
  const groupMatch = ref.match(/^([123])([A-L])$/);
  if (groupMatch) {
    const pos = groupMatch[1];
    const grp = groupMatch[2];
    if (pos === '1') return `1\u00BA Grupo ${grp}`;
    if (pos === '2') return `2\u00BA Grupo ${grp}`;
    if (pos === '3') return `3\u00BA Grupo ${grp}`;
  }

  const winnerMatch = ref.match(/^W(\d+)$/);
  if (winnerMatch) {
    return `Ganador P${winnerMatch[1]}`;
  }

  const loserMatch = ref.match(/^L(\d+)$/);
  if (loserMatch) {
    return `Perdedor P${loserMatch[1]}`;
  }

  if (typeof ref === 'string') {
    let lower = ref.toLowerCase();
    if (lower.startsWith('winner group ')) {
      return `Ganador Grupo ${ref.slice(13).toUpperCase()}`;
    }
    if (lower.startsWith('runner-up group ')) {
      return `2\u00BA Grupo ${ref.slice(16).toUpperCase()}`;
    }
    if (lower.startsWith('winner match ')) {
      return `Ganador Partido ${ref.slice(13)}`;
    }
    if (lower.startsWith('loser match ')) {
      return `Perdedor Partido ${ref.slice(12)}`;
    }
  }

  return ref;
}

// Function to map Zafronix format to our custom frontend format
function mapZafronixToAppFormat(zafronixData) {
  if (!zafronixData || !zafronixData.data) return [];
  
  return zafronixData.data.map(item => {
    // Scorers mapping
    const homeGoals = (item.goals || []).filter(g => g.team === 'home');
    const awayGoals = (item.goals || []).filter(g => g.team === 'away');
    const home_scorers = homeGoals.map(g => `${g.scorer} ${g.minute}'`).join(', ') || 'null';
    const away_scorers = awayGoals.map(g => `${g.scorer} ${g.minute}'`).join(', ') || 'null';

    // Status mapping
    let isFinished = item.status === 'finished' ? 'TRUE' : 'FALSE';
    let timeElapsed = item.status === 'finished' ? "90'" : (item.status === 'live' ? (item.liveMinute ? `${item.liveMinute}'` : 'live') : 'notstarted');

    return {
      id: item.id ? item.id.toString() : Math.random().toString(),
      home_team_id: item.homeTeam,
      away_team_id: item.awayTeam,
      home_score: item.homeScore !== null && item.homeScore !== undefined ? item.homeScore.toString() : '0',
      away_score: item.awayScore !== null && item.awayScore !== undefined ? item.awayScore.toString() : '0',
      home_scorers,
      away_scorers,
      group: item.stage ? item.stage.replace('group_', '').toUpperCase() : '',
      matchday: '1',
      local_date: new Date(item.kickoffUtc).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      stadium_id: ZAFRONIX_STADIUM_MAP[item.stadiumId] || '15',
      finished: isFinished,
      time_elapsed: timeElapsed,
      type: item.stage && item.stage.includes('group') ? 'group' : 'knockout',
      home_team_name_en: item.homeTeam,
      away_team_name_en: item.awayTeam,
      home_team_label: getKnockoutLabelES(item.homeRef),
      away_team_label: getKnockoutLabelES(item.awayRef),
      kickoff_utc: item.kickoffUtc
    };
  });
}

app.get('/get/games', async (req, res) => {
  const now = Date.now();

  // Return cached data if valid
  if (gamesCache && (now - lastFetchTime < cacheDurationMs)) {
    const secondsRemaining = Math.max(0, Math.round((cacheDurationMs - (now - lastFetchTime)) / 1000));
    console.log(`Serving from cache (remaining: ${secondsRemaining}s, cache duration: ${cacheDurationMs / 60000}m)`);
    return res.json({ games: gamesCache });
  }

  // Fetch from Zafronix API
  console.log('Fetching fresh data from Zafronix API...');
  try {
    const response = await fetch('https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026', {
      headers: {
        'X-API-Key': 'zwc_free_ac34a594d0775d5cdc8e7bd4'
      }
    });

    if (!response.ok) {
      throw new Error(`Zafronix API returned ${response.status}`);
    }

    const data = await response.json();
    
    gamesCache = mapZafronixToAppFormat(data);
    updateCacheDuration(gamesCache);
    lastFetchTime = now;
    
    return res.json({ games: gamesCache });

  } catch (error) {
    console.error('Error fetching from Zafronix API:', error);
    // If it fails, send cached data if available
    if (gamesCache) {
      return res.json({ games: gamesCache });
    }
    return res.status(500).json({ error: 'Failed to fetch external data' });
  }
});

let zafronixCache = null;
let lastZafronixFetch = 0;

app.get('/get/zafronix/matches', async (req, res) => {
  const now = Date.now();
  if (zafronixCache && (now - lastZafronixFetch < CACHE_DURATION_MS)) {
    return res.json(zafronixCache);
  }

  try {
    const response = await fetch('https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026', {
      headers: { 'X-API-Key': 'zwc_free_ac34a594d0775d5cdc8e7bd4' }
    });

    if (!response.ok) throw new Error(`Zafronix API error: ${response.statusText}`);

    zafronixCache = await response.json();
    lastZafronixFetch = now;
    res.json(zafronixCache);
  } catch (error) {
    console.error('Zafronix Error:', error);
    if (zafronixCache) return res.json(zafronixCache);
    res.status(500).json({ error: 'Error fetching from Zafronix' });
  }
});

app.get('/get/groups', async (req, res) => {
  try {
    const data = await import('./src/services/backupData.js');
    return res.json({ groups: data.backupGroups });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read backup groups' });
  }
});

app.get('/get/teams', async (req, res) => {
  try {
    const data = await import('./src/services/backupData.js');
    return res.json({ teams: data.backupTeams });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read backup teams' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚽ Backend Proxy Server running on http://localhost:${PORT}`);
  console.log(`Cache duration (initial): ${cacheDurationMs / 1000} seconds`);
  if (!API_KEY) {
    console.warn('⚠️ No API_FOOTBALL_KEY found in .env file! Server will run in Fallback Mode using backupData.js');
  }
});
