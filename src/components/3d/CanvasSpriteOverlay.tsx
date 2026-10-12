import React, { useEffect, useRef } from 'react';
import { Coordinate } from '../../types/game';

export interface FloatingSpriteText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface CanvasSpriteOverlayProps {
  hoveredScreenPos: { x: number; y: number } | null;
  hoveredCoord: Coordinate | null;
  floatingTexts: FloatingSpriteText[];
  isLocked?: boolean;
}

export const CanvasSpriteOverlay: React.FC<CanvasSpriteOverlayProps> = ({
  hoveredScreenPos,
  hoveredCoord,
  floatingTexts,
  isLocked = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      localAngle += 0.03;
      angleRef.current = localAngle;

      // 1. RENDER TACTICAL 2D TARGET LOCK RETICLE
      if (hoveredScreenPos && hoveredCoord) {
        const { x, y } = hoveredScreenPos;
        const boxSize = isLocked ? 38 : 34;

        ctx.save();
        ctx.translate(x, y);

        // Outer rotating dashed brackets
        ctx.strokeStyle = isLocked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(6, 182, 212, 0.85)';
        ctx.lineWidth = 2.5;

        // 4 Corner Brackets
        const len = 10;
        ctx.beginPath();
        // Top Left
        ctx.moveTo(-boxSize, -boxSize + len);
        ctx.lineTo(-boxSize, -boxSize);
        ctx.lineTo(-boxSize + len, -boxSize);
        // Top Right
        ctx.moveTo(boxSize - len, -boxSize);
        ctx.lineTo(boxSize, -boxSize);
        ctx.lineTo(boxSize, -boxSize + len);
        // Bottom Right
        ctx.moveTo(boxSize, boxSize - len);
        ctx.lineTo(boxSize, boxSize);
        ctx.lineTo(boxSize - len, boxSize);
        // Bottom Left
        ctx.moveTo(-boxSize + len, boxSize);
        ctx.lineTo(-boxSize, boxSize);
        ctx.lineTo(-boxSize, boxSize - len);
        ctx.stroke();

        // Center crosshair tick
        ctx.strokeStyle = isLocked ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();

        // Target Coordinate Tag Badge
        const coordText = `${String.fromCharCode(65 + hoveredCoord.r)}-${hoveredCoord.c + 1}`;
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = isLocked ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.85)';
        const textWidth = ctx.measureText(coordText).width;

        ctx.fillStyle = 'rgba(2, 12, 27, 0.85)';
        ctx.fillRect(-textWidth / 2 - 6, -boxSize - 22, textWidth + 12, 18);
        ctx.strokeStyle = isLocked ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 1;
        ctx.strokeRect(-textWidth / 2 - 6, -boxSize - 22, textWidth + 12, 18);

        ctx.fillStyle = isLocked ? '#fca5a5' : '#67e8f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(coordText, 0, -boxSize - 13);

        ctx.restore();
      }

      // 2. RENDER FLOATING SPRITE TEXTS & DAMAGE NUMBERS
      floatingTexts.forEach(item => {
        ctx.save();
        ctx.globalAlpha = item.opacity;
        ctx.font = `900 ${item.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer Dark Shadow / Stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 4;
        ctx.strokeText(item.text, item.x, item.y);

        // Vibrant Inner Text Color
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);

        ctx.restore();
      });

      // 3. RENDER TACTICAL RADAR COMPASS SPRITE (TOP RIGHT)
      const compassX = canvas.width - 55;
      const compassY = 55;
      const radius = 32;

      ctx.save();
      ctx.translate(compassX, compassY);

      // Radar Glass Disc
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 12, 27, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Radar Line Sweep
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * Math.cos(localAngle), radius * Math.sin(localAngle));
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cardinal N Marker
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -radius + 8);

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hoveredScreenPos, hoveredCoord, floatingTexts, isLocked]);

  // Sync canvas dimensions to parent container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20 w-full h-full"
    />
  );
};
