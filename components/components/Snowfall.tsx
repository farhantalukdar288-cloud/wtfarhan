import React, { useEffect, useRef } from 'react';

interface Flake {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftX: number;
  phase: number;
  alpha: number;
  glow: boolean;
}

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    const flakeCount = isMobile ? 48 : 85;

    const createFlake = (randomY = true): Flake => {
      const tier = Math.random();
      const r = tier < 0.65 ? 1.1 + Math.random() * 1.3 : 2.3 + Math.random() * 1.9;
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -12 - Math.random() * 40,
        r,
        speedY: 0.45 + r * 0.28 + Math.random() * 0.35,
        driftX: (Math.random() - 0.5) * 0.55,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.52,
        glow: tier >= 0.72,
      };
    };

    let flakes: Flake[] = Array.from({ length: flakeCount }, () => createFlake(true));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const targetCount = width < 768 ? 48 : 85;
      if (flakes.length !== targetCount) {
        flakes = Array.from({ length: targetCount }, () => createFlake(true));
      }
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.phase += 0.014;
        f.y += f.speedY;
        f.x += f.driftX + Math.sin(f.phase) * 0.32;

        if (f.y > height + 16) {
          flakes[i] = createFlake(false);
          continue;
        }
        if (f.x > width + 16) f.x = -12;
        if (f.x < -16) f.x = width + 12;

        ctx.save();
        ctx.globalAlpha = f.alpha;

        if (f.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(245, 240, 225, 0.75)';
        }

        ctx.fillStyle = f.glow ? '#fffdf7' : '#e8ece8';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    />
  );
}
