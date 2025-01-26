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
      console.log('API response:', resp.data); // Debugging log
      setPlayers(Array.isArray(resp.data) ? resp.data : []); // Ensure players is an array
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setPlayers([]); // Fallback to empty array on error
    }
  }

  return (
    <div className="leaderboard-container">
      <h3>Global Leaderboard</h3>
      <button onClick={fetchLeaderboard}>Refresh</button>
      <ul>
        {Array.isArray(players) && players.map((player, idx) => (
          <li key={player.username}>
            {idx + 1}. {player.username} — {player.wins} wins
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;
