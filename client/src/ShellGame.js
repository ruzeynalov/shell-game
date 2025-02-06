// ShellGame.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css'; 
import ShellGameCanvas from './ShellGameCanvas.js';
import Leaderboard from './Leaderboard.js';

function ShellGame({ username }) {
  const [ballPosition, setBallPosition] = useState(null); 
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  // Instead of "disabledPlanets," we'll track wrong guesses
  const [planetWrong, setPlanetWrong] = useState([false, false, false]);

  const [message, setMessage] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foundBall, setFoundBall] = useState(false);

  const correctSFXRef = useRef(null);
  const wrongSFXRef = useRef(null);

  // On mount or username change, load local stats and start a round
  useEffect(() => {
    const w = localStorage.getItem(`${username}_shellGameWins`);
    const l = localStorage.getItem(`${username}_shellGameLosses`);
    if (w) setWins(parseInt(w, 10));
    if (l) setLosses(parseInt(l, 10));
    startNewRound();
  }, [username]);

  function startNewRound() {
    // pick random planet that has the ball
    const randomPos = Math.floor(Math.random() * 3);
    setBallPosition(randomPos);

    setAttemptsUsed(0);
    setPlanetWrong([false, false, false]);
    setMessage('Pick a planet to find the ball...');
    setGameOver(false);
    setFoundBall(false);
  }

  async function handleGuess(planetIndex) {
    if (gameOver) return;

    setAttemptsUsed(prev => prev + 1);

    const success = (planetIndex === ballPosition);
    if (success) {
      setFoundBall(true);
      setGameOver(true);
      setMessage('Correct! You found the ball!');
      correctSFXRef.current?.play();

      // increment local wins
      const newWins = wins + 1;
      setWins(newWins);
      localStorage.setItem(`${username}_shellGameWins`, newWins);

      await saveResultToDB('win');
    } else {
      // Wrong guess
      if (attemptsUsed + 1 === 2) {
        // out of attempts => lose
        setGameOver(true);
        setMessage(`Wrong! 2 tries used. The ball was under planet #${ballPosition + 1}`);
        wrongSFXRef.current?.play();

        // increment local losses
        const newLosses = losses + 1;
        setLosses(newLosses);
        localStorage.setItem(`${username}_shellGameLosses`, newLosses);

        await saveResultToDB('lose');
      } else {
        // 1st wrong guess
        setMessage('Wrong guess, try again!');
        wrongSFXRef.current?.play();

        // mark that planet as "wrong" -> show red circle with "Try another one!"
        setPlanetWrong(prev => {
          const arr = [...prev];
          arr[planetIndex] = true;
          return arr;
        });
      }
    }
  }

  async function saveResultToDB(outcome) {
    try {
      if (!username) return; // skip if no username
      await axios.post('/api/results', { username, outcome });
    } catch (err) {
      console.error('Failed to save result to DB:', err);
    }
  }

  return (
    <div className="shell-game-page">
      <h2>Hello, {username || 'Guest'}!</h2>
      <p>Wins: {wins} | Losses: {losses}</p>

      {/* Container with background (coins cloth) for the canvas */}
      <div className="planets-container">
        <ShellGameCanvas
          ballPosition={ballPosition}
          planetWrong={planetWrong}       // pass array of bools
          foundBall={foundBall}
          gameOver={gameOver}
          onPlanetClick={handleGuess}
        />
      </div>

      <p style={{ fontWeight: 'bold', marginTop: '20px' }}>{message}</p>
      {gameOver && (
        <button onClick={startNewRound}>Play Again</button>
      )}

      <audio ref={correctSFXRef} src="/correct.mp3" />
      <audio ref={wrongSFXRef} src="/wrong.mp3" />

      <Leaderboard />
    </div>
  );
}

export default ShellGame;