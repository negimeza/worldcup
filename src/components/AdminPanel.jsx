import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { ref, onValue, set, update } from 'firebase/database';
import { backupGames } from '../services/backupData';
import { getFlagUrl } from '../services/worldCupApi';

export default function AdminPanel() {
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const gamesRef = ref(db, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        setGames(snapshot.val());
      } else {
        setGames({});
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase DB Error:', error);
      setErrorMsg(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInitDB = async () => {
    try {
      const gamesObj = {};
      
      backupGames.forEach(game => {
        gamesObj[game.id] = {
          ...game,
          home_score: '0',
          away_score: '0',
          finished: 'FALSE',
          time_elapsed: 'notstarted'
        };
      });
      await set(ref(db, 'games'), gamesObj);
      alert('¡Base de datos inicializada con el calendario real oficial, y todos los marcadores en 0-0 listos para ti!');
    } catch (error) {
      alert('Error inicializando: Asegúrate de haber puesto reglas de Test Mode en Firebase. ' + error.message);
    }
  };

  const updateGameField = async (gameId, field, value) => {
    try {
      await update(ref(db, `games/${gameId}`), {
        [field]: value
      });
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const changeScore = (gameId, currentScoreStr, team, delta) => {
    const currentScore = parseInt(currentScoreStr || '0', 10);
    const newScore = Math.max(0, currentScore + delta).toString(); // Prevent negative goals
    updateGameField(gameId, `${team}_score`, newScore);
  };

  if (loading) return <div style={{ padding: '20px', color: 'white' }}>Cargando Panel de Control...</div>;
  if (errorMsg) return <div style={{ padding: '20px', color: '#ef4444', fontWeight: 'bold' }}>Error de Firebase: {errorMsg}</div>;

  const gamesList = Object.values(games).sort((a, b) => new Date(a.local_date) - new Date(b.local_date));

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>⚙️ Panel de Administrador de Partidos</h2>
        <button 
          onClick={handleInitDB}
          style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {gamesList.length === 0 ? '📥 Cargar Calendario Oficial' : '🔄 Reiniciar a 0-0'}
        </button>
      </header>

      {gamesList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {gamesList.map((game) => (
            <div key={game.id} style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              
              {/* Equipo Local */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '25%' }}>
                <img src={getFlagUrl(game.home_team_name_en)} width="30" alt="" />
                <span style={{ fontWeight: 'bold' }}>{game.home_team_name_en}</span>
              </div>

              {/* Controles de Goles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => changeScore(game.id, game.home_score, 'home', -1)} style={btnStyle}>-</button>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{game.home_score}</span>
                  <button onClick={() => changeScore(game.id, game.home_score, 'home', 1)} style={btnStyle}>+</button>
                </div>
                <span style={{ color: '#94a3b8' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => changeScore(game.id, game.away_score, 'away', -1)} style={btnStyle}>-</button>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{game.away_score}</span>
                  <button onClick={() => changeScore(game.id, game.away_score, 'away', 1)} style={btnStyle}>+</button>
                </div>
              </div>

              {/* Equipo Visitante */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '25%', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 'bold' }}>{game.away_team_name_en}</span>
                <img src={getFlagUrl(game.away_team_name_en)} width="30" alt="" />
              </div>

              {/* Estado del Partido */}
              <div style={{ display: 'flex', gap: '5px', width: '20%', justifyContent: 'flex-end' }}>
                <select 
                  value={game.finished === 'TRUE' ? 'finished' : (game.time_elapsed === 'live' || (game.time_elapsed !== 'notstarted' && game.finished === 'FALSE') ? 'live' : 'notstarted')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'notstarted') {
                      updateGameField(game.id, 'time_elapsed', 'notstarted');
                      updateGameField(game.id, 'finished', 'FALSE');
                    } else if (val === 'live') {
                      updateGameField(game.id, 'time_elapsed', "1'"); // Empieza en min 1 simulado
                      updateGameField(game.id, 'finished', 'FALSE');
                    } else if (val === 'finished') {
                      updateGameField(game.id, 'time_elapsed', "90'");
                      updateGameField(game.id, 'finished', 'TRUE');
                    }
                  }}
                  style={{ padding: '8px', borderRadius: '6px', background: '#334155', color: 'white', border: 'none', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="notstarted">Próximo</option>
                  <option value="live">🟢 En Vivo</option>
                  <option value="finished">Finalizado</option>
                </select>

                {/* Minuto exacto */}
                <input 
                  type="text" 
                  value={game.time_elapsed} 
                  onChange={(e) => updateGameField(game.id, 'time_elapsed', e.target.value)}
                  style={{ width: '60px', padding: '8px', borderRadius: '6px', background: '#334155', color: 'white', border: '1px solid #475569', textAlign: 'center' }}
                  title="Minuto exacto (ej. 45' o HT)"
                />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  width: '30px', 
  height: '30px', 
  background: '#3b82f6', 
  color: 'white', 
  border: 'none', 
  borderRadius: '50%', 
  fontSize: '18px', 
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
};
