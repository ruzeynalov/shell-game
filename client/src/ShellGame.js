// ShellGame.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css';
// NEW imports:
import ShellGameCanvas from './ShellGameCanvas.js';
import Leaderboard from './Leaderboard.js';

function ShellGame({ username }) {
  const [ballPosition, setBallPosition] = useState(null);  // 0..2
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [disabledCups, setDisabledCups] = useState([false, false, false]);
  const [message, setMessage] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foundBall, setFoundBall] = useState(false);

  const correctSFXRef = useRef(null);
  const wrongSFXRef = useRef(null);

  useEffect(() => {
    // Load stats from local storage
    const localWins = localStorage.getItem(`${username}_shellGameWins`);
    const localLosses = localStorage.getItem(`${username}_shellGameLosses`);
    if (localWins) setWins(parseInt(localWins, 10));
    if (localLosses) setLosses(parseInt(localLosses, 10));
    startNewRound();
  }, [username]);

  function startNewRound() {
    // Random position for the ball
    const randomPos = Math.floor(Math.random() * 3);
    setBallPosition(randomPos);

    // Reset state
    setAttemptsUsed(0);
    setDisabledCups([false, false, false]);
    setMessage('');
    setGameOver(false);
    setFoundBall(false);
  }

  async function handleGuess(cupIndex) {
    if (gameOver || disabledCups[cupIndex]) return;

    // Mark the cup as disabled
    setDisabledCups(prev => {
      const updated = [...prev];
      updated[cupIndex] = true;
      return updated;
    });

    // Increase attempt count
    setAttemptsUsed(prev => prev + 1);

    // Check correctness
    const success = (cupIndex === ballPosition);
    if (success) {
      setFoundBall(true);
      setGameOver(true);
      setMessage('Correct! You found the ball!');
      correctSFXRef.current?.play();

      // Update local wins
      const newWins = wins + 1;
      setWins(newWins);
      localStorage.setItem(`${username}_shellGameWins`, newWins);

      // Also save to DB
      await saveResultToDB('win');
    } else {
      // Wrong guess
      if (attemptsUsed + 1 === 2) {
        setGameOver(true);
        setMessage('Wrong! You used 2 tries. You lose!');
        wrongSFXRef.current?.play();

        // Update local losses
        const newLosses = losses + 1;
        setLosses(newLosses);
        localStorage.setItem(`${username}_shellGameLosses`, newLosses);

        // Save to DB
        await saveResultToDB('lose');
      } else {
        setMessage('Wrong guess. Try again!');
        wrongSFXRef.current?.play();
      }
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

      {/* Replaced old <div className="cups-container"> with 3D canvas */}
      <ShellGameCanvas
        ballPosition={ballPosition}
        disabledCups={disabledCups}
        gameOver={gameOver}
        foundBall={foundBall}
        onCupClick={handleGuess}
      />

      <p style={{ fontWeight: 'bold', marginTop: '20px' }}>{message}</p>

      {gameOver && (
        <button onClick={startNewRound}>
          Play Again
        </button>
      )}

      {/* SFX */}
      <audio ref={correctSFXRef} src="/correct.mp3" />
      <audio ref={wrongSFXRef} src="/wrong.mp3" />

      {/* NEW: Leaderboard below the game */}
      <Leaderboard />
    </div>
  );
}

export default ShellGame;
