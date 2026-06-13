import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';
import { isMatchLive, isMatchFinished } from '../utils/matchStatus';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseScorers = (scorersStr) => {
  if (!scorersStr || scorersStr === 'null' || scorersStr === 'undefined') return [];
  try {
    const cleaned = scorersStr
      .replace(/^[{\[]/, '')
      .replace(/[}\]]$/, '')
      .replace(/["""]/g, '')
      .trim();
    if (!cleaned) return [];
    return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day] = datePart.split('/');
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} de ${MONTHS_ES[monthIndex]} - ${timePart} hs`;
  } catch {
    return dateStr;
  }
};

// Matchday display mapper — defined outside component so JSX is static (rendering-hoist-jsx)
const KNOCKOUT_LABELS = {
  r32: 'Dieciseisavos (R32)',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinal',
  third: 'Tercer Puesto',
  final: 'Gran Final',
};

const getMatchdayLabel = (matchday, type) => {
  if (type !== 'group') return KNOCKOUT_LABELS[type] ?? type.toUpperCase();
  return `Jornada ${matchday}`;
};

export default function MatchCard({ match, isFavorite, onToggleFavorite }) {
  const {
    home_team_name_en,
    away_team_name_en,
    home_score,
    away_score,
    home_scorers,
    away_scorers,
    group,
    matchday,
    local_date,
    type,
    home_team_label,
    away_team_label,
  } = match;

  const isLive = isMatchLive(match);
  const isFinished = isMatchFinished(match);
  const isUpcoming = !isLive && !isFinished;

  const homeScorersList = parseScorers(home_scorers);
  const awayScorersList = parseScorers(away_scorers);
  const hasScorers = homeScorersList.length > 0 || awayScorersList.length > 0;

  const homeDisplay =
    home_team_name_en && home_team_name_en !== '0'
      ? home_team_name_en
      : home_team_label || 'TBD';
  const awayDisplay =
    away_team_name_en && away_team_name_en !== '0'
      ? away_team_name_en
      : away_team_label || 'TBD';

  const showFlagHome = home_team_name_en && home_team_name_en !== '0';
  const showFlagAway = away_team_name_en && away_team_name_en !== '0';

  // Dynamic status label for aria
  const statusLabel = isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Próximo';

  return (
    <article
      className="match-card"
      aria-label={`Partido ${homeDisplay} vs ${awayDisplay} — ${statusLabel}`}
    >
      <div>
        {/* Card header */}
        <div className="match-card-header">
          <span className="match-info-pill">
            {getMatchdayLabel(matchday, type)}
            {group && group.length === 1 ? ` · Grupo ${group}` : ''}
          </span>

          <div className="match-status-wrapper">
            {isLive && (
              <span className="match-status-badge live" role="status" aria-live="polite">
                <span className="pulse-dot" aria-hidden="true" />
                En Vivo
              </span>
            )}
            {isFinished && (
              <span className="match-status-badge finished">Finalizado</span>
            )}
            {isUpcoming && (
              <span className="match-status-badge upcoming">Próximo</span>
            )}
          </div>
        </div>

        {/* Teams and scores */}
        <div className="match-teams-score">
          {/* Home team */}
          <div className="team-row">
            <div className="team-info">
              {showFlagHome ? (
                <img
                  src={getFlagUrl(home_team_name_en)}
                  alt={`Bandera de ${home_team_name_en}`}
                  className="team-flag"
                  width="38"
                  height="25"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder" aria-hidden="true" />
              )}
              <span className="team-name">{homeDisplay}</span>
            </div>
            <span className={`team-score ${isUpcoming ? 'muted' : ''}`} aria-label={isUpcoming ? 'Sin jugar' : `${home_score} goles`}>
              {isUpcoming ? '-' : home_score}
            </span>
          </div>

          {/* Away team */}
          <div className="team-row">
            <div className="team-info">
              {showFlagAway ? (
                <img
                  src={getFlagUrl(away_team_name_en)}
                  alt={`Bandera de ${away_team_name_en}`}
                  className="team-flag"
                  width="38"
                  height="25"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder" aria-hidden="true" />
              )}
              <span className="team-name">{awayDisplay}</span>
            </div>
            <span className={`team-score ${isUpcoming ? 'muted' : ''}`} aria-label={isUpcoming ? 'Sin jugar' : `${away_score} goles`}>
              {isUpcoming ? '-' : away_score}
            </span>
          </div>
        </div>

        {/* Scorers */}
        {!isUpcoming && hasScorers && (
          <div className="match-scorers">
            {homeScorersList.length > 0 && (
              <div className="scorers-row">
                <span className="scorers-icon" aria-hidden="true">⚽</span>
                <span className="scorers-list">
                  <strong>{homeDisplay}:</strong> {homeScorersList.join(', ')}
                </span>
              </div>
            )}
            {awayScorersList.length > 0 && (
              <div className="scorers-row">
                <span className="scorers-icon" aria-hidden="true">⚽</span>
                <span className="scorers-list">
                  <strong>{awayDisplay}:</strong> {awayScorersList.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="match-footer">
        <div className="stadium-info">
          <span aria-label={`Fecha: ${formatDate(local_date)}`}>📅 {formatDate(local_date)}</span>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          aria-label={
            isFavorite
              ? `Quitar ${homeDisplay} vs ${awayDisplay} de favoritos`
              : `Añadir ${homeDisplay} vs ${awayDisplay} a favoritos`
          }
          aria-pressed={isFavorite}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
