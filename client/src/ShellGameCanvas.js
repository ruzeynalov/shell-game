// ShellGameCanvas.js
import React, { useRef, useEffect } from 'react';

/**
 * Props:
 *  - ballPosition: which cup (0..2) actually hides the ball
 *  - disabledCups: array of bools [cup0Disabled, cup1Disabled, cup2Disabled]
 *  - gameOver: bool
 *  - foundBall: bool (true if user guessed it)
 *  - onCupClick(index) => void
 */
function ShellGameCanvas({
  ballPosition,
  disabledCups,
  gameOver,
  foundBall,
  onCupClick
}) {
  const canvasRef = useRef(null);

  // Canvas dimensions
  const width = 600;
  const height = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let angle = 0;
    let animationFrameId;

    // Preload or define a background image if you want
    const bgImage = new Image();
    bgImage.src = '/background.jpg'; // Place "background.jpg" in public/ folder

    function drawScene() {
      ctx.clearRect(0, 0, width, height);

      // 1) Draw background if loaded
      if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#a5d8ff';
        ctx.fillRect(0, 0, width, height);
      }

      // 2) Draw the cups
      for (let i = 0; i < 3; i++) {
        // X positions: e.g. 100, 300, 500
        // Y is around 180
        const x = 100 + i * 200;
        const y = 180;

        const isDisabled = disabledCups[i];
        drawCup3D(ctx, x, y, angle + i, isDisabled);
      }

      // 3) If foundBall OR gameOver, reveal the ball (draw ball at ballPosition)
      if ((foundBall || gameOver) && ballPosition !== null) {
        const xBall = 100 + ballPosition * 200;
        const yBall = 180;
        drawBall3D(ctx, xBall, yBall, angle);
      }
    }

    function animate() {
      angle += 0.02; // spin speed
      drawScene();
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ballPosition, disabledCups, gameOver, foundBall]);

  function drawCup3D(ctx, centerX, centerY, spinAngle, disabled) {
    ctx.save();

    // Rotate around the cup center to simulate 3D spin
    ctx.translate(centerX, centerY);
    ctx.rotate(spinAngle);
    ctx.translate(-centerX, -centerY);

    // Shadow under cup
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 30, 30, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Cup color
    const grad = ctx.createLinearGradient(centerX, centerY - 60, centerX, centerY);
    grad.addColorStop(0, disabled ? '#ff9999' : '#ff6666'); // top
    grad.addColorStop(1, 'red'); // bottom

    ctx.fillStyle = grad;

    // Body of cup (like a trapezoid)
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY - 60);
    ctx.lineTo(centerX - 30, centerY);
    ctx.lineTo(centerX + 30, centerY);
    ctx.lineTo(centerX + 20, centerY - 60);
    ctx.closePath();
    ctx.fill();

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 60, 20, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Bottom ellipse (rim)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 30, 10, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  function drawBall3D(ctx, centerX, centerY, spinAngle) {
    ctx.save();

    // We'll position the ball just below the cup
    const ballY = centerY + 5;

    // Slight rotation for style
    ctx.translate(centerX, ballY);
    ctx.rotate(-spinAngle * 0.7);
    ctx.translate(-centerX, -ballY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX, ballY + 14, 14, 4, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Ball gradient
    const grad = ctx.createRadialGradient(
      centerX - 5, ballY - 5, 4,
      centerX, ballY, 14
    );
    grad.addColorStop(0, '#ffffaa');
    grad.addColorStop(1, 'yellow');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, ballY, 14, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  // On click, figure out which cup user might have selected
  function handleCanvasClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // We know cups are at (100,180), (300,180), (500,180)
    // We'll approximate a bounding circle for each
    for (let i = 0; i < 3; i++) {
      const cx = 100 + i * 200;
      const cy = 180;
      const dx = clickX - cx;
      const dy = clickY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) {
        onCupClick(i);
        break;
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      style={{ border: '1px solid #ccc', display: 'block', margin: '0 auto' }}
    />
  );
}

export default ShellGameCanvas;
