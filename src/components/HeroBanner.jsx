import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard';
import { getTeamNameES } from '../utils/teamTranslations';
import { formatMatchDateToLocalLong, parseMatchDate } from '../utils/matchStatus';
import { getStadiumInfo } from '../utils/stadiums';

/**
 * HeroBanner — shows the featured live or next upcoming match.
 * Includes a live countdown for upcoming matches.
 */
export default function HeroBanner({ featured, isFavorite, onToggleFavorite }) {
  if (!featured) return null;

  const { match, isLive } = featured;
  const [countdown, setCountdown] = useState('');

  const dateLabel = formatMatchDateToLocalLong(match.local_date, match.stadium_id);
  const stadium = getStadiumInfo(match.stadium_id);

  const homeDisplay = match.home_team_name_en && match.home_team_name_en !== '0'
    ? getTeamNameES(match.home_team_name_en) : (match.home_team_label || 'TBD');
  const awayDisplay = match.away_team_name_en && match.away_team_name_en !== '0'
    ? getTeamNameES(match.away_team_name_en) : (match.away_team_label || 'TBD');

  // Live countdown for upcoming matches
  useEffect(() => {
    if (isLive) {
      setCountdown('');
      return;
    }

    const startTime = parseMatchDate(match.local_date, match.stadium_id);
    if (!startTime) return;

    const updateCountdown = () => {
      const diff = startTime - Date.now();
      if (diff <= 0) {
        setCountdown('¡Comienza ahora!');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${mins}m`);
      if (days === 0) parts.push(`${secs}s`);

      setCountdown(`Empieza en ${parts.join(' ')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isLive, match.local_date, match.stadium_id]);

  return (
    <section className="hero-banner" aria-label="Partido destacado">
      <span className="hero-tag">
        {isLive ? '🔴 EN VIVO AHORA' : '📅 PRÓXIMO PARTIDO DESTACADO'}
      </span>
      <h2 className="hero-title">
        {homeDisplay} vs {awayDisplay}
      </h2>
      <p className="hero-subtitle">
        {isLive
          ? `Marcador actual: ${match.home_score} - ${match.away_score}. Sigue el minuto a minuto en directo.`
          : countdown
            ? <><span className="hero-countdown">{countdown}</span> · {dateLabel}</>
            : `El encuentro se disputará el ${dateLabel}.`}
      </p>
      {stadium && (
        <p className="hero-stadium">
          🏟️ {stadium.full} {stadium.country}
        </p>
      )}
      <div className="hero-card-wrapper">
        <MatchCard
          match={match}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </section>
  );
}
