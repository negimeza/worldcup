import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';

const parseScorers = (scorersStr) => {
  if (!scorersStr || scorersStr === 'null' || scorersStr === 'undefined') return [];
  try {
    // Remove curly braces or brackets, replace smart/weird quotes, replace escaped quotes
    const cleaned = scorersStr
      .replace(/^[{\[]/, '')
      .replace(/[}\]]$/, '')
      .replace(/["“”]/g, '')
      .trim();
    
    if (!cleaned) return [];
    
    return cleaned.split(',').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.error('Error parsing scorers:', e);
    return [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} de ${months[monthIndex]} - ${hour}:${minute} hs`;
  } catch (e) {
    return dateStr;
  }
};

// Matchday display mapper
const getMatchdayLabel = (matchday, type) => {
  if (type !== 'group') {
    switch (type) {
      case 'r32': return 'Dieciseisavos (R32)';
      case 'r16': return 'Octavos de Final';
      case 'qf': return 'Cuartos de Final';
      case 'sf': return 'Semifinal';
      case 'third': return 'Tercer Puesto';
      case 'final': return 'Gran Final';
      default: return type.toUpperCase();
    }
  }
  return `Jornada ${matchday}`;
};

export default function MatchCard({ match, isFavorite, onToggleFavorite }) {
  const {
    id,
    home_team_name_en,
    away_team_name_en,
    home_score,
    away_score,
    home_scorers,
    away_scorers,
    group,
    matchday,
    local_date,
    finished,
    time_elapsed,
    type,
    home_team_label,
    away_team_label
  } = match;

  const isLive = time_elapsed === 'live' || (finished === 'FALSE' && time_elapsed !== 'notstarted');
  const isFinished = finished === 'TRUE' || time_elapsed === 'finished';
  const isUpcoming = !isLive && !isFinished;

  const homeScorersList = parseScorers(home_scorers);
  const awayScorersList = parseScorers(away_scorers);
  const hasScorers = homeScorersList.length > 0 || awayScorersList.length > 0;

  // Use labels (like "Winner Group A") for knockout stage matches if teams are not yet determined (id is 0 or team name is "0")
  const homeDisplay = home_team_name_en && home_team_name_en !== '0' ? home_team_name_en : (home_team_label || 'TBD');
  const awayDisplay = away_team_name_en && away_team_name_en !== '0' ? away_team_name_en : (away_team_label || 'TBD');

  const showFlagHome = home_team_name_en && home_team_name_en !== '0';
  const showFlagAway = away_team_name_en && away_team_name_en !== '0';

  return (
    <div className="match-card">
      <div>
        <div className="match-card-header">
          <span className="match-info-pill">
            {getMatchdayLabel(matchday, type)} {group && group.length === 1 ? `• Grupo ${group}` : ''}
          </span>
          
          <div className="match-status-wrapper">
            {isLive && (
              <span className="match-status-badge live">
                <span className="pulse-dot"></span>
                En Vivo
              </span>
            )}
            {isFinished && (
              <span className="match-status-badge finished">
                Finalizado
              </span>
            )}
            {isUpcoming && (
              <span className="match-status-badge upcoming">
                Próximo
              </span>
            )}
          </div>
        </div>

        <div className="match-teams-score">
          {/* Home Team */}
          <div className="team-row">
            <div className="team-info">
              {showFlagHome ? (
                <img 
                  src={getFlagUrl(home_team_name_en)} 
                  alt={`Bandera de ${home_team_name_en}`} 
                  className="team-flag"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder"></div>
              )}
              <span className="team-name">{homeDisplay}</span>
            </div>
            <span className={`team-score ${isUpcoming ? 'muted' : ''}`}>
              {isUpcoming ? '-' : home_score}
            </span>
          </div>

          {/* Away Team */}
          <div className="team-row">
            <div className="team-info">
              {showFlagAway ? (
                <img 
                  src={getFlagUrl(away_team_name_en)} 
                  alt={`Bandera de ${away_team_name_en}`} 
                  className="team-flag"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder"></div>
              )}
              <span className="team-name">{awayDisplay}</span>
            </div>
            <span className={`team-score ${isUpcoming ? 'muted' : ''}`}>
              {isUpcoming ? '-' : away_score}
            </span>
          </div>
        </div>

        {/* Scorers detail (only if goals scored) */}
        {!isUpcoming && hasScorers && (
          <div className="match-scorers">
            {homeScorersList.length > 0 && (
              <div className="scorers-row">
                <span className="scorers-icon">⚽</span>
                <span className="scorers-list">
                  <strong>{homeDisplay}:</strong> {homeScorersList.join(', ')}
                </span>
              </div>
            )}
            {awayScorersList.length > 0 && (
              <div className="scorers-row">
                <span className="scorers-icon">⚽</span>
                <span className="scorers-list">
                  <strong>{awayDisplay}:</strong> {awayScorersList.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="match-footer">
        <div className="stadium-info">
          <span>📅 {formatDate(local_date)}</span>
        </div>
        
        <button 
          onClick={onToggleFavorite}
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
          aria-label="Favorito"
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill={isFavorite ? "currentColor" : "none"} 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
