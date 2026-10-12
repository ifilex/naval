import React, { useEffect, useRef } from 'react';
import { AIDifficulty, GridDimension, TheaterId } from '../../types/game';
import { TranslationDict } from '../../i18n/translations';
import { sound } from '../../services/soundEngine';
import { Play, Award, BookOpen, Sparkles, Compass, Shield, Cpu } from 'lucide-react';
import { drawPixelShip, drawPixelRect } from '../../services/pixelSprites';

interface PixelMenuProps {
  onStartGame: () => void;
  onOpenCampaign: () => void;
  onOpenHowToPlay: () => void;
  theater: TheaterId;
  onSelectTheater: (t: TheaterId) => void;
  gridSize: GridDimension;
  onSelectGridSize: (s: GridDimension) => void;
  difficulty: AIDifficulty;
  onSelectDifficulty: (d: AIDifficulty) => void;
  t: TranslationDict;
}

export const PixelMenu: React.FC<PixelMenuProps> = ({
  onStartGame,
  onOpenCampaign,
  onOpenHowToPlay,
  theater,
  onSelectTheater,
  gridSize,
  onSelectGridSize,
  difficulty,
  onSelectDifficulty,
  t,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animated 16-bit Pixel Panorama Canvas (Sunny sky, clouds, animated waves, sailing pixel war fleet)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. SKY GRADIENT (Bright Tropical 16-bit Blue)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, w, h);

      // Sky horizon bands
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, h * 0.25, w, h * 0.15);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, h * 0.4, w, h * 0.1);

      // 2. PIXEL SUN
      const sunX = w * 0.85;
      const sunY = h * 0.2;
      drawPixelRect(ctx, sunX - 18, sunY - 18, 36, 36, '#facc15');
      drawPixelRect(ctx, sunX - 12, sunY - 12, 24, 24, '#fef08a');

      // 3. FLOATING PIXEL CLOUDS
      const clouds = [
        { x: ((tick * 0.4 + 50) % (w + 120)) - 60, y: h * 0.15, s: 1.2 },
        { x: ((tick * 0.25 + 240) % (w + 120)) - 60, y: h * 0.28, s: 0.9 },
        { x: ((tick * 0.35 + 480) % (w + 120)) - 60, y: h * 0.1, s: 1.5 },
      ];

      clouds.forEach(c => {
        ctx.fillStyle = '#ffffff';
        drawPixelRect(ctx, c.x, c.y, 48 * c.s, 14 * c.s, '#ffffff');
        drawPixelRect(ctx, c.x + 8 * c.s, c.y - 8 * c.s, 32 * c.s, 10 * c.s, '#ffffff');
        drawPixelRect(ctx, c.x + 14 * c.s, c.y - 14 * c.s, 18 * c.s, 8 * c.s, '#ffffff');
      });

      // 4. DISTANT ISLAND WITH PALM TREES
      const islandX = w * 0.15;
      const islandY = h * 0.48;
      // Sand
      drawPixelRect(ctx, islandX, islandY + 6, 80, 16, '#fde047');
      // Green
      drawPixelRect(ctx, islandX + 12, islandY - 2, 56, 12, '#16a34a');
      // Palm Trunk & Leaves
      drawPixelRect(ctx, islandX + 36, islandY - 16, 4, 16, '#78350f');
      drawPixelRect(ctx, islandX + 24, islandY - 22, 28, 8, '#22c55e');

      // 5. ANIMATED PIXEL OCEAN WAVES
      const waterTop = h * 0.52;
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, waterTop, w, h - waterTop);

      // Wave ripple strips
      const waveLayers = [
        { y: waterTop + 4, color: '#38bdf8', speed: 0.8, h: 4 },
        { y: waterTop + 24, color: '#0284c7', speed: 1.2, h: 6 },
        { y: waterTop + 54, color: '#0369a1', speed: 1.6, h: 8 },
        { y: waterTop + 90, color: '#0c4a6e', speed: 2.0, h: 10 },
      ];

      waveLayers.forEach(l => {
        ctx.fillStyle = l.color;
        for (let x = 0; x < w; x += 16) {
          const waveY = l.y + Math.sin((x + tick * l.speed) * 0.08) * 3;
          ctx.fillRect(x, Math.floor(waveY), 12, l.h);
        }
      });

      // 6. SAILING PIXEL WARSHIPS
      const ship1X = ((tick * 0.8 + 80) % (w + 140)) - 70;
      const ship1Y = waterTop + 30 + Math.sin(tick * 0.1) * 3;
      drawPixelShip(ctx, 'battleship', ship1X, ship1Y, 3, 'horizontal', 24, false, tick);

      const ship2X = (((w - tick * 0.5) % (w + 160)) + w + 160) % (w + 160) - 80;
      const ship2Y = waterTop + 65 + Math.sin(tick * 0.12 + 2) * 3;
      drawPixelShip(ctx, 'carrier', ship2X, ship2Y, 4, 'horizontal', 26, false, tick);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Resize canvas to parent container
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
    const observer = new ResizeObserver(handleResize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col gap-2 sm:gap-3.5 items-center px-1 sm:px-4 py-1 font-silkscreen">
      {/* 1. 16-BIT RETRO PANORAMA BANNER (8-BIT ARCADE STYLE) */}
      <div className="relative w-full h-[110px] sm:h-[160px] md:h-[190px] rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-black pixel-box bg-[#0284c7]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* OVERLAID RETRO TITLE BADGE */}
        <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 bg-[#0f172a]/95 border-2 sm:border-3 border-black p-1.5 sm:p-2 rounded-lg pixel-btn shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-sm md:text-base font-pixel text-[#facc15] tracking-wider animate-pulse">
              ⚓ NAVAL WARFARE 3D
            </span>
          </div>
          <p className="text-[7.5px] sm:text-[9px] font-pixel text-[#38bdf8] mt-0.5">
            PIXEL TACTICS • 8-BIT ARCADE EDITION
          </p>
        </div>

        {/* RETRO DIALOGUE BUBBLE */}
        <div className="absolute bottom-1.5 right-1.5 max-w-[220px] sm:max-w-[320px] bg-[#020617]/90 border border-black sm:border-2 p-1 sm:p-1.5 rounded-md pixel-btn hidden xs:flex sm:flex items-center gap-1.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00b4d8] border border-black rounded flex items-center justify-center font-pixel text-[10px] sm:text-xs text-black shrink-0">
            👮
          </div>
          <p className="text-[7.5px] sm:text-[8.5px] font-pixel text-[#fef08a] leading-tight">
            "¡Comandante! La flota enemiga fue avistada. ¡Preparen cañones!"
          </p>
        </div>
      </div>

      {/* 2. GAME SETUP CARDS (THEATER, GRID, DIFFICULTY) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {/* TEATRO DE GUERRA */}
        <div className="bg-[#0f172a] border-2 sm:border-3 border-black p-2 sm:p-2.5 rounded-lg pixel-box flex flex-col gap-1.5">
          <label className="text-[9px] sm:text-[10px] font-pixel text-[#38bdf8] flex items-center gap-1 uppercase">
            <Compass className="w-3 h-3 text-[#00b4d8]" />
            <span>Zona Naval</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'pacific', label: 'Pacífico', icon: '🌴' },
              { id: 'atlantic', label: 'Atlántico', icon: '⚡' },
              { id: 'arctic', label: 'Ártico', icon: '❄️' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectTheater(item.id as TheaterId);
                }}
                className={`py-1.5 sm:py-2 rounded border border-black sm:border-2 font-pixel text-[8px] sm:text-[9px] flex flex-col items-center gap-0.5 transition cursor-pointer pixel-btn ${
                  theater === item.id
                    ? 'bg-[#00b4d8] text-black font-bold'
                    : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
                }`}
              >
                <span className="text-[11px] sm:text-xs">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAMAÑO DE TABLERO */}
        <div className="bg-[#0f172a] border-2 sm:border-3 border-black p-2 sm:p-2.5 rounded-lg pixel-box flex flex-col gap-1.5">
          <label className="text-[9px] sm:text-[10px] font-pixel text-[#facc15] flex items-center gap-1 uppercase">
            <Shield className="w-3 h-3 text-[#facc15]" />
            <span>Cuadrícula</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { size: 8, label: '8x8', desc: 'Rápido' },
              { size: 10, label: '10x10', desc: 'Estándar' },
              { size: 12, label: '12x12', desc: 'Épico' },
            ].map(item => (
              <button
                key={item.size}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectGridSize(item.size as GridDimension);
                }}
                className={`py-1.5 sm:py-2 rounded border border-black sm:border-2 font-pixel text-[8px] sm:text-[9px] flex flex-col items-center transition cursor-pointer pixel-btn ${
                  gridSize === item.size
                    ? 'bg-[#facc15] text-black font-bold'
                    : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[6.5px] opacity-80">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DIFICULTAD IA */}
        <div className="bg-[#0f172a] border-2 sm:border-3 border-black p-2 sm:p-2.5 rounded-lg pixel-box flex flex-col gap-1.5">
          <label className="text-[9px] sm:text-[10px] font-pixel text-[#ff4d6d] flex items-center gap-1 uppercase">
            <Cpu className="w-3 h-3 text-[#ff4d6d]" />
            <span>Nivel IA</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'cadet', label: 'Cadete', icon: '★' },
              { id: 'veteran', label: 'Veterano', icon: '★★' },
              { id: 'admiral', label: 'Almirante', icon: '★★★' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectDifficulty(item.id as AIDifficulty);
                }}
                className={`py-1.5 sm:py-2 rounded border border-black sm:border-2 font-pixel text-[8px] sm:text-[9px] flex flex-col items-center transition cursor-pointer pixel-btn ${
                  difficulty === item.id
                    ? 'bg-[#ff4d6d] text-white font-bold'
                    : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
                }`}
              >
                <span className="text-[8px] text-[#facc15]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PRIMARY RETRO ACTION BUTTONS */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-2">
        {/* START BATTLE BUTTON */}
        <button
          id="start-pixel-battle-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onStartGame();
          }}
          className="flex-1 w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#10b981] to-[#00b4d8] hover:from-[#34d399] hover:to-[#38bdf8] text-slate-950 font-pixel text-[11px] sm:text-xs uppercase rounded-lg sm:rounded-xl border-2 sm:border-4 border-black pixel-box pixel-btn flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>¡JUGAR BATALLA NAVAL!</span>
        </button>

        {/* CAMPAIGN MODE BUTTON */}
        <button
          id="campaign-pixel-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenCampaign();
          }}
          className="w-full sm:w-auto py-2.5 sm:py-3 px-3.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-pixel text-[9px] sm:text-[10px] uppercase rounded-lg sm:rounded-xl border-2 sm:border-3 border-black pixel-box pixel-btn flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-black" />
          <span>CAMPAÑA</span>
        </button>

        {/* HOW TO PLAY TUTORIAL BUTTON */}
        <button
          id="tutorial-pixel-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenHowToPlay();
          }}
          className="w-full sm:w-auto py-2.5 sm:py-3 px-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] font-pixel text-[9px] sm:text-[10px] uppercase rounded-lg sm:rounded-xl border-2 sm:border-3 border-black pixel-box pixel-btn flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>TUTORIAL</span>
        </button>
      </div>
    </div>
  );
};
