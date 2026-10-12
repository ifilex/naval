import React from 'react';
import { BoardCell, Coordinate, GridDimension, PlacedShip, TheaterId } from '../types/game';
import { ShipVisual } from './ShipVisual';
import { Crosshair, Flame, Skull } from 'lucide-react';

interface GameBoardProps {
  gridSize: GridDimension;
  cells: BoardCell[][];
  ships: PlacedShip[];
  isTargetBoard: boolean; // True if clicking fires at enemy; False if showing player's own fleet
  onCellClick?: (coord: Coordinate) => void;
  disabled?: boolean;
  theater: TheaterId;
  heatmap?: number[][];
  showHeatmap?: boolean;
  lastTargetCoord?: Coordinate | null;
}

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const GameBoard: React.FC<GameBoardProps> = ({
  gridSize,
  cells,
  ships,
  isTargetBoard,
  onCellClick,
  disabled = false,
  theater,
  heatmap,
  showHeatmap = false,
  lastTargetCoord,
}) => {
  // Find max probability in heatmap for relative gradient
  let maxHeat = 1;
  if (heatmap) {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (heatmap[r][c] > maxHeat) maxHeat = heatmap[r][c];
      }
    }
  }

  return (
    <div
      id={`game-board-${isTargetBoard ? 'target' : 'fleet'}`}
      className="relative select-none touch-manipulation w-full"
    >
      {/* GEOMETRIC BALANCE RADAR GRID CONTAINER */}
      <div
        className={`p-2.5 sm:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden ${
          isTargetBoard
            ? 'border-cyan-500/30 bg-[#020c1b]/90 shadow-[0_0_50px_rgba(6,182,212,0.12)]'
            : 'border-slate-800/80 bg-[#020c1b]/70 shadow-lg'
        }`}
      >
        {/* Radar Sweep Background */}
        {isTargetBoard && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent animate-pulse" />
          </div>
        )}

        {/* COLUMN NUMBERS (1 to N) */}
        <div
          className="grid gap-1 mb-1.5 items-center"
          style={{
            gridTemplateColumns: `24px repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          <div className="w-6 text-center text-[10px] font-mono text-cyan-700 font-bold uppercase">#</div>
          {Array.from({ length: gridSize }).map((_, c) => (
            <div
              key={`col-${c}`}
              className="text-center font-mono text-[10px] sm:text-xs font-bold text-cyan-400/90"
            >
              {c + 1}
            </div>
          ))}
        </div>

        {/* GRID ROWS */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: gridSize }).map((_, r) => (
            <div
              key={`row-${r}`}
              className="grid gap-1 items-center"
              style={{
                gridTemplateColumns: `24px repeat(${gridSize}, minmax(0, 1fr))`,
              }}
            >
              {/* ROW LETTER (A to L) */}
              <div className="w-6 text-center font-mono text-[10px] sm:text-xs font-bold text-cyan-500">
                {ROW_LETTERS[r]}
              </div>

              {/* ROW CELLS */}
              {Array.from({ length: gridSize }).map((_, c) => {
                const cell = cells[r]?.[c] || { r, c, hasShip: false, status: 'empty' };
                const isLastTarget = lastTargetCoord?.r === r && lastTargetCoord?.c === c;
                const heatVal = heatmap ? heatmap[r]?.[c] || 0 : 0;
                const heatPercent = Math.round((heatVal / maxHeat) * 100);

                // Check if a sunken ship covers this cell
                const sunkenShip = ships.find(
                  s => s.sunk && s.positions.some(p => p.r === r && p.c === c)
                );

                // If this is player fleet board, show unsunk ships
                const activeFleetShip = !isTargetBoard
                  ? ships.find(s => s.positions.some(p => p.r === r && p.c === c))
                  : null;

                const isShipOrigin = activeFleetShip?.origin.r === r && activeFleetShip?.origin.c === c;
                const isSunkenOrigin = sunkenShip?.origin.r === r && sunkenShip?.origin.c === c;

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    id={`cell-${isTargetBoard ? 'target' : 'fleet'}-${ROW_LETTERS[r]}${c + 1}`}
                    type="button"
                    disabled={disabled || (isTargetBoard && cell.status !== 'empty')}
                    onClick={() => onCellClick && onCellClick({ r, c })}
                    aria-label={`Sector ${ROW_LETTERS[r]}${c + 1}`}
                    className={`relative aspect-square rounded-[3px] border flex items-center justify-center transition-all duration-150 group overflow-hidden ${
                      isTargetBoard && cell.status === 'empty' && !disabled
                        ? 'cursor-crosshair hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95'
                        : 'cursor-default'
                    } ${
                      cell.status === 'hit'
                        ? 'bg-red-500/20 border-red-500/60 shadow-[inset_0_0_12px_rgba(239,68,68,0.4)]'
                        : cell.status === 'sunk'
                        ? 'bg-red-950/90 border-red-500 shadow-[inset_0_0_16px_rgba(220,38,38,0.7)]'
                        : cell.status === 'miss'
                        ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300'
                        : isTargetBoard
                        ? 'bg-cyan-950/40 border-cyan-900/40 hover:border-cyan-500/60'
                        : activeFleetShip
                        ? 'bg-slate-900/90 border-cyan-500/40'
                        : 'bg-[#020c1b]/60 border-slate-800/40'
                    } ${
                      isLastTarget
                        ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#020c1b] animate-pulse'
                        : ''
                    }`}
                  >
                    {/* OPTIONAL HEATMAP PROBABILITY TINT */}
                    {showHeatmap && cell.status === 'empty' && heatVal > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none flex items-center justify-center font-mono text-[9px] font-bold"
                        style={{
                          backgroundColor: `rgba(6, 182, 212, ${Math.min(0.6, heatPercent / 130)})`,
                          color: heatPercent > 50 ? '#ffffff' : '#67e8f9',
                        }}
                      >
                        {heatPercent}%
                      </div>
                    )}

                    {/* RENDER ACTIVE PLAYER SHIP ON FLEET BOARD */}
                    {!isTargetBoard && activeFleetShip && isShipOrigin && (
                      <div
                        className="absolute top-0 left-0 pointer-events-none z-10 p-0.5"
                        style={{
                          width: activeFleetShip.orientation === 'horizontal' ? `${activeFleetShip.size * 100}%` : '100%',
                          height: activeFleetShip.orientation === 'vertical' ? `${activeFleetShip.size * 100}%` : '100%',
                        }}
                      >
                        <ShipVisual
                          type={activeFleetShip.id}
                          size={activeFleetShip.size}
                          orientation={activeFleetShip.orientation}
                          isSunk={activeFleetShip.sunk}
                          damageRatio={activeFleetShip.hits / activeFleetShip.size}
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    {/* RENDER SUNKEN SHIP REVEAL ON TARGET BOARD */}
                    {isTargetBoard && sunkenShip && isSunkenOrigin && (
                      <div
                        className="absolute top-0 left-0 pointer-events-none z-10 p-0.5"
                        style={{
                          width: sunkenShip.orientation === 'horizontal' ? `${sunkenShip.size * 100}%` : '100%',
                          height: sunkenShip.orientation === 'vertical' ? `${sunkenShip.size * 100}%` : '100%',
                        }}
                      >
                        <ShipVisual
                          type={sunkenShip.id}
                          size={sunkenShip.size}
                          orientation={sunkenShip.orientation}
                          isSunk={true}
                          damageRatio={1}
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    {/* CELL HIT / MISS / SUNK ICONS & ANIMATIONS */}
                    {cell.status === 'hit' && (
                      <div className="relative z-20 flex flex-col items-center justify-center animate-bounce">
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] fill-red-500" />
                      </div>
                    )}

                    {cell.status === 'sunk' && (
                      <div className="relative z-20 flex flex-col items-center justify-center">
                        <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse" />
                      </div>
                    )}

                    {cell.status === 'miss' && (
                      <div className="relative z-20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-ping absolute opacity-60" />
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm relative z-10" />
                      </div>
                    )}

                    {/* HOVER CROSSHAIR ON UNTRIED ENEMY CELLS */}
                    {isTargetBoard && cell.status === 'empty' && !disabled && (
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400/50 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-150" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
