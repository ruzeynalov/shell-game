import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css';

function ShellGame({ username }) {
  const [ballPosition, setBallPosition] = useState(null); // 0,1,2
  const [userGuess, setUserGuess] = useState(null);
  const [message, setMessage] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const correctSFXRef = useRef(null);
  const wrongSFXRef = useRef(null);

  // Load existing user stats from local storage
  useEffect(() => {
    const localWins = localStorage.getItem(`${username}_shellGameWins`);
    const localLosses = localStorage.getItem(`${username}_shellGameLosses`);
    if (localWins) setWins(parseInt(localWins, 10));
    if (localLosses) setLosses(parseInt(localLosses, 10));

    startNewRound();
  }, [username]);

  function startNewRound() {
    setUserGuess(null);
    setMessage('');
    // Randomly choose a position 0..2 for the ball
    const randomPos = Math.floor(Math.random() * 3);
    setBallPosition(randomPos);
  }

  async function handleGuess(index) {
    if (userGuess !== null) return; // Already guessed this round
    setUserGuess(index);
    const success = (index === ballPosition);

    if (success) {
      setWins(prev => prev + 1);
      setMessage('Correct! You found the ball!');
      if (correctSFXRef.current) correctSFXRef.current.play();
      // Save to local storage
      localStorage.setItem(`${username}_shellGameWins`, wins + 1);
      // Save to DB
      await saveResultToDB('win');
    } else {
      setLosses(prev => prev + 1);
      setMessage('Wrong! Try again next time.');
      if (wrongSFXRef.current) wrongSFXRef.current.play();
      // Save to local storage
      localStorage.setItem(`${username}_shellGameLosses`, losses + 1);
      // Save to DB
      await saveResultToDB('lose');
    }
  }

  async function saveResultToDB(outcome) {
    try {
      await axios.post('/api/results', {
        username,
        outcome
      });
    } catch (error) {
      console.error('Failed to save result to DB:', error);
    }
  }

  return (
    <div className="shell-game-container">
      <h2>Hello, {username}!</h2>
      <p>Wins: {wins} | Losses: {losses}</p>

      <div className="cups-container">
        {[0, 1, 2].map((cupIndex) => (
          <div
            key={cupIndex}
            className="cup"
            onClick={() => handleGuess(cupIndex)}
          >
            {/* Show ball if guessed OR if user guessed that cup and it's correct */}
            {(userGuess !== null && cupIndex === ballPosition) ? (
              <div className="ball" />
            ) : (
              <div className="hidden-ball" />
            )}
          </div>
        ))}
      </div>

      <p style={{ fontWeight: 'bold', marginTop: '20px' }}>{message}</p>

      {userGuess !== null && (
        <button onClick={startNewRound}>
          Play Again
        </button>
      )}

      {/* Sound effects */}
      <audio ref={correctSFXRef} src="/correct.mp3" />
      <audio ref={wrongSFXRef} src="/wrong.mp3" />
    </div>
  );
}

export default ShellGame;
