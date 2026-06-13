import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';

export default function StandingsTable({ group, teamsMap }) {
  const { name: groupLetter, teams } = group;

  const sortedTeams = [...teams].sort((a, b) => {
    const ptsA = parseInt(a.pts || 0, 10);
    const ptsB = parseInt(b.pts || 0, 10);
    if (ptsB !== ptsA) return ptsB - ptsA;

    const gdA = parseInt(a.gd || 0, 10);
    const gdB = parseInt(b.gd || 0, 10);
    if (gdB !== gdA) return gdB - gdA;

    return parseInt(b.gf || 0, 10) - parseInt(a.gf || 0, 10);
  });

  return (
    <div className="group-card">
      <div className="group-title">
        <span>Grupo {groupLetter}</span>
      </div>

      <table
        className="standings-table"
        aria-label={`Posiciones del Grupo ${groupLetter}`}
      >
        <thead>
          <tr>
            <th scope="col" style={{ width: '40px', textAlign: 'center' }}>Pos</th>
            <th scope="col">Equipo</th>
            <th scope="col" style={{ textAlign: 'center' }} title="Partidos jugados">PJ</th>
            <th scope="col" style={{ textAlign: 'center' }} title="Ganados">G</th>
            <th scope="col" style={{ textAlign: 'center' }} title="Empates">E</th>
            <th scope="col" style={{ textAlign: 'center' }} title="Perdidos">P</th>
            <th scope="col" style={{ textAlign: 'center' }} title="Diferencia de goles">DG</th>
            <th scope="col" style={{ textAlign: 'center', fontWeight: '800' }} title="Puntos">PTS</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((teamStats, index) => {
            const teamInfo = teamsMap[teamStats.team_id] || {};
            const teamName = teamInfo.name_en || `Equipo ${teamStats.team_id}`;
            const flagUrl = teamInfo.flag || getFlagUrl(teamName);
            const pos = index + 1;
            const gd = parseInt(teamStats.gd, 10);

            let rowClass = '';
            if (pos <= 2) rowClass = 'qualify-direct';
            else if (pos === 3) rowClass = 'qualify-third';

            return (
              <tr
                key={teamStats._id || teamStats.team_id}
                className={rowClass}
                aria-label={
                  pos <= 2
                    ? `${teamName} — clasifica directamente`
                    : pos === 3
                    ? `${teamName} — posible tercero`
                    : `${teamName}`
                }
              >
                <td className="standings-num">{pos}</td>
                <td>
                  <div className="standings-team-name">
                    <img
                      src={flagUrl}
                      alt={`Bandera de ${teamName}`}
                      className="standings-team-flag"
                      width="22"
                      height="15"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span>{teamName}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{teamStats.mp}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.w}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.d}</td>
                <td style={{ textAlign: 'center' }}>{teamStats.l}</td>
                <td
                  style={{
                    textAlign: 'center',
                    color:
                      gd > 0 ? '#10b981' : gd < 0 ? '#ef4444' : 'var(--text-secondary)',
                  }}
                >
                  {gd > 0 ? `+${teamStats.gd}` : teamStats.gd}
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
