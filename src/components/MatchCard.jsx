import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';
import { isMatchLive, isMatchFinished } from '../utils/matchStatus';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const parseScorers = (str) => {
  if (!str || str === 'null' || str === 'undefined') return [];
  try {
    const cleaned = str.replace(/^[{\[]/, '').replace(/[}\]]$/, '').replace(/["""]/g, '').trim();
    if (!cleaned) return [];
    return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day] = datePart.split('/');
    return `${parseInt(day, 10)} ${MONTHS_ES[parseInt(month, 10) - 1]} · ${timePart}`;
  } catch { return dateStr; }
};

// Hoisted outside component — static reference (rendering-hoist-jsx)
const KNOCKOUT_LABELS = {
  r32: 'R32', r16: 'Octavos', qf: 'Cuartos', sf: 'Semi',
  third: '3er Puesto', final: 'FINAL',
};

const getMatchdayLabel = (matchday, type) =>
  type !== 'group' ? (KNOCKOUT_LABELS[type] ?? type.toUpperCase()) : `J${matchday}`;

export default function MatchCard({ match, isFavorite, onToggleFavorite }) {
  const {
    home_team_name_en, away_team_name_en,
    home_score, away_score,
    home_scorers, away_scorers,
    group, matchday, local_date,
    type, home_team_label, away_team_label,
  } = match;

  const isLive     = isMatchLive(match);
  const isFinished = isMatchFinished(match);
  const isUpcoming = !isLive && !isFinished;

  const status = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';

  const homeScorersList = parseScorers(home_scorers);
  const awayScorersList = parseScorers(away_scorers);
  const hasScorers = homeScorersList.length > 0 || awayScorersList.length > 0;

  const homeDisplay = home_team_name_en && home_team_name_en !== '0'
    ? home_team_name_en : (home_team_label || 'TBD');
  const awayDisplay = away_team_name_en && away_team_name_en !== '0'
    ? away_team_name_en : (away_team_label || 'TBD');

  const showFlagHome = home_team_name_en && home_team_name_en !== '0';
  const showFlagAway = away_team_name_en && away_team_name_en !== '0';

  return (
    <article
      className={`match-card match-card--${status}`}
      aria-label={`${homeDisplay} vs ${awayDisplay} — ${isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Próximo'}`}
    >
      {/* Inner body */}
      <div className="match-card-body">

        {/* ── Header row ── */}
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
            {isFinished && <span className="match-status-badge finished">Finalizado</span>}
            {isUpcoming && <span className="match-status-badge upcoming">Próximo</span>}
          </div>
        </div>

        {/* ── Score row: Home | Scoreboard | Away ── */}
        <div className="match-score-layout">

          {/* Home team */}
          <div className="match-team match-team--home">
            <div className="team-flag-wrap">
              {showFlagHome ? (
                <img
                  src={getFlagUrl(home_team_name_en)}
                  alt={`Bandera de ${home_team_name_en}`}
                  className="team-flag"
                  width="40" height="28"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder" aria-hidden="true" />
              )}
            </div>
            <span className="team-name">{homeDisplay}</span>
          </div>

          {/* Center scoreboard */}
          <div className="match-scoreboard">
            <span
              className="score-number"
              aria-label={isUpcoming ? 'Sin jugar' : `${home_score} goles`}
            >
              {isUpcoming ? '-' : home_score}
            </span>
            <span className="score-separator" aria-hidden="true">:</span>
            <span
              className="score-number"
              aria-label={isUpcoming ? 'Sin jugar' : `${away_score} goles`}
            >
              {isUpcoming ? '-' : away_score}
            </span>
            {isLive && <span className="live-dot-sm" aria-hidden="true" />}
          </div>

          {/* Away team */}
          <div className="match-team match-team--away">
            <div className="team-flag-wrap">
              {showFlagAway ? (
                <img
                  src={getFlagUrl(away_team_name_en)}
                  alt={`Bandera de ${away_team_name_en}`}
                  className="team-flag"
                  width="40" height="28"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="team-flag-placeholder" aria-hidden="true" />
              )}
            </div>
            <span className="team-name">{awayDisplay}</span>
          </div>
        </div>
      </div>

      {/* ── Scorers ── */}
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

      {/* ── Footer ── */}
      <div className="match-footer">
        <div className="stadium-info">
          <span>📅 {formatDate(local_date)}</span>
        </div>
        <button
          onClick={onToggleFavorite}
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          aria-label={isFavorite
            ? `Quitar ${homeDisplay} vs ${awayDisplay} de favoritos`
            : `Añadir ${homeDisplay} vs ${awayDisplay} a favoritos`}
          aria-pressed={isFavorite}
        >
          <svg width="17" height="17" viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </article>
  );
}
