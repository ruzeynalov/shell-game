// Leaderboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Immediately fetch once on mount
    fetchLeaderboard();

    // Poll every 5 seconds
    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, 5000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  async function fetchLeaderboard() {
    try {
      const resp = await axios.get('/api/leaderboard');
      console.log('Leaderboard data:', resp.data);
      setPlayers(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setPlayers([]);
    }
  }

  return (
    <div className="leaderboard-container">
      <h3>Global Leaderboard (auto‐updating)</h3>
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