import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ShellGame from './ShellGame.js';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // Check if user is in session or waiting list
  const [sessionState, setSessionState] = useState(null);
  const [waitingPosition, setWaitingPosition] = useState(null);

  useEffect(() => {
    // Check session state periodically
    if (isLoggedIn) {
      const checkSession = async () => {
        try {
          const { data } = await axios.get('/api/session');
          setSessionState(data.session);
          const position = data.waitingList.indexOf(username);
          setWaitingPosition(position >= 0 ? position + 1 : null);
        } catch (err) {
          console.error('Error checking session:', err);
        }
      };

      checkSession();
      const intervalId = setInterval(checkSession, 2000);
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, username]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      await axios.post(endpoint, { username, password });
      setIsLoggedIn(true);
      // Try to join waiting list immediately after login
      await axios.post('/api/join-waiting-list', { username });
    } catch (err) {
      setError(err.response?.data || 'An error occurred');
    }
  };

  // Start/stop background music
  useEffect(() => {
    if (audioRef.current && isLoggedIn) {
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => {
        console.log('Autoplay blocked:', err);
      });
    }
  }, [isLoggedIn]);

  const getStatusMessage = () => {
    if (!sessionState?.active) {
      return waitingPosition 
        ? `You are #${waitingPosition} in the waiting list`
        : 'Waiting for more players to join...';
    }
    if (sessionState.players.includes(username)) {
      const isCurrentPlayer = sessionState.players[sessionState.currentPlayerIndex] === username;
      return isCurrentPlayer ? "It's your turn!" : `Waiting for ${sessionState.players[sessionState.currentPlayerIndex]} to play...`;
    }
    return 'Waiting for current session to end...';
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <audio ref={audioRef} src="/background-music.mp3" />
      {!isLoggedIn ? (
        <div>
          <h1>Welcome to the Shell Game!</h1>
          <p>Please {isRegistering ? 'register' : 'login'} to start playing:</p>
          <form onSubmit={handleAuth}>
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <p>
            <button onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </p>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}!</h2>
          <p>{getStatusMessage()}</p>
          {sessionState?.active && sessionState.players.includes(username) ? (
            <ShellGame 
              username={username} 
              sessionState={sessionState}
              isCurrentPlayer={sessionState.players[sessionState.currentPlayerIndex] === username}
            />
          ) : (
            <div>
              <h3>Current Session</h3>
              {sessionState?.active ? (
                <div>
                  <p>Current players:</p>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {sessionState.players.map((player, i) => (
                      <li key={player}>
                        {i + 1}. {player} 
                        {player === sessionState.players[sessionState.currentPlayerIndex] && ' (current turn)'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No active session</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
