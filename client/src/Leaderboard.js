// Leaderboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Fetch on mount
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const resp = await axios.get('/api/leaderboard');
      setPlayers(resp.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }

  return (
    <div className="leaderboard-container">
      <h3>Global Leaderboard</h3>
      <button onClick={fetchLeaderboard}>Refresh</button>
      <ul>
        {players.map((player, idx) => (
          <li key={player.username}>
            {idx + 1}. {player.username} — {player.wins} wins
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;
