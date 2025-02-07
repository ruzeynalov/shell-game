// Leaderboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [spheres, setSpheres] = useState([]);

  useEffect(() => {
    // Generate random floating spheres
    const newSpheres = Array(5).fill().map((_, i) => ({
      id: i,
      left: `${Math.random() * 90}%`,
      delay: `${Math.random() * 2}s`,
      size: 20 + Math.random() * 30
    }));
    setSpheres(newSpheres);

    fetchLeaderboard();
    const intervalId = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(intervalId);
  }, []);

  async function fetchLeaderboard() {
    try {
      const [leaderResp, resultsResp] = await Promise.all([
        axios.get('/api/leaderboard'),
        axios.get('/api/results')
      ]);
      
      setPlayers(Array.isArray(leaderResp.data) ? leaderResp.data : []);
      setRecentGames(resultsResp.data.slice(-5).reverse()); // Show last 5 games
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Game Statistics</h2>
      
      {/* Decorative floating spheres */}
      {spheres.map(sphere => (
        <div
          key={sphere.id}
          className="floating-sphere"
          style={{
            left: sphere.left,
            animationDelay: sphere.delay,
            width: `${sphere.size}px`,
            height: `${sphere.size}px`
          }}
        />
      ))}

      <div className="leaderboard-grid">
        <div className="top-winners">
          <h3>Top Winners</h3>
          {players.slice(0, 5).map((player, idx) => (
            <div key={player.username} className="winner-entry">
              <span className="winner-rank">{idx + 1}</span>
              <span>{player.username}</span>
              <span style={{marginLeft: 'auto'}}>{player.wins} wins</span>
            </div>
          ))}
        </div>

        <div className="recent-games">
          <h3>Recent Games</h3>
          {recentGames.map((game, idx) => (
            <div key={idx} className="recent-game">
              <strong>{game.username}</strong>
              <span> {game.outcome === 'win' ? '🏆 Won!' : '❌ Lost'}</span>
              <div style={{fontSize: '0.8em', color: '#666'}}>
                {new Date(game.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;