# AGENTS.md

## Stack
- React 19 + Vite 8 (Rolldown), plain JS (no TypeScript), ESLint flat config
- Express backend proxy (`server.js`) on port 3001; Vite dev server on port 3000

## Dev Commands
```bash
npm run dev      # Vite dev server (port 3000)
npm run server   # Express backend (port 3001)
npm run build    # Production build → dist/
npm run lint     # ESLint (ignores dist/)
npm run preview  # Preview production build locally
```

## Architecture
- `src/App.jsx` — main entry, uses hash-based routing (`#admin` for AdminPanel)
- `src/services/worldCupApi.js` — frontend data layer, calls backend proxy with fallback chain: direct fetch → allorigins proxy → backup data
- `src/backupData.js` — static fallback data when API is unavailable
- `server.js` — Express proxy that maps API-Football responses to app format; falls back to `backupData.js` if `API_FOOTBALL_KEY` is not set
- `src/hooks/` — useWorldCupData, useFavorites, useMatchFilters, useTheme, useGoalNotifier
- `src/components/` — Header, MatchCard, MatchDetailsModal, StandingsTable, TopScorersTable, AdminPanel, etc.

## Environment Variables
- Backend: `API_FOOTBALL_KEY` (required for live API), `PORT`
- Frontend Vite env: `VITE_API_BASE_URL` (default `http://localhost:3001`), `VITE_PROXY_URL` (default `https://api.allorigins.win/raw?url=`)
- Vite only exposes vars prefixed with `VITE_` to client code

## Backend Proxy Behavior
- `/get/games` — 60s server-side cache; if no API key, serves `backupData.js`
- `/get/groups`, `/get/teams` — always from `backupData.js`
- When running in production (`dist/`), `server.js` serves the SPA as a catchall

## Build Notes
- Vite 8 (Rolldown): `manualChunks` in rollupOptions must be a function, not an object
- `@/` alias maps to `src/` for clean imports
- `dist/` is git-ignored; `node_modules/` is git-ignored

## No Test Suite
This repo has no test framework configured. No `vitest`, `jest`, etc.