// ShellGameCanvas.js

import React, { useEffect, useRef, useState } from 'react';

/**
 * Props:
 *  - ballPosition: 0..2
 *  - disabledCups: bool[]
 *  - gameOver: bool
 *  - foundBall: bool
 *  - roundKey: number => triggers multi-step shuffle each time it changes
 *  - onCupClick(index): user guesses a cup
 *  - onShufflesDone(): notify parent that shuffle is complete
 */
function ShellGameCanvas({
  ballPosition,
  disabledCups,
  gameOver,
  foundBall,
  roundKey,
  onCupClick,
  onShufflesDone
}) {
  const canvasRef = useRef(null);

  const width = 600;
  const height = 300;

  // We'll store each cup’s X position in state
  // e.g. cups = [ { currentX:100 }, { currentX:300 }, { currentX:500 }]
  const [cups, setCups] = useState([
    { currentX: 100 },
    { currentX: 300 },
    { currentX: 500 }
  ]);

  // number of shuffle steps we want
  const totalSteps = 5;
  const [shufflesLeft, setShufflesLeft] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  // for a simple approach, each step rotates [100,300,500] => [300,500,100] => ...
  const XSlots = [100, 300, 500];

  // When roundKey changes, start a new multi-shuffle
  useEffect(() => {
    startMultiShuffle();
  }, [roundKey]);

  function startMultiShuffle() {
    console.log('Canvas: Start a new shuffle sequence of 5 steps');
    setShufflesLeft(totalSteps);
    setShuffling(true);
    doShuffleStep();
  }

  function doShuffleStep() {
    if (shufflesLeft <= 0) {
      finishShuffling();
      return;
    }
    // rotate the XSlots
    const first = XSlots.shift();
    XSlots.push(first);

    // assign these to cups' targetX
    setCups(prev => {
      return prev.map((c, i) => ({
        ...c,
        targetX: XSlots[i]
      }));
    });
  }

  function finishShuffling() {
    setShuffling(false);
    console.log('Canvas: all shuffles done, notify parent');
    if (onShufflesDone) {
      onShufflesDone();
    }
  }

  // Animate cups horizontally from currentX to targetX
  useEffect(() => {
    let rafId;
    function animate() {
      setCups(prev => {
        let allArrived = true;
        const newCups = prev.map(cup => {
          if (cup.targetX == null) return cup; // no shuffle target
          const dx = cup.targetX - cup.currentX;
          if (Math.abs(dx) < 0.3) {
            return { ...cup, currentX: cup.targetX };
          } else {
            allArrived = false;
            return { ...cup, currentX: cup.currentX + dx * 0.1 }; // move 10% each frame
          }
        });
        // if all arrived and we still have steps left, do the next step
        if (allArrived && shuffling && shufflesLeft > 0) {
          setShufflesLeft(s => s - 1);
          setTimeout(doShuffleStep, 500); // short pause before next step
        } else if (allArrived && shufflesLeft <= 0 && shuffling) {
          finishShuffling();
        }
        return newCups;
      });
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [shuffling, shufflesLeft]);

  // draw cups/ball in a separate effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const bgImage = new Image();
    bgImage.src = '/background.jpg';

    let rafId;
    function renderFrame() {
      ctx.clearRect(0, 0, width, height);

      // draw background
      if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#a5d8ff';
        ctx.fillRect(0, 0, width, height);
      }

      // draw cups
      cups.forEach((cup, i) => {
        const centerX = cup.currentX;
        const centerY = 180;
        const disabled = disabledCups[i];
        drawCup3D(ctx, centerX, centerY, disabled);
      });

      // draw ball if found or gameOver
      if ((foundBall || gameOver) && ballPosition != null) {
        const bx = cups[ballPosition].currentX;
        drawBall3D(ctx, bx, 180);
      }

      rafId = requestAnimationFrame(renderFrame);
    }
    renderFrame();

    return () => cancelAnimationFrame(rafId);
  }, [cups, ballPosition, disabledCups, foundBall, gameOver]);

  function handleCanvasClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // approximate bounding circle
    for (let i = 0; i < 3; i++) {
      const cx = cups[i].currentX;
      const cy = 180;
      const dx = clickX - cx;
      const dy = clickY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 40) {
        onCupClick(i);
        break;
      }
    }
  }

  function drawCup3D(ctx, centerX, centerY, disabled) {
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 30, 30, 8, 0, 0, 2*Math.PI);
    ctx.fill();

    // color
    const grad = ctx.createLinearGradient(centerX, centerY - 60, centerX, centerY);
    if (disabled) {
      grad.addColorStop(0, '#ff9999');
      grad.addColorStop(1, 'red');
    } else {
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(1, 'red');
    }
    ctx.fillStyle = grad;

    // trapezoid
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY - 60);
    ctx.lineTo(centerX - 30, centerY);
    ctx.lineTo(centerX + 30, centerY);
    ctx.lineTo(centerX + 20, centerY - 60);
    ctx.closePath();
    ctx.fill();

    // top ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 60, 20, 8, 0, 0, 2*Math.PI);
    ctx.fill();

    // bottom ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 30, 10, 0, 0, 2*Math.PI);
    ctx.fill();

    ctx.restore();
  }

  function drawBall3D(ctx, centerX, centerY) {
    ctx.save();
    
    const ballY = centerY + 5;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX, ballY + 14, 14, 4, 0, 0, 2*Math.PI);
    ctx.fill();

    const grad = ctx.createRadialGradient(
      centerX - 5, ballY - 5, 4,
      centerX, ballY, 14
    );
    grad.addColorStop(0, '#ffffaa');
    grad.addColorStop(1, 'yellow');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(centerX, ballY, 14, 0, 2*Math.PI);
    ctx.fill();

    ctx.restore();
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      style={{ border: '1px solid #ccc', margin: '0 auto', display: 'block' }}
    />
  );
}

export default ShellGameCanvas;