// ShellGameCanvas.js
import React, { useEffect, useRef } from 'react';

/**
 * Props:
 *  - ballPosition: number (0..2) or null
 *  - planetWrong: bool[] => which planet was guessed incorrectly
 *  - foundBall: bool => user guessed correctly
 *  - gameOver: bool => user is out of attempts or found the ball
 *  - onPlanetClick(index): function => user picks a planet
 */
function ShellGameCanvas({
  ballPosition,
  planetWrong,
  foundBall,
  gameOver,
  onPlanetClick
}) {
  const canvasRef = useRef(null);
  const width = 800;
  const height = 450;

  // The x-positions for the 3 planets
  const planetPositions = [200, 400, 600];

  let time = 0;
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function renderFrame() {
      time += 0.04;
      ctx.clearRect(0, 0, width, height);

      // 3 planets
      for (let i = 0; i < 3; i++) {
        if (planetWrong[i]) {
          // If user guessed planet i incorrectly => red circle with text
          drawWrongPlanet(ctx, i);
        } else {
          // normal 3D sphere
          const scale = 1 + 0.2 * Math.sin(time + i * 2);
          drawPlanet3D(ctx, i, scale);
        }
      }

      // If user found or game over => show the ball
      if ((foundBall || gameOver) && ballPosition != null) {
        drawBall(ctx, ballPosition);
      }

      requestAnimationFrame(renderFrame);
    }
    renderFrame();
  }, [planetWrong, ballPosition, foundBall, gameOver]);

  function drawPlanet3D(ctx, i, scale) {
    const centerX = planetPositions[i];
    const centerY = 225;
    const radius = 40;

    // radial gradient for a 3D shading effect
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // gradient: highlight top-left => darker bottom-right
    const grad = ctx.createRadialGradient(-10, -10, 10, 0, 0, radius);
    grad.addColorStop(0, '#ddddff');  
    grad.addColorStop(1, i === 0 ? '#8cb3ff'  
                     : i === 1 ? '#ffeeaa' 
                     : '#b3ffb3');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }

  function drawWrongPlanet(ctx, i) {
    // red circle with "Try another one!" text
    const centerX = planetPositions[i];
    const centerY = 225;
    const radius = 40;

    ctx.save();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2*Math.PI);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Try another', centerX, centerY - 4);
    ctx.fillText('one!', centerX, centerY + 12);
    ctx.restore();
  }

  function drawBall(ctx, i) {
    const centerX = planetPositions[i];
    const centerY = 225 + 45;

    // shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY+14, 14, 4, 0, 0, 2*Math.PI);
    ctx.fill();

    const grad = ctx.createRadialGradient(centerX - 5, centerY - 5, 2, centerX, centerY, 14);
    grad.addColorStop(0, '#ffffaa');
    grad.addColorStop(1, 'yellow');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2*Math.PI);
    ctx.fill();

    ctx.restore();
  }

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < 3; i++) {
      const dx = clickX - planetPositions[i];
      const dy = clickY - 225;
      if (Math.sqrt(dx*dx + dy*dy) < 40) {
        onPlanetClick(i);
        break;
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ background:'transparent', display:'block', margin:'0 auto' }}
      onClick={handleClick}
    />
  );
}

export default ShellGameCanvas;