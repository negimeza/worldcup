import React, { useMemo } from 'react';
import { getFlagUrl } from '../services/worldCupApi';

const parseScorersStr = (str, team) => {
  if (!str || str === 'null' || str === 'undefined') return [];
  try {
    const cleaned = str.replace(/^[{\[]/, '').replace(/[}\]]$/, '').replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"""]/g, '').trim();
    if (!cleaned) return [];
    
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    const scorers = [];
    let lastName = 'Desconocido';

    parts.forEach(part => {
      // If the part contains letters (e.g., "Messi 10'"), it's a new player.
      // If it only contains numbers and symbols (e.g., "45'"), it's another goal for the previous player.
      const hasLetters = /[a-zA-ZÀ-ÿ]/.test(part);
      if (hasLetters) {
        lastName = part.replace(/\d+.*$/, '').trim() || part;
      }
      scorers.push({ name: lastName, team });
    });

    return scorers;
  } catch { return []; }
};

export default function TopScorersTable({ games }) {
  const topScorers = useMemo(() => {
    if (!games || !games.length) return [];

    const goalCounts = {};

    games.forEach(game => {
      const homeGoals = parseScorersStr(game.home_scorers, game.home_team_en);
      const awayGoals = parseScorersStr(game.away_scorers, game.away_team_en);

      [...homeGoals, ...awayGoals].forEach(({ name, team }) => {
        if (!name) return;
        const key = `${name}-${team}`;
        if (!goalCounts[key]) {
          goalCounts[key] = { name, team, goals: 0 };
        }
        goalCounts[key].goals += 1;
      });
    });

    const sorted = Object.values(goalCounts)
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 50); // Top 50 scorers

    return sorted;
  }, [games]);

  if (topScorers.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚽</span>
        <h3 className="empty-state-title">Aún no hay goleadores</h3>
        <p className="empty-state-subtitle">La tabla de goleo se actualizará en cuanto comience a rodar el balón.</p>
      </div>
    );
  }

  return (
    <div className="standings-table-wrapper" style={{ overflowX: 'auto', marginBottom: '80px' }}>
      <table className="standings-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>Pos</th>
            <th>Jugador</th>
            <th style={{ textAlign: 'center' }}>Goles</th>
          </tr>
        </thead>
        <tbody>
          {topScorers.map((scorer, index) => (
            <tr key={`${scorer.name}-${scorer.team}`}>
              <td className="standings-num">{index + 1}</td>
              <td>
                <div className="standings-team-name">
                  <img
                    src={getFlagUrl(scorer.team)}
                    alt={`Bandera de ${scorer.team}`}
                    className="standings-team-flag"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span>{scorer.name}</span>
                </div>
              </td>
              <td className="standings-pts">{scorer.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
