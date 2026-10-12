import React, { useRef, useEffect, useState } from 'react';
import { BoardCell, Coordinate, GridDimension, PlacedShip, TheaterId } from '../../types/game';
import {
  drawPixelWaterBackground,
  drawPixelGridTiles,
  drawPixelShip,
  drawPixelHitFire,
  drawPixelExplosion,
  drawPixelWaterSplash,
  drawPixelRect,
  drawPixelBorderBox,
} from '../../services/pixelSprites';
import { sound } from '../../services/soundEngine';
import { Target, Crosshair, Zap, Shield, Play, Flame, HelpCircle } from 'lucide-react';

interface ActiveVFX {
  id: string;
  type: 'missile' | 'explosion' | 'splash' | 'floatingText';
  startX?: number;
  startY?: number;
  targetX: number;
  targetY: number;
  progress: number;
  frame: number;
  maxFrame: number;
  text?: string;
  color?: string;
}

interface PixelBattlefieldProps {
  mode: 'placement' | 'battle';
  gridSize: GridDimension;
  playerBoardCells?: BoardCell[][];
  aiBoardCells?: BoardCell[][];
  playerShips?: PlacedShip[];
  aiShips?: PlacedShip[];
  ships?: PlacedShip[]; // For placement
  currentTurn?: 'player' | 'ai';
  onCellClick?: (coord: Coordinate) => void;
  onPlaceShip?: (r: number, c: number) => void;
  lastTargetCoord?: Coordinate | null;
  theater: TheaterId;
  placementPreview?: {
    id: string;
    size: number;
    orientation: 'horizontal' | 'vertical';
  };
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const PixelBattlefield: React.FC<PixelBattlefieldProps> = ({
  mode,
  gridSize,
  playerBoardCells = [],
  aiBoardCells = [],
  playerShips = [],
  aiShips = [],
  ships = [],
  currentTurn = 'player',
  onCellClick,
  onPlaceShip,
  lastTargetCoord,
  theater,
  placementPreview,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vfxListRef = useRef<ActiveVFX[]>([]);
  const tickRef = useRef<number>(0);

  // Active board view for mobile screens ('target' = enemy radar, 'fleet' = own ships)
  const [activeBoard, setActiveBoard] = useState<'target' | 'fleet'>('target');
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);
  const [lockedTarget, setLockedTarget] = useState<Coordinate | null>(null);

  // Main 60FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Enable crisp pixelated scaling
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      tickRef.current++;
      const tick = tickRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw 16-bit animated pixel water background
      drawPixelWaterBackground(ctx, w, h, tick, theater);

      // Determine layout based on canvas width
      const isDualView = w >= 760 && mode === 'battle';
      const margin = 16;
      const headerHeight = 36;
      const availableH = h - headerHeight - margin * 2;
      const availableW = isDualView ? (w - margin * 3) / 2 : w - margin * 2;

      const maxGridPixelSize = Math.min(availableW - 32, availableH - 32);
      const cellSize = Math.max(22, Math.floor(maxGridPixelSize / gridSize));
      const totalGridPixelDim = cellSize * gridSize;

      // Helper function to draw a full grid board
      const drawGrid = (
        startX: number,
        startY: number,
        title: string,
        accentColor: string,
        cells: BoardCell[][],
        boardShips: PlacedShip[],
        isTargetRadar: boolean
      ) => {
        // Draw Header Title Tag
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(startX - 2, startY - 26, totalGridPixelDim + 4, 22);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX - 2, startY - 26, totalGridPixelDim + 4, 22);

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, startX + 6, startY - 15);

        // Draw Column Coordinate Headers (1, 2, 3...)
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffffff';

        for (let c = 0; c < gridSize; c++) {
          const x = startX + c * cellSize + cellSize / 2;
          ctx.fillText(String(c + 1), x, startY - 4);
        }

        // Draw Row Coordinate Headers (A, B, C...)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let r = 0; r < gridSize; r++) {
          const y = startY + r * cellSize + cellSize / 2;
          ctx.fillText(LETTERS[r] || String(r + 1), startX - 5, y);
        }

        // Draw Ocean Grid Tiles
        drawPixelGridTiles(ctx, startX, startY, gridSize, cellSize, tick, theater);

        // Draw Ghost Ship Placement Preview if in placement mode
        if (mode === 'placement' && hoveredCell && placementPreview) {
          const { r, c } = hoveredCell;
          const { size, orientation } = placementPreview;

          // Check boundary
          const fits =
            orientation === 'horizontal'
              ? c + size <= gridSize && r < gridSize
              : r + size <= gridSize && c < gridSize;

          const previewColor = fits ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
          const borderColor = fits ? '#10b981' : '#ef4444';

          ctx.fillStyle = previewColor;
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 2;

          for (let i = 0; i < size; i++) {
            const pr = orientation === 'horizontal' ? r : r + i;
            const pc = orientation === 'horizontal' ? c + i : c;
            if (pr < gridSize && pc < gridSize) {
              const px = startX + pc * cellSize;
              const py = startY + pr * cellSize;
              ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
              ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            }
          }
        }

        // Draw Shot Status Overlays (Miss splash / Hit fire)
        if (cells.length > 0) {
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              const cell = cells[r]?.[c];
              if (!cell) continue;

              const cellX = startX + c * cellSize;
              const cellY = startY + r * cellSize;

              if (cell.status === 'hit' || cell.status === 'sunk') {
                drawPixelHitFire(ctx, cellX, cellY, cellSize, tick);
              } else if (cell.status === 'miss') {
                // White Splash Marker Tile
                ctx.fillStyle = '#e0f2fe';
                ctx.fillRect(cellX + cellSize / 2 - 4, cellY + cellSize / 2 - 4, 8, 8);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(cellX + cellSize / 2 - 2, cellY + cellSize / 2 - 2, 4, 4);
                ctx.strokeStyle = '#000000';
                ctx.strokeRect(cellX + cellSize / 2 - 4, cellY + cellSize / 2 - 4, 8, 8);
              }
            }
          }
        }

        // Draw Ships on Board (Player fleet, or sunken enemy ships)
        boardShips.forEach(ship => {
          if (!isTargetRadar || ship.sunk) {
            const shipX = startX + ship.origin.c * cellSize;
            const shipY = startY + ship.origin.r * cellSize;
            drawPixelShip(
              ctx,
              ship.id,
              shipX,
              shipY,
              ship.size,
              ship.orientation,
              cellSize,
              ship.sunk,
              tick
            );
          }
        });

        // Draw Locked Target Reticle on Target Radar
        if (isTargetRadar && lockedTarget && currentTurn === 'player') {
          const { r, c } = lockedTarget;
          if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            const tX = startX + c * cellSize;
            const tY = startY + r * cellSize;

            // Pulsing Reticle Ring
            const pulse = (Math.sin(tick * 0.15) + 1) * 0.5;
            ctx.strokeStyle = '#ff4d6d';
            ctx.lineWidth = 3;

            ctx.strokeRect(tX + 1, tY + 1, cellSize - 2, cellSize - 2);

            // Center Crosshair
            ctx.fillStyle = '#facc15';
            ctx.fillRect(tX + cellSize / 2 - 3, tY + cellSize / 2 - 3, 6, 6);

            // Locked Tag Badge [ TARGET LOCK ]
            const coordTag = `LOCK [ ${LETTERS[r]}${c + 1} ]`;
            ctx.fillStyle = '#ff4d6d';
            ctx.fillRect(tX + cellSize / 2 - 36, tY - 18, 72, 16);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tX + cellSize / 2 - 36, tY - 18, 72, 16);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(coordTag, tX + cellSize / 2, tY - 10);
          }
        }

        // Draw Hovered Reticle if hovering over this board
        if (isTargetRadar && hoveredCell && (!lockedTarget || hoveredCell.r !== lockedTarget.r || hoveredCell.c !== lockedTarget.c) && currentTurn === 'player') {
          const { r, c } = hoveredCell;
          if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            const hX = startX + c * cellSize;
            const hY = startY + r * cellSize;

            // Animated Lock-on Corner Brackets
            const cornerLen = 6;
            ctx.strokeStyle = '#00b4d8';
            ctx.lineWidth = 2.5;

            // Corners
            ctx.beginPath();
            ctx.moveTo(hX, hY + cornerLen);
            ctx.lineTo(hX, hY);
            ctx.lineTo(hX + cornerLen, hY);

            ctx.moveTo(hX + cellSize - cornerLen, hY);
            ctx.lineTo(hX + cellSize, hY);
            ctx.lineTo(hX + cellSize, hY + cornerLen);

            ctx.moveTo(hX + cellSize, hY + cellSize - cornerLen);
            ctx.lineTo(hX + cellSize, hY + cellSize);
            ctx.lineTo(hX + cellSize - cornerLen, hY + cellSize);

            ctx.moveTo(hX + cornerLen, hY + cellSize);
            ctx.lineTo(hX, hY + cellSize);
            ctx.lineTo(hX, hY + cellSize - cornerLen);
            ctx.stroke();

            // Center Crosshair Dot
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(hX + cellSize / 2 - 2, hY + cellSize / 2 - 2, 4, 4);
          }
        }
      };

      // RENDER BOARDS BASED ON SCREEN MODE
      if (mode === 'placement') {
        const startX = Math.floor((w - totalGridPixelDim) / 2);
        const startY = Math.floor((h - totalGridPixelDim) / 2) + 14;
        drawGrid(startX, startY, 'DOCK NAVAL (TU FLOTA)', '#00b4d8', [], ships, false);
      } else if (isDualView) {
        // Desktop / Tablet Side-by-Side Dual View
        const leftStartX = Math.floor(margin + 28);
        const rightStartX = Math.floor(w / 2 + 28);
        const startY = Math.floor((h - totalGridPixelDim) / 2) + 14;

        // Player Fleet Grid (Left)
        drawGrid(leftStartX, startY, '🛡️ TU FLOTA DEFENSIVA', '#10b981', playerBoardCells, playerShips, false);
        // Enemy Target Radar (Right)
        drawGrid(rightStartX, startY, '🎯 RADAR DE DISPARO ENEMIGO', '#ff4d6d', aiBoardCells, aiShips, true);
      } else {
        // Mobile Single Screen (Toggled by activeBoard state)
        const startX = Math.floor((w - totalGridPixelDim) / 2) + 14;
        const startY = Math.floor((h - totalGridPixelDim) / 2) + 14;

        if (activeBoard === 'target') {
          drawGrid(startX, startY, '🎯 RADAR DE DISPARO (ENEMIGO)', '#ff4d6d', aiBoardCells, aiShips, true);
        } else {
          drawGrid(startX, startY, '🛡️ TU FLOTA (DEFENSA)', '#10b981', playerBoardCells, playerShips, false);
        }
      }

      // 2. Render Active Ballistic VFX (Missiles, Explosions, Splashes, Text)
      vfxListRef.current.forEach(vfx => {
        if (vfx.type === 'missile') {
          vfx.progress += 0.055;
          const currentX = (vfx.startX || 0) + (vfx.targetX - (vfx.startX || 0)) * vfx.progress;
          const currentY = (vfx.startY || 0) + (vfx.targetY - (vfx.startY || 0)) * vfx.progress - Math.sin(vfx.progress * Math.PI) * 75;

          // Rocket Body
          drawPixelRect(ctx, currentX - 3, currentY - 3, 6, 6, '#ffffff');
          // Thruster Fire Trail
          drawPixelRect(ctx, currentX - 1, currentY + 4, 3, 5, '#f59e0b');
          drawPixelRect(ctx, currentX - 2, currentY + 8, 4, 4, '#ef4444');
        } else if (vfx.type === 'explosion') {
          vfx.frame++;
          drawPixelExplosion(ctx, vfx.targetX, vfx.targetY, 32, vfx.frame);
        } else if (vfx.type === 'splash') {
          vfx.frame++;
          drawPixelWaterSplash(ctx, vfx.targetX, vfx.targetY, 26, vfx.frame);
        } else if (vfx.type === 'floatingText') {
          vfx.frame++;
          vfx.targetY -= 1.2;
          ctx.save();
          ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Black Shadow
          ctx.fillStyle = '#000000';
          ctx.fillText(vfx.text || '', vfx.targetX + 2, vfx.targetY + 2);
          // Vivid Color
          ctx.fillStyle = vfx.color || '#facc15';
          ctx.fillText(vfx.text || '', vfx.targetX, vfx.targetY);
          ctx.restore();
        }
      });

      // Prune finished VFX
      vfxListRef.current = vfxListRef.current.filter(
        v => (v.type === 'missile' && v.progress < 1) || (v.type !== 'missile' && v.frame < v.maxFrame)
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, gridSize, playerBoardCells, aiBoardCells, playerShips, aiShips, ships, activeBoard, hoveredCell, lockedTarget, currentTurn, placementPreview]);

  // Sync canvas size
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

  // Helper to map screen coordinates to board grid (r, c)
  const getCellFromPointer = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const isDualView = w >= 760 && mode === 'battle';
    const margin = 16;
    const headerHeight = 36;
    const availableH = h - headerHeight - margin * 2;
    const availableW = isDualView ? (w - margin * 3) / 2 : w - margin * 2;

    const maxGridPixelSize = Math.min(availableW - 32, availableH - 32);
    const cellSize = Math.max(22, Math.floor(maxGridPixelSize / gridSize));
    const totalGridPixelDim = cellSize * gridSize;

    let startX = 0;
    let startY = Math.floor((h - totalGridPixelDim) / 2) + 14;

    if (mode === 'placement') {
      startX = Math.floor((w - totalGridPixelDim) / 2);
    } else if (isDualView) {
      // Enemy Target radar is on the right
      startX = Math.floor(w / 2 + 28);
    } else {
      // Mobile Single Board View
      if (activeBoard !== 'target') {
        // Pointer is over defense fleet board
        return null;
      }
      startX = Math.floor((w - totalGridPixelDim) / 2) + 14;
    }

    const c = Math.floor((px - startX) / cellSize);
    const r = Math.floor((py - startY) / cellSize);

    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      return {
        coord: { r, c },
        screenX: startX + c * cellSize + cellSize / 2,
        screenY: startY + r * cellSize + cellSize / 2,
      };
    }

    return null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const result = getCellFromPointer(e);
    if (result) {
      setHoveredCell(result.coord);
    } else {
      setHoveredCell(null);
    }
  };

  // Launch Attack Function
  const executeAttack = (coord: Coordinate, sX?: number, sY?: number) => {
    if (currentTurn !== 'player' || !onCellClick) return;

    // Check if cell was already attacked
    const existingCell = aiBoardCells[coord.r]?.[coord.c];
    if (existingCell && existingCell.status !== 'empty') {
      sound.playWaterSplash();
      return;
    }

    const canvas = canvasRef.current;
    const targetScreenX = sX || (canvas ? canvas.width * 0.7 : 300);
    const targetScreenY = sY || (canvas ? canvas.height * 0.5 : 200);

    // Play Cannon launch audio
    sound.playCannonFire();

    const missileVFX: ActiveVFX = {
      id: 'missile_' + Date.now(),
      type: 'missile',
      startX: targetScreenX - 120,
      startY: targetScreenY + 80,
      targetX: targetScreenX,
      targetY: targetScreenY,
      progress: 0,
      frame: 0,
      maxFrame: 20,
    };

    vfxListRef.current.push(missileVFX);

    setTimeout(() => {
      // Check hit or miss
      const isHit = aiShips.some(s => s.positions.some(p => p.r === coord.r && p.c === coord.c));

      if (isHit) {
        sound.playHitExplosion();
        vfxListRef.current.push({
          id: 'exp_' + Date.now(),
          type: 'explosion',
          targetX: targetScreenX,
          targetY: targetScreenY,
          progress: 0,
          frame: 0,
          maxFrame: 14,
        });

        vfxListRef.current.push({
          id: 'text_' + Date.now(),
          type: 'floatingText',
          targetX: targetScreenX,
          targetY: targetScreenY - 10,
          progress: 0,
          frame: 0,
          maxFrame: 45,
          text: '¡IMPACTO!',
          color: '#ef4444',
        });
      } else {
        sound.playWaterSplash();
        vfxListRef.current.push({
          id: 'splash_' + Date.now(),
          type: 'splash',
          targetX: targetScreenX,
          targetY: targetScreenY,
          progress: 0,
          frame: 0,
          maxFrame: 14,
        });

        vfxListRef.current.push({
          id: 'text_' + Date.now(),
          type: 'floatingText',
          targetX: targetScreenX,
          targetY: targetScreenY - 10,
          progress: 0,
          frame: 0,
          maxFrame: 40,
          text: '¡AGUA!',
          color: '#38bdf8',
        });
      }

      setLockedTarget(null);
      onCellClick(coord);
    }, 350);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const result = getCellFromPointer(e);
    if (!result) return;
    const { coord, screenX, screenY } = result;

    if (mode === 'placement' && onPlaceShip) {
      onPlaceShip(coord.r, coord.c);
    } else if (mode === 'battle' && currentTurn === 'player') {
      // Check if target is already locked
      if (lockedTarget && lockedTarget.r === coord.r && lockedTarget.c === coord.c) {
        // Double tap / second tap fires directly
        executeAttack(coord, screenX, screenY);
      } else {
        // Lock this target and play sound
        sound.playSonarPing();
        setLockedTarget(coord);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2.5 font-silkscreen">
      {/* 1. 8-BIT RETRO PIXEL CANVAS CONTAINER (FLUID RESPONSIVE HEIGHT) */}
      <div className="relative w-full h-[min(48vh,430px)] min-h-[250px] rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-black pixel-box bg-[#0284c7] select-none">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setHoveredCell(null)}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        {/* 2. MOBILE QUICK VIEW TOGGLE BUTTONS */}
        {mode === 'battle' && (
          <div className="absolute top-1.5 left-1.5 z-20 flex md:hidden items-center gap-1 bg-[#0f172a]/95 p-0.5 rounded-md border border-black">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveBoard('target');
              }}
              className={`px-2 py-0.5 rounded text-[8px] font-pixel border border-black cursor-pointer ${
                activeBoard === 'target'
                  ? 'bg-[#ff4d6d] text-white font-bold'
                  : 'bg-[#1e293b] text-slate-400'
              }`}
            >
              🎯 RADAR
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveBoard('fleet');
              }}
              className={`px-2 py-0.5 rounded text-[8px] font-pixel border border-black cursor-pointer ${
                activeBoard === 'fleet'
                  ? 'bg-[#10b981] text-black font-bold'
                  : 'bg-[#1e293b] text-slate-400'
              }`}
            >
              🛡️ FLOTA
            </button>
          </div>
        )}

        {/* 3. RETRO TURN STATUS BADGE */}
        {mode === 'battle' && (
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1.5 bg-[#0f172a]/95 border border-black sm:border-2 px-2 py-0.5 rounded-md pixel-btn shadow-md">
            <span
              className={`w-2 h-2 rounded-full ${
                currentTurn === 'player' ? 'bg-[#10b981] animate-ping' : 'bg-[#ef4444]'
              }`}
            />
            <span className="text-[8px] sm:text-[9px] font-pixel text-[#fef08a]">
              {currentTurn === 'player' ? '★ TU TURNO ★' : '⌛ ESPERANDO IA...'}
            </span>
          </div>
        )}
      </div>

      {/* 4. TACTICAL FIRING CONTROLS BAR (8-BIT TACTICAL FIRE BUTTON) */}
      {mode === 'battle' && (
        <div className="w-full bg-[#0f172a] border-2 sm:border-3 border-black p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl pixel-box flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2.5 text-white">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <Crosshair className="w-3.5 h-3.5 text-[#ff4d6d]" />
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-pixel text-[#facc15]">
                OBJETIVO:
              </span>
              <span className="text-[9.5px] sm:text-[11px] font-pixel text-white">
                {lockedTarget
                  ? `[ ${LETTERS[lockedTarget.r]}${lockedTarget.c + 1} ]`
                  : 'TOCA EL RADAR'}
              </span>
            </div>
          </div>

          {/* DEDICATED FIRE / DISPARAR BUTTON */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Quick Switch to Radar if on mobile fleet view */}
            <div className="flex sm:hidden">
              {activeBoard === 'fleet' && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveBoard('target');
                  }}
                  className="px-2.5 py-1.5 bg-[#00b4d8] text-black font-pixel text-[8px] rounded border border-black pixel-btn cursor-pointer"
                >
                  🎯 RADAR
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={currentTurn !== 'player' || !lockedTarget}
              onClick={() => {
                if (lockedTarget) {
                  executeAttack(lockedTarget);
                }
              }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 sm:border-3 border-black font-pixel text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer pixel-btn ${
                currentTurn === 'player' && lockedTarget
                  ? 'bg-[#ff4d6d] hover:bg-[#ff758f] text-white shadow-[0_0_15px_rgba(255,77,109,0.7)] animate-bounce font-bold'
                  : currentTurn === 'player'
                  ? 'bg-[#334155] text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-[#1e293b] text-slate-500 cursor-not-allowed opacity-40'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current text-[#facc15]" />
              <span className="truncate">
                {currentTurn !== 'player'
                  ? 'TURNO IA...'
                  : lockedTarget
                  ? `¡FUEGO! [ ${LETTERS[lockedTarget.r]}${lockedTarget.c + 1} ]`
                  : 'SELECCIONA OBJETIVO'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
