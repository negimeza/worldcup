import React from 'react';
import { getFlagUrl } from '../services/worldCupApi';
import { isMatchLive, isMatchFinished, parseMatchDate, formatMatchDateToLocal } from '../utils/matchStatus';
import { getTeamNameES } from '../utils/teamTranslations';
import { getStadiumInfo } from '../utils/stadiums';

const parseScorers = (str) => {
  if (!str || str === 'null' || str === 'undefined') return [];
  try {
    // Clean curly/smart quotes, brackets, and extra whitespace
    const cleaned = str
      .replace(/^[{\[]/, '').replace(/[}\]]$/, '')
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"""]/g, '')
      .trim();
    if (!cleaned) return [];
    return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
};

// Hoisted outside component — static reference (rendering-hoist-jsx)
const KNOCKOUT_LABELS = {
  r32: 'R32', r16: 'Octavos', qf: 'Cuartos', sf: 'Semi',
  third: '3er Puesto', final: 'FINAL',
};

const getMatchdayLabel = (matchday, type) =>
  type !== 'group' ? (KNOCKOUT_LABELS[type] ?? type.toUpperCase()) : `J${matchday}`;

export default function MatchCard({ match, isFavorite, onToggleFavorite, onClick }) {
  const {
    home_team_name_en, away_team_name_en,
    home_score, away_score,
    home_scorers, away_scorers,
    group, matchday, local_date,
    type, home_team_label, away_team_label,
    stadium_id,
  } = match;

  const isLive     = isMatchLive(match);
  const isFinished = isMatchFinished(match);
  const isUpcoming = !isLive && !isFinished;

  const status = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';

  const homeScorersList = parseScorers(home_scorers);
  const awayScorersList = parseScorers(away_scorers);
  const hasScorers = homeScorersList.length > 0 || awayScorersList.length > 0;

  const homeDisplay = home_team_name_en && home_team_name_en !== '0'
    ? getTeamNameES(home_team_name_en) : (home_team_label || 'TBD');
  const awayDisplay = away_team_name_en && away_team_name_en !== '0'
    ? getTeamNameES(away_team_name_en) : (away_team_label || 'TBD');

  // Stadium info
  const stadium = getStadiumInfo(stadium_id);

  // Simulated minute for live matches
  // Use API's elapsed time if available, otherwise fallback to local calculation
  let simulatedMinute = '';
  if (isLive) {
    if (match.time_elapsed && match.time_elapsed !== 'live' && match.time_elapsed !== 'notstarted') {
      simulatedMinute = match.time_elapsed;
    } else {
      const startTime = parseMatchDate(local_date, stadium_id);
      if (startTime > 0) {
        const elapsedMs = Date.now() - startTime;
        const elapsedMins = Math.floor(elapsedMs / 60000);
        if (elapsedMins < 0) {
          simulatedMinute = "0'";
        } else if (elapsedMins < 45) {
          simulatedMinute = `${Math.max(1, elapsedMins)}'`;
        } else if (elapsedMins >= 45 && elapsedMins < 60) {
          simulatedMinute = 'MT';
        } else if (elapsedMins >= 60 && elapsedMins < 105) {
          simulatedMinute = `${elapsedMins - 15}'`;
        } else {
          simulatedMinute = '90+';
        }
      }
    }
  }

  const showFlagHome = home_team_name_en && home_team_name_en !== '0';
  const showFlagAway = away_team_name_en && away_team_name_en !== '0';

  // WhatsApp share
  const handleShare = () => {
    const dateStr = formatMatchDateToLocal(local_date, stadium_id);
    let text = `\u26BD *${homeDisplay} vs ${awayDisplay}*\n`;
    if (isLive) {
      text += `\uD83D\uDD34 *EN VIVO* ${simulatedMinute ? `(${simulatedMinute})` : ''}\n`;
      text += `*${home_score} - ${away_score}*`;
    } else if (isFinished) {
      text += `\u2705 *Finalizado*\n`;
      text += `*${home_score} - ${away_score}*`;
    } else {
      text += `\uD83D\uDCC5 ${dateStr}`;
    }
    if (stadium) {
      text += `\n\uD83C\uDFDF\uFE0F ${stadium.full}`;
    }
    text += `\n\uD83C\uDFC6 *Mundial 2026*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <article
      className={`match-card match-card--${status}`}
      aria-label={`${homeDisplay} vs ${awayDisplay} — ${isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Próximo'}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
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
                En Vivo {simulatedMinute && <span className="simulated-min">({simulatedMinute})</span>}
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
                  alt={`Bandera de ${homeDisplay}`}
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
                  alt={`Bandera de ${awayDisplay}`}
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
              <span className="scorers-icon" aria-hidden="true">{"\u26BD"}</span>
              <span className="scorers-list">
                <strong>{homeDisplay}:</strong> {homeScorersList.join(', ')}
              </span>
            </div>
          )}
          {awayScorersList.length > 0 && (
            <div className="scorers-row">
              <span className="scorers-icon" aria-hidden="true">{"\u26BD"}</span>
              <span className="scorers-list">
                <strong>{awayDisplay}:</strong> {awayScorersList.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="match-footer">
        <div className="match-footer-info">
          <span className="match-date-display">
            📅 {formatMatchDateToLocal(local_date, stadium_id)}
            <span className="match-tz-label">(hora local)</span>
          </span>
          {stadium && (
            <span className="match-stadium-display">
              🏟️ {stadium.full}
            </span>
          )}
        </div>
        <div className="match-footer-actions">
          <button
            onClick={handleShare}
            className="share-btn"
            aria-label={`Compartir ${homeDisplay} vs ${awayDisplay} por WhatsApp`}
            title="Compartir por WhatsApp"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
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
      </div>
    </article>
  );
}
