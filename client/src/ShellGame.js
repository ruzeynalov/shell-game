import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css';

function ShellGame({ username }) {
  const [ballPosition, setBallPosition] = useState(null);  // 0,1,2
  const [attemptsUsed, setAttemptsUsed] = useState(0);     // how many guesses so far
  const [disabledCups, setDisabledCups] = useState([false, false, false]); // track which cups can be clicked
  const [message, setMessage] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foundBall, setFoundBall] = useState(false);       // did the user guess correctly?

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
    // If the game is already over or the cup is disabled, do nothing
    if (gameOver || disabledCups[cupIndex]) return;

    // Mark the cup as disabled
    setDisabledCups(prev => {
      const updated = [...prev];
      updated[cupIndex] = true;
      return updated;
    });

    // Increase attempt count
    setAttemptsUsed(prev => prev + 1);

    // Check if guess is correct
    const success = (cupIndex === ballPosition);
    if (success) {
      // User wins
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
      // If this was the second attempt, user loses
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
        // Still has another attempt
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

      <div className="cups-container">
        {[0, 1, 2].map((cupIndex) => {
          // Grey out if disabled
          const style = {
            opacity: disabledCups[cupIndex] ? 0.5 : 1,
            cursor: disabledCups[cupIndex] ? 'not-allowed' : 'pointer'
          };

          return (
            <div
              key={cupIndex}
              className="cup"
              style={style}
              onClick={() => handleGuess(cupIndex)}
            >
              {/* Reveal ball if user found it OR the game is over (all attempts used) 
                  and the ball is under this cup */}
              {(gameOver && cupIndex === ballPosition) || (foundBall && cupIndex === ballPosition) ? (
                <div className="ball" />
              ) : (
                <div className="hidden-ball" />
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontWeight: 'bold', marginTop: '20px' }}>{message}</p>

      {/* Only show "Play Again" if the game is over */}
      {gameOver && (
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
