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

// Simple in-memory cache
let gamesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60000; // 60 seconds

// Function to map API-Football format to our custom frontend format
function mapApiFootballToAppFormat(apiData) {
  if (!apiData || !apiData.response) return [];
  
  return apiData.response.map(item => {
    const fixture = item.fixture;
    const teams = item.teams;
    const goals = item.goals;
    const events = item.events || [];

    // Extract scorers
    const homeGoals = events.filter(e => e.type === 'Goal' && e.team.id === teams.home.id);
    const awayGoals = events.filter(e => e.type === 'Goal' && e.team.id === teams.away.id);

    const home_scorers = homeGoals.map(g => `${g.player.name} ${g.time.elapsed}'`).join(', ') || 'null';
    const away_scorers = awayGoals.map(g => `${g.player.name} ${g.time.elapsed}'`).join(', ') || 'null';

    return {
      id: fixture.id.toString(),
      home_team_id: teams.home.id.toString(),
      away_team_id: teams.away.id.toString(),
      home_score: goals.home !== null ? goals.home.toString() : '0',
      away_score: goals.away !== null ? goals.away.toString() : '0',
      home_scorers,
      away_scorers,
      group: item.league.round.replace('Group ', ''), // Simple mapping
      matchday: '1',
      local_date: new Date(fixture.date).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      stadium_id: '15', // Mock stadium for now
      finished: fixture.status.short === 'FT' ? 'TRUE' : 'FALSE',
      time_elapsed: fixture.status.short === 'NS' ? 'notstarted' : `${fixture.status.elapsed}'`,
      type: item.league.round.includes('Group') ? 'group' : 'knockout',
      home_team_name_en: teams.home.name,
      away_team_name_en: teams.away.name
    };
  });
}

app.get('/get/games', async (req, res) => {
  const now = Date.now();

  // Return cached data if valid
  if (gamesCache && (now - lastFetchTime < CACHE_DURATION_MS)) {
    console.log('Serving from cache');
    return res.json({ games: gamesCache });
  }

  // If no API Key provided, serve local backup data!
  if (!API_KEY) {
    console.log('No API_FOOTBALL_KEY found in .env. Serving fallback local data.');
    try {
      const backupPath = path.join(__dirname, 'src', 'services', 'backupData.js');
      let backupContent = await fs.readFile(backupPath, 'utf8');
      
      // Basic parser to extract the JSON array from the JS file
      const match = backupContent.match(/export const backupGames = (\[[\s\S]*?\]);/);
      if (match && match[1]) {
        // Warning: This uses eval-like parsing since it's a JS file. In production, use a strict JSON file.
        // For simplicity, we just clean it up slightly and parse.
        const cleanedStr = match[1].replace(/'/g, '"').replace(/([a-zA-Z0-9_]+):/g, '"$1":');
        
        // As a safe fallback for the raw format, we'll just send the string back if parse fails
        try {
           gamesCache = JSON.parse(cleanedStr);
        } catch {
           // Fallback if regex clean fails
           const data = await import('./src/services/backupData.js');
           gamesCache = data.backupGames;
        }
        
        lastFetchTime = now;
        return res.json({ games: gamesCache });
      }
    } catch (err) {
      console.error('Failed to read backupData.js', err);
      return res.status(500).json({ error: 'No API Key and failed to read backup data' });
    }
  }

  // Fetch from API-Football
  console.log('Fetching fresh data from API-Football...');
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
      headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Check for API errors (API-Football puts errors in the body)
    if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('API-Football error:', data.errors);
        return res.status(400).json({ error: 'API Error', details: data.errors });
    }

    gamesCache = mapApiFootballToAppFormat(data);
    lastFetchTime = now;
    
    return res.json({ games: gamesCache });

  } catch (error) {
    console.error('Error fetching from API-Football:', error);
    // If it fails, send cached data if available
    if (gamesCache) {
      return res.json({ games: gamesCache });
    }
    return res.status(500).json({ error: 'Failed to fetch external data' });
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚽ Backend Proxy Server running on http://localhost:${PORT}`);
  console.log(`Cache duration: ${CACHE_DURATION_MS / 1000} seconds`);
  if (!API_KEY) {
    console.warn('⚠️ No API_FOOTBALL_KEY found in .env file! Server will run in Fallback Mode using backupData.js');
  }
});
