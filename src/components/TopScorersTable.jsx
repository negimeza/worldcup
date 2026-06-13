import React, { useMemo } from 'react';
import { getFlagUrl } from '../services/worldCupApi';
import { getTeamNameES } from '../utils/teamTranslations';

const parseScorersStr = (str, team) => {
  if (!str || str === 'null' || str === 'undefined') return [];
  try {
    const cleaned = str.replace(/^[{\[]/, '').replace(/[}\]]$/, '').replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"""]/g, '').trim();
    if (!cleaned) return [];
    
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    const scorers = [];
    let lastName = 'Desconocido';

    parts.forEach(part => {
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
      const homeGoals = parseScorersStr(game.home_scorers, game.home_team_name_en);
      const awayGoals = parseScorersStr(game.away_scorers, game.away_team_name_en);

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
      .slice(0, 50);

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
    <div className="scorers-container">
      {topScorers.map((scorer, index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'scorer-row--rank-1';
        else if (rank === 2) rankClass = 'scorer-row--rank-2';
        else if (rank === 3) rankClass = 'scorer-row--rank-3';

        return (
          <div key={`${scorer.name}-${scorer.team}`} className={`scorer-row ${rankClass}`}>
            <div className="scorer-rank">{rank}</div>
            
            <div className="scorer-info">
              <div className="scorer-flag-wrap">
                <img
                  src={getFlagUrl(scorer.team)}
                  alt={`Bandera de ${scorer.team}`}
                  className="scorer-flag"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="scorer-details">
                <span className="scorer-name">{scorer.name}</span>
                <span className="scorer-team-name">{getTeamNameES(scorer.team)}</span>
              </div>
            </div>

            <div className="scorer-goals">
              <span className="scorer-goals-num">{scorer.goals}</span>
              <span className="scorer-goals-label">Goles</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
