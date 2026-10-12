import React, { useEffect, useRef } from 'react';
import { TheaterId } from '../types/game';

interface WaterBackgroundProps {
  theater: TheaterId;
}

export const WaterBackground: React.FC<WaterBackgroundProps> = ({ theater }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle system for ambient water effects (foam, bubbles, snow, rain, cyber nodes)
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      fade: number;
    }

    const particles: Particle[] = [];
    const particleCount = theater === 'atlantic' ? 80 : theater === 'arctic' ? 60 : theater === 'cyber' ? 45 : 35;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: theater === 'atlantic' ? -1.5 : (Math.random() - 0.5) * 0.4,
        vy: theater === 'atlantic' ? 7 + Math.random() * 5 : (Math.random() - 0.5) * 0.3 - 0.2,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        fade: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    let t = 0;
    let lightningTimer = 0;
    let lightningFlash = 0;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      // --- 1. BASE OCEAN GRADIENT ---
      let bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (theater === 'pacific') {
        bgGrad.addColorStop(0, '#020c1b');
        bgGrad.addColorStop(0.5, '#082f49');
        bgGrad.addColorStop(1, '#020c1b');
      } else if (theater === 'atlantic') {
        bgGrad.addColorStop(0, '#020c1b');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#020c1b');
      } else if (theater === 'arctic') {
        bgGrad.addColorStop(0, '#020c1b');
        bgGrad.addColorStop(0.5, '#0c4a6e');
        bgGrad.addColorStop(1, '#020c1b');
      } else {
        // Cyber
        bgGrad.addColorStop(0, '#020c1b');
        bgGrad.addColorStop(0.5, '#042f2e');
        bgGrad.addColorStop(1, '#020c1b');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- 2. THEATER-SPECIFIC ATMOSPHERE ---

      // A) AURORA IN ARCTIC
      if (theater === 'arctic') {
        ctx.save();
        for (let a = 0; a < 3; a++) {
          ctx.beginPath();
          ctx.moveTo(0, height * 0.2);
          for (let x = 0; x <= width; x += 40) {
            const waveY = height * 0.25 + Math.sin(x * 0.003 + t + a * 1.5) * 60 + Math.cos(x * 0.007 - t * 0.5) * 30;
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(width, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();
          const auroraGrad = ctx.createLinearGradient(0, 0, width, height * 0.5);
          auroraGrad.addColorStop(0, `rgba(16, 185, 129, ${0.12 - a * 0.03})`);
          auroraGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.15 - a * 0.03})`);
          auroraGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = auroraGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // B) CYBER TACTICAL GRID
      if (theater === 'cyber') {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Concentric radar sweep circle
        const cx = width / 2;
        const cy = height / 2;
        const rMax = Math.hypot(width, height) / 2;
        const currentR = (t * 40) % rMax;
        ctx.beginPath();
        ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 0.35 - (currentR / rMax) * 0.35)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // C) CAUSTICS & WATER WAVE FLOW
      ctx.save();
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseOffset = (height / waveCount) * w + (height / waveCount) * 0.5;
        ctx.moveTo(0, baseOffset);

        for (let x = 0; x <= width; x += 30) {
          const waveAmp = theater === 'atlantic' ? 16 : 8;
          const y = baseOffset +
            Math.sin(x * 0.006 + t * (1.2 + w * 0.3) + w) * waveAmp +
            Math.cos(x * 0.012 - t * 0.8 + w * 2) * (waveAmp * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const opacity = theater === 'atlantic' ? 0.08 : theater === 'cyber' ? 0.05 : 0.12;
        ctx.fillStyle = theater === 'cyber'
          ? `rgba(56, 189, 248, ${opacity})`
          : theater === 'arctic'
          ? `rgba(224, 242, 254, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
      ctx.restore();

      // D) ATLANTIC LIGHTNING
      if (theater === 'atlantic') {
        lightningTimer++;
        if (lightningTimer > 180 && Math.random() < 0.03) {
          lightningFlash = 1.0;
          lightningTimer = 0;
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.3})`;
          ctx.fillRect(0, 0, width, height);
          lightningFlash -= 0.08;
        }
      }

      // E) PARTICLES (RAIN / SNOW / FOAM / DATA)
      ctx.save();
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.fade;
        if (p.alpha <= 0.1 || p.alpha >= 0.8) {
          p.fade = -p.fade;
        }

        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        } else if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        if (theater === 'atlantic') {
          // Rain streak
          ctx.strokeStyle = `rgba(203, 213, 225, ${p.alpha * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + 12);
          ctx.stroke();
        } else if (theater === 'cyber') {
          // Digital glowing square
          ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else {
          // Bubbles / foam circles
          ctx.fillStyle = theater === 'arctic'
            ? `rgba(240, 249, 255, ${p.alpha * 0.6})`
            : `rgba(255, 255, 255, ${p.alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theater]);

  return (
    <div id="water-background-container" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle vignette border to frame tactical board */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
    </div>
  );
};
