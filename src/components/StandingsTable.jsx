import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';

export default function StandingsTable({ group, teamsMap }) {
  const { name: groupLetter, teams } = group;

  // Sort teams by points desc, then goal difference desc, then goals for desc
  const sortedTeams = [...teams].sort((a, b) => {
    const ptsA = parseInt(a.pts || 0, 10);
    const ptsB = parseInt(b.pts || 0, 10);
    if (ptsB !== ptsA) return ptsB - ptsA;

    const gdA = parseInt(a.gd || 0, 10);
    const gdB = parseInt(b.gd || 0, 10);
    if (gdB !== gdA) return gdB - gdA;

    const gfA = parseInt(a.gf || 0, 10);
    const gfB = parseInt(b.gf || 0, 10);
    return gfB - gfA;
  });

  return (
    <div className="group-card">
      <div className="group-title">
        <span>Grupo {groupLetter}</span>
      </div>
      
      <table className="standings-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>Pos</th>
            <th>Equipo</th>
            <th style={{ textAlign: 'center' }}>PJ</th>
            <th style={{ textAlign: 'center' }}>G</th>
            <th style={{ textAlign: 'center' }}>E</th>
            <th style={{ textAlign: 'center' }}>P</th>
            <th style={{ textAlign: 'center' }}>DG</th>
            <th style={{ textAlign: 'center', fontWeight: '800' }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((teamStats, index) => {
            const teamInfo = teamsMap[teamStats.team_id] || {};
            const teamName = teamInfo.name_en || `Equipo ${teamStats.team_id}`;
            const flagUrl = teamInfo.flag || getFlagUrl(teamName);
            
            // Qualification highlights: Top 2 qualify directly, 3rd place potential, 4th eliminated
            const pos = index + 1;
            let rowClass = '';
            if (pos === 1 || pos === 2) {
              rowClass = 'qualify-direct';
            } else if (pos === 3) {
              rowClass = 'qualify-third';
            }

            return (
              <tr key={teamStats._id || teamStats.team_id} className={rowClass}>
                <td className="standings-num">{pos}</td>
                <td>
                  <div className="standings-team-name">
                    <img 
                      src={flagUrl} 
                      alt={`Bandera de ${teamName}`}
                      className="standings-team-flag"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span>{teamName}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{teamStats.mp}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.w}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.d}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.l}</td>
                <td style={{ textAlign: 'center', color: parseInt(teamStats.gd, 10) > 0 ? '#10b981' : parseInt(teamStats.gd, 10) < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                  {parseInt(teamStats.gd, 10) > 0 ? `+${teamStats.gd}` : teamStats.gd}
                </td>
                <td className="standings-pts">{teamStats.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
