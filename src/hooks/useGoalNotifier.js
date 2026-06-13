import { useEffect, useRef, useState } from 'react';
import { isMatchLive } from '../utils/matchStatus';
import { getTeamNameES } from '../utils/teamTranslations';

/**
 * useGoalNotifier compares the previous games state with the new one.
 * If a live match's score increases, it triggers a toast notification.
 */
export function useGoalNotifier(games, teamsMap) {
  const [toast, setToast] = useState(null);
  const prevGamesRef = useRef({});

  useEffect(() => {
    if (!games || games.length === 0) return;

    const newPrevMap = {};
    let detectedGoal = null;

    games.forEach((game) => {
      newPrevMap[game.id] = {
        home_score: parseInt(game.home_score, 10) || 0,
        away_score: parseInt(game.away_score, 10) || 0,
      };

      const prevGame = prevGamesRef.current[game.id];
      // Only notify for live matches
      if (prevGame && isMatchLive(game)) {
        const homeScore = parseInt(game.home_score, 10) || 0;
        const awayScore = parseInt(game.away_score, 10) || 0;

        if (homeScore > prevGame.home_score || awayScore > prevGame.away_score) {
          const homeDisplay = game.home_team_name_en && game.home_team_name_en !== '0'
            ? getTeamNameES(game.home_team_name_en) : (game.home_team_label || 'TBD');
          const awayDisplay = game.away_team_name_en && game.away_team_name_en !== '0'
            ? getTeamNameES(game.away_team_name_en) : (game.away_team_label || 'TBD');

          detectedGoal = {
            id: Date.now(), // unique id for toast
            title: '⚽ ¡GOL!',
            message: `${homeDisplay} ${homeScore} - ${awayScore} ${awayDisplay}`,
          };
        }
      }
    });

    prevGamesRef.current = newPrevMap;

    if (detectedGoal) {
      setToast(detectedGoal);
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToast((current) => current?.id === detectedGoal.id ? null : current);
      }, 5000);
    }
  }, [games, teamsMap]);

  return { toast, clearToast: () => setToast(null) };
}
