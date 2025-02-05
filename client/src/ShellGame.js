// ShellGame.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css';
import ShellGameCanvas from './ShellGameCanvas.js';
import Leaderboard from './Leaderboard.js';

function ShellGame({ username }) {
  const [ballPosition, setBallPosition] = useState(null);  // 0..2
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [disabledCups, setDisabledCups] = useState([true, true, true]); // initially disabled
  const [message, setMessage] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foundBall, setFoundBall] = useState(false);

  const [roundKey, setRoundKey] = useState(0);    // triggers multiple shuffles
  const [isShuffling, setIsShuffling] = useState(true); // disable cups until shuffle done

  const correctSFXRef = useRef(null);
  const wrongSFXRef = useRef(null);

  useEffect(() => {
    // load stats from local storage
    const localWins = localStorage.getItem(`${username}_shellGameWins`);
    const localLosses = localStorage.getItem(`${username}_shellGameLosses`);
    if (localWins) setWins(parseInt(localWins, 10));
    if (localLosses) setLosses(parseInt(localLosses, 10));
    startNewRound();
    // eslint-disable-next-line
  }, [username]);

  function startNewRound() {
    // pick random ball
    const randomPos = Math.floor(Math.random() * 3);
    setBallPosition(randomPos);

    // reset
    setAttemptsUsed(0);
    setDisabledCups([true, true, true]); // disable until shuffle is done
    setMessage('Shuffling...');
    setGameOver(false);
    setFoundBall(false);
    setIsShuffling(true);

    // triggers the canvas to do multi-shuffle
    setRoundKey(k => k + 1);
  }

  // Called by canvas after all shuffles complete
  function onShufflesDone() {
    setIsShuffling(false);
    setDisabledCups([false, false, false]);
    setMessage('Guess which cup has the ball!');
  }

  async function handleGuess(cupIndex) {
    // if still shuffling or game is over => do nothing
    if (isShuffling || gameOver || disabledCups[cupIndex]) return;

    // disable that cup
    setDisabledCups(prev => {
      const arr = [...prev];
      arr[cupIndex] = true;
      return arr;
    });

    setAttemptsUsed(prev => prev + 1);
    const success = (cupIndex === ballPosition);

    if (success) {
      setFoundBall(true);
      setGameOver(true);
      setMessage('Correct! You found the ball!');
      correctSFXRef.current?.play();

      const newWins = wins + 1;
      setWins(newWins);
      localStorage.setItem(`${username}_shellGameWins`, newWins);

      // Save "win" to DB (Redis)
      await saveResultToDB('win');
    } else {
      if (attemptsUsed + 1 === 2) {
        setGameOver(true);
        setMessage(`Wrong! 2 tries used, you lose! The ball was under cup ${ballPosition+1}`);
        wrongSFXRef.current?.play();

        const newLosses = losses + 1;
        setLosses(newLosses);
        localStorage.setItem(`${username}_shellGameLosses`, newLosses);

        // Save "lose" to DB
        await saveResultToDB('lose');
      } else {
        setMessage('Wrong guess, try again!');
        wrongSFXRef.current?.play();
      }
    }
  }

  async function saveResultToDB(outcome) {
    try {
      // Ensure username is not empty
      if (!username) {
        console.warn('No username, skipping DB save');
        return;
      }
      const resp = await axios.post('/api/results', {
        username,
        outcome
      });
      console.log('Result saved to DB (Redis):', resp.data);
    } catch (err) {
      console.error('Failed to save result to DB:', err);
    }
  }

  return (
    <div className="shell-game-container">
      <h2>Hello, {username || 'Anon'}!</h2>
      <p>Wins: {wins} | Losses: {losses}</p>

      <ShellGameCanvas
        ballPosition={ballPosition}
        disabledCups={disabledCups}
        gameOver={gameOver}
        foundBall={foundBall}
        roundKey={roundKey}     // triggers multi-shuffle
        onCupClick={handleGuess}
        onShufflesDone={onShufflesDone}  // callback from canvas
      />

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