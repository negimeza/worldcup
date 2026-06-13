import React from 'react';
import MatchCard from './MatchCard';

/**
 * HeroBanner — shows the featured live or next upcoming match.
 */
export default function HeroBanner({ featured, isFavorite, onToggleFavorite }) {
  if (!featured) return null;

  const { match, isLive } = featured;

  const dateLabel = (() => {
    try {
      const [datePart, timePart] = (match.local_date || '').split(' ');
      const [month, day, year] = datePart.split('/');
      const date = new Date(year, month - 1, day, ...timePart.split(':'));
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return match.local_date || '';
    }
  })();

  return (
    <section className="hero-banner" aria-label="Partido destacado">
      <span className="hero-tag">
        {isLive ? '🔴 EN VIVO AHORA' : '📅 PRÓXIMO PARTIDO DESTACADO'}
      </span>
      <h2 className="hero-title">
        {match.home_team_name_en} vs {match.away_team_name_en}
      </h2>
      <p className="hero-subtitle">
        {isLive
          ? `Marcador actual: ${match.home_score} - ${match.away_score}. Sigue el minuto a minuto en directo.`
          : `El encuentro se disputará el ${dateLabel}.`}
      </p>
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
