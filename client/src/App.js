import React, { useState, useEffect, useRef } from 'react';
import ShellGame from './ShellGame.js';

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const audioRef = useRef(null);

  // Attempt to retrieve username from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('shellGameUser');
    if (storedUser) {
      setUsername(storedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (username.trim() !== '') {
      localStorage.setItem('shellGameUser', username.trim());
      setIsLoggedIn(true);
    }
  };

  // Start/stop background music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // volume (0.0 - 1.0)
      audioRef.current.loop = true;
      audioRef.current.play().catch((err) => {
        // Some browsers block autoplay
        console.log('Autoplay blocked:', err);
      });
    }
  }, [isLoggedIn]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <audio ref={audioRef} src="/background-music.mp3" />
      {!isLoggedIn ? (
        <div>
          <h1>Welcome to the Shell Game!</h1>
          <p>Please enter your name to start playing:</p>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button onClick={handleLogin}>Start Game</button>
        </div>
      ) : (
        <ShellGame username={username} />
      )}
    </div>
  );
}

export default App;
