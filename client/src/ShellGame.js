// ShellGame.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShellGame.css'; 
import ShellGameCanvas from './ShellGameCanvas.js';
import Leaderboard from './Leaderboard.js';

function ShellGame({ username, sessionState, isCurrentPlayer }) {
  const [planetWrong, setPlanetWrong] = useState([false, false, false]);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [foundBall, setFoundBall] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const congratsTimerRef = useRef(null);

  const correctSFXRef = useRef(null);
  const wrongSFXRef = useRef(null);

  // Reset state when session changes
  useEffect(() => {
    if (sessionState) {
      setPlanetWrong([false, false, false]);
      setFoundBall(false);
      setGameOver(false);
      setWinner(null);
      setMessage(isCurrentPlayer ? 
        `${username}, it's your turn to vote! Pick a planet to find the ball...` : 
        `Waiting for ${sessionState.players[sessionState.currentPlayerIndex]} to play...`);
    }
  }, [sessionState, isCurrentPlayer, username]);

  // Handle congratulations message timer
  useEffect(() => {
    if (winner) {
      setShowCongrats(true);
      // Clear any existing timer
      if (congratsTimerRef.current) {
        clearTimeout(congratsTimerRef.current);
      }
      // Set new timer for 2 minutes
      congratsTimerRef.current = setTimeout(() => {
        setShowCongrats(false);
      }, 120000); // 2 minutes in milliseconds
    }

    return () => {
      if (congratsTimerRef.current) {
        clearTimeout(congratsTimerRef.current);
      }
    };
  }, [winner]);

  async function handleGuess(planetIndex) {
    if (!isCurrentPlayer || gameOver) return;

    try {
      const { data } = await axios.post('/api/guess', { username, planetIndex });
      
      if (data.correct) {
        setFoundBall(true);
        setGameOver(true);
        setWinner(username);
        setMessage('Correct! You found the ball!');
        correctSFXRef.current?.play();
      } else {
        if (data.gameOver) {
          setGameOver(true);
          setWinner(data.winner);
          setMessage(data.winner === username ? 
            'You win! Others failed to find the ball!' : 
            `Game Over! ${data.winner} wins!`);
          wrongSFXRef.current?.play();
        } else {
          setMessage(`Wrong guess! It's ${sessionState.players[sessionState.currentPlayerIndex + 1]}'s turn`);
          wrongSFXRef.current?.play();
          setPlanetWrong(prev => {
            const arr = [...prev];
            arr[planetIndex] = true;
            return arr;
          });
        }
      }
    } catch (err) {
      console.error('Error making guess:', err);
      setMessage('Error processing your guess');
    }
  }

  return (
    <div className="shell-game-container">
      <div className="planets-container">
        <ShellGameCanvas
          ballPosition={gameOver ? sessionState.ballPosition : null}
          planetWrong={planetWrong}
          foundBall={foundBall}
          gameOver={gameOver}
          onPlanetClick={handleGuess}
        />
      </div>

      <p style={{ fontWeight: 'bold', marginTop: '20px' }}>
        {message}
      </p>

      {showCongrats && winner && (
        <div className="winner-message">
          <h3>🎉 Congratulations {winner}! 🎉</h3>
          <p>You won this session!</p>
        </div>
      )}

      <div className="session-info">
        <h3>Current Session</h3>
        <div className="players-list">
          {sessionState.players.map((player, i) => (
            <div 
              key={player} 
              className={`player ${player === username ? 'you' : ''} ${player === sessionState.players[sessionState.currentPlayerIndex] ? 'current-turn' : ''}`}
            >
              {`${i + 1}. ${player}`}
              {player === sessionState.players[sessionState.currentPlayerIndex] && ' (current turn)'}
              {player === username && ' (you)'}
            </div>
          ))}
        </div>
      </div>

      <audio ref={correctSFXRef} src="/correct.mp3" />
      <audio ref={wrongSFXRef} src="/wrong.mp3" />

      <Leaderboard />
    </div>
  );
}

export default ShellGame;