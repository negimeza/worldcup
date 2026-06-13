import React, { useEffect } from 'react';
import { getFlagUrl } from '../services/worldCupApi';
import { getTeamNameES } from '../utils/teamTranslations';
import { isMatchLive, isMatchFinished, parseMatchDate } from '../utils/matchStatus';
import { getStadiumInfo } from '../utils/stadiums';

const parseScorersToTimeline = (str, teamId) => {
  if (!str || str === 'null' || str === 'undefined') return [];
  try {
    const cleaned = str
      .replace(/^[{\[]/, '').replace(/[}\]]$/, '')
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"""]/g, '')
      .trim();
    if (!cleaned) return [];
    
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    const events = [];
    let lastName = 'Desconocido';

    parts.forEach(part => {
      const hasLetters = /[a-zA-ZÀ-ÿ]/.test(part);
      let minuteStr = '';
      if (hasLetters) {
        lastName = part.replace(/\d+.*$/, '').trim() || part;
        minuteStr = part.match(/\d+'/)?.[0] || '';
      } else {
        minuteStr = part;
      }
      
      const minMatch = minuteStr.match(/(\d+)/);
      const minNum = minMatch ? parseInt(minMatch[1], 10) : 0;
      
      events.push({
        player: lastName,
        minuteStr: minuteStr,
        minute: minNum,
        teamId: teamId
      });
    });

    return events;
  } catch { return []; }
};

export default function MatchDetailsModal({ match, onClose }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const {
    home_team_name_en, away_team_name_en,
    home_score, away_score,
    home_scorers, away_scorers,
    group, type, stadium_id, local_date
  } = match;

  const isLive = isMatchLive(match);
  const isFinished = isMatchFinished(match);
  const stadium = getStadiumInfo(stadium_id);

  const homeDisplay = home_team_name_en && home_team_name_en !== '0' ? getTeamNameES(home_team_name_en) : 'TBD';
  const awayDisplay = away_team_name_en && away_team_name_en !== '0' ? getTeamNameES(away_team_name_en) : 'TBD';

  let simulatedMinute = '';
  if (isLive) {
    if (match.time_elapsed && match.time_elapsed !== 'live' && match.time_elapsed !== 'notstarted') {
      simulatedMinute = match.time_elapsed;
    } else {
      const startTime = parseMatchDate(local_date, stadium_id);
      if (startTime > 0) {
        const elapsedMs = Date.now() - startTime;
        const elapsedMins = Math.floor(elapsedMs / 60000);
        if (elapsedMins < 0) simulatedMinute = "0'";
        else if (elapsedMins < 45) simulatedMinute = `${Math.max(1, elapsedMins)}'`;
        else if (elapsedMins >= 45 && elapsedMins < 60) simulatedMinute = 'MT';
        else if (elapsedMins >= 60 && elapsedMins < 105) simulatedMinute = `${elapsedMins - 15}'`;
        else simulatedMinute = '90+';
      }
    }
  }

  // Generate timeline
  const homeEvents = parseScorersToTimeline(home_scorers, 'home');
  const awayEvents = parseScorersToTimeline(away_scorers, 'away');
  const allEvents = [...homeEvents, ...awayEvents].sort((a, b) => a.minute - b.minute);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <span className="modal-league">Copa Mundial FIFA 2026</span>
          {isLive && <span className="modal-live-time">{simulatedMinute}</span>}
          {isFinished && <span className="modal-finished-badge">Finalizado</span>}
        </div>

        <div className="modal-scoreboard">
          <div className="modal-team">
            <img src={getFlagUrl(home_team_name_en)} alt={homeDisplay} className="modal-flag" />
            <span className="modal-team-name">{homeDisplay}</span>
          </div>
          <div className="modal-score">
            <span className="modal-score-num">{home_score}</span>
            <span className="modal-score-divider">-</span>
            <span className="modal-score-num">{away_score}</span>
          </div>
          <div className="modal-team">
            <img src={getFlagUrl(away_team_name_en)} alt={awayDisplay} className="modal-flag" />
            <span className="modal-team-name">{awayDisplay}</span>
          </div>
        </div>

        <div className="modal-context">
          {type === 'group' ? `Fase de grupos - Grupo ${group}` : type.toUpperCase()}
          {stadium && ` • ${stadium.city}`}
        </div>

        <div className="modal-tabs">
          <button className="modal-tab active">CRONOLOGÍA</button>
        </div>

        <div className="modal-timeline">
          {allEvents.length === 0 ? (
            <div className="modal-empty-timeline">
              No hay eventos destacados aún.
            </div>
          ) : (
            allEvents.map((ev, i) => (
              <div key={i} className={`timeline-event ${ev.teamId === 'home' ? 'event-home' : 'event-away'}`}>
                <span className="timeline-minute">{ev.minuteStr}</span>
                <span className="timeline-icon">⚽</span>
                <span className="timeline-player">{ev.player}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
