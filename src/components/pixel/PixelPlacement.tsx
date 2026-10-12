import React, { useState } from 'react';
import { Coordinate, GridDimension, PlacedShip, ShipTemplate, TheaterId } from '../../types/game';
import { isValidPlacement, generateRandomFleet } from '../../services/aiEngine';
import { PixelBattlefield } from './PixelBattlefield';
import { sound } from '../../services/soundEngine';
import {
  RotateCw,
  Shuffle,
  RotateCcw,
  Play,
  Anchor,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  HelpCircle
} from 'lucide-react';
import { TranslationDict } from '../../i18n/translations';

interface PixelPlacementProps {
  gridSize: GridDimension;
  templates: ShipTemplate[];
  ships: PlacedShip[];
  onShipsChange: (ships: PlacedShip[]) => void;
  onConfirmPlacement: () => void;
  t: TranslationDict;
  theater: TheaterId;
}

export const PixelPlacement: React.FC<PixelPlacementProps> = ({
  gridSize,
  templates,
  ships,
  onShipsChange,
  onConfirmPlacement,
  t,
  theater,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templates[0]?.id || null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const placedShip = ships.find(s => s.id === selectedTemplateId);
  const allPlaced = templates.length > 0 && templates.every(tmpl => ships.some(s => s.id === tmpl.id));

  // Rotate currently selected ship or current orientation setting
  const handleToggleRotate = () => {
    sound.playRotate();
    const nextOrient: 'horizontal' | 'vertical' = orientation === 'horizontal' ? 'vertical' : 'horizontal';
    setOrientation(nextOrient);

    // If the selected ship is already placed on the board, attempt to rotate it in-place
    if (placedShip) {
      let originR = placedShip.origin.r;
      let originC = placedShip.origin.c;

      // Adjust origin if it would extend beyond the board boundary
      if (nextOrient === 'horizontal' && originC + placedShip.size > gridSize) {
        originC = Math.max(0, gridSize - placedShip.size);
      } else if (nextOrient === 'vertical' && originR + placedShip.size > gridSize) {
        originR = Math.max(0, gridSize - placedShip.size);
      }

      const valid = isValidPlacement(
        placedShip.size,
        { r: originR, c: originC },
        nextOrient,
        gridSize,
        ships,
        placedShip.id
      );

      if (valid) {
        const positions: Coordinate[] = [];
        for (let i = 0; i < placedShip.size; i++) {
          positions.push({
            r: nextOrient === 'horizontal' ? originR : originR + i,
            c: nextOrient === 'horizontal' ? originC + i : originC,
          });
        }

        const updated = ships.map(s =>
          s.id === placedShip.id
            ? { ...s, orientation: nextOrient, origin: { r: originR, c: originC }, positions }
            : s
        );
        onShipsChange(updated);
      }
    }
  };

  // Move placed ship with D-pad arrows
  const handleMoveShip = (dRow: number, dCol: number) => {
    if (!placedShip) return;

    const newR = placedShip.origin.r + dRow;
    const newC = placedShip.origin.c + dCol;

    if (newR < 0 || newC < 0) {
      sound.playWaterSplash();
      return;
    }

    const valid = isValidPlacement(
      placedShip.size,
      { r: newR, c: newC },
      placedShip.orientation,
      gridSize,
      ships,
      placedShip.id
    );

    if (valid) {
      sound.playClick();
      const positions: Coordinate[] = [];
      for (let i = 0; i < placedShip.size; i++) {
        positions.push({
          r: placedShip.orientation === 'horizontal' ? newR : newR + i,
          c: placedShip.orientation === 'horizontal' ? newC + i : newC,
        });
      }

      const updated = ships.map(s =>
        s.id === placedShip.id
          ? { ...s, origin: { r: newR, c: newC }, positions }
          : s
      );
      onShipsChange(updated);
    } else {
      sound.playWaterSplash();
    }
  };

  // Auto-Deploy all ships randomly
  const handleRandomize = () => {
    sound.playClick();
    const randomized = generateRandomFleet(gridSize, templates);
    onShipsChange(randomized);
    setSelectedTemplateId(null);
  };

  // Reset/Clear board
  const handleReset = () => {
    sound.playClick();
    onShipsChange([]);
    setSelectedTemplateId(templates[0]?.id || null);
  };

  // Click on a grid cell: place or select ship
  const handleCellClick = (r: number, c: number) => {
    const clickedShip = ships.find(s => s.positions.some(p => p.r === r && p.c === c));

    // If clicked on an existing ship, select it
    if (clickedShip && (!selectedTemplate || clickedShip.id !== selectedTemplate.id)) {
      sound.playClick();
      setSelectedTemplateId(clickedShip.id);
      setOrientation(clickedShip.orientation);
      return;
    }

    if (!selectedTemplate) return;

    const origin = { r, c };
    const valid = isValidPlacement(
      selectedTemplate.size,
      origin,
      orientation,
      gridSize,
      ships,
      selectedTemplate.id
    );

    if (valid) {
      sound.playClick();
      const positions: Coordinate[] = [];
      for (let i = 0; i < selectedTemplate.size; i++) {
        positions.push({
          r: orientation === 'horizontal' ? r : r + i,
          c: orientation === 'horizontal' ? c + i : c,
        });
      }

      const updated = ships.filter(s => s.id !== selectedTemplate.id);
      updated.push({
        id: selectedTemplate.id,
        nameKey: selectedTemplate.nameKey,
        size: selectedTemplate.size,
        orientation,
        origin,
        positions,
        hits: 0,
        sunk: false,
      });
      onShipsChange(updated);

      // Select next unplaced ship
      const nextUnplaced = templates.find(tmpl => !updated.some(s => s.id === tmpl.id));
      if (nextUnplaced) {
        setSelectedTemplateId(nextUnplaced.id);
      } else {
        setSelectedTemplateId(null);
      }
    } else {
      sound.playWaterSplash();
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-1.5 sm:gap-2.5 items-center px-1 sm:px-3 font-silkscreen">
      {/* 1. TOP HEADER & INSTRUCTION BANNER */}
      <div className="w-full bg-[#0f172a] border-2 sm:border-3 border-black p-1.5 sm:p-2 rounded-lg sm:rounded-xl pixel-box flex flex-wrap items-center justify-between gap-1.5 text-white">
        <div className="flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5 text-[#00b4d8]" />
          <span className="text-[9px] sm:text-xs font-pixel text-[#facc15] uppercase">
            DESPLIEGUE NAVAL: COLOCA Y ROTA
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* AUTO-DEPLOY */}
          <button
            type="button"
            onClick={handleRandomize}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-[#facc15] hover:bg-[#fde047] text-black font-pixel text-[8px] sm:text-[9px] rounded border border-black sm:border-2 pixel-btn flex items-center gap-1 cursor-pointer"
          >
            <Shuffle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>🎲 AUTO</span>
          </button>

          {/* RESET */}
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-pixel text-[8px] sm:text-[9px] rounded border border-black sm:border-2 pixel-btn flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>LIMPIAR</span>
          </button>
        </div>
      </div>

      {/* 2. SHIP SELECTOR CHIPS */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1">
        {templates.map(tmpl => {
          const isPlaced = ships.some(s => s.id === tmpl.id);
          const isSelected = selectedTemplateId === tmpl.id;

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedTemplateId(tmpl.id);
                const curr = ships.find(s => s.id === tmpl.id);
                if (curr) setOrientation(curr.orientation);
              }}
              className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg border border-black sm:border-2 font-pixel text-[7.5px] sm:text-[8px] flex flex-col items-center gap-0.5 transition cursor-pointer pixel-btn ${
                isSelected
                  ? 'bg-[#facc15] text-black font-bold ring-1 sm:ring-2 ring-white scale-102'
                  : isPlaced
                  ? 'bg-[#10b981]/80 text-black'
                  : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{t[tmpl.nameKey] || tmpl.id}</span>
                <span>{isPlaced ? '✓' : `${tmpl.size}■`}</span>
              </div>
              {/* Segmented Pixel Ship visual */}
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: tmpl.size }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-1.5 sm:w-2.5 sm:h-2 rounded-xs border border-black ${
                      isPlaced ? 'bg-[#0f172a]' : isSelected ? 'bg-black' : 'bg-[#00b4d8]'
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE SHIP MOVEMENT & ROTATION TOOLBAR */}
      <div className="w-full bg-[#1e293b] border border-black sm:border-2 p-1.5 sm:p-2 rounded-lg pixel-box flex flex-wrap items-center justify-between gap-1.5 text-white">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] sm:text-[9px] font-pixel text-[#38bdf8]">
            BARCO: <strong className="text-[#facc15]">{selectedTemplate ? t[selectedTemplate.nameKey] || selectedTemplate.id : 'SELECCIONA UNO'}</strong>
          </span>
          <span className="text-[7.5px] sm:text-[8px] font-pixel text-slate-300">
            ({orientation === 'horizontal' ? 'HORIZ' : 'VERT'})
          </span>
        </div>

        {/* ROTATE & D-PAD MOVEMENT BUTTONS */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* ROTATE BUTTON */}
          <button
            type="button"
            onClick={handleToggleRotate}
            className="px-2.5 py-1 bg-[#00b4d8] hover:bg-[#38bdf8] text-black font-pixel text-[8px] sm:text-[9px] rounded border border-black sm:border-2 pixel-btn flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>ROTAR</span>
          </button>

          {/* D-PAD DIRECTIONAL ARROWS (ACTIVE WHEN SHIP IS PLACED) */}
          <div className="flex items-center gap-0.5 bg-[#0f172a] p-0.5 rounded border border-black">
            <button
              type="button"
              disabled={!placedShip}
              onClick={() => handleMoveShip(-1, 0)}
              className="p-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-30 text-white rounded border border-black cursor-pointer"
              title="Mover Arriba"
            >
              <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
            <button
              type="button"
              disabled={!placedShip}
              onClick={() => handleMoveShip(1, 0)}
              className="p-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-30 text-white rounded border border-black cursor-pointer"
              title="Mover Abajo"
            >
              <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
            <button
              type="button"
              disabled={!placedShip}
              onClick={() => handleMoveShip(0, -1)}
              className="p-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-30 text-white rounded border border-black cursor-pointer"
              title="Mover Izquierda"
            >
              <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
            <button
              type="button"
              disabled={!placedShip}
              onClick={() => handleMoveShip(0, 1)}
              className="p-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-30 text-white rounded border border-black cursor-pointer"
              title="Mover Derecha"
            >
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. 16-BIT PIXEL PLACEMENT GRID */}
      <div className="w-full">
        <PixelBattlefield
          mode="placement"
          gridSize={gridSize}
          ships={ships}
          onPlaceShip={handleCellClick}
          theater={theater}
          placementPreview={
            selectedTemplate
              ? {
                  id: selectedTemplate.id,
                  size: selectedTemplate.size,
                  orientation,
                }
              : undefined
          }
        />
      </div>

      {/* 5. CONFIRM BATTLE BUTTON */}
      <div className="w-full">
        <button
          type="button"
          disabled={!allPlaced}
          onClick={() => {
            sound.playClick();
            onConfirmPlacement();
          }}
          className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-6 font-pixel text-[11px] sm:text-xs uppercase rounded-lg sm:rounded-xl border-2 sm:border-4 border-black pixel-box pixel-btn flex items-center justify-center gap-2 sm:gap-3 transition cursor-pointer ${
            allPlaced
              ? 'bg-[#10b981] hover:bg-[#34d399] text-black animate-pulse'
              : 'bg-[#334155] text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
          <span className="truncate">
            {allPlaced
              ? '★ ¡CONFIRMAR FLOTA Y PASAR AL COMBATE! ★'
              : `COLOCA TODOS LOS BARCOS (${ships.length}/${templates.length})`}
          </span>
        </button>
      </div>
    </div>
  );
};
