import React, { useState } from 'react';
import { Coordinate, GridDimension, PlacedShip, ShipTemplate, TheaterId } from '../types/game';
import { isValidPlacement, generateRandomFleet } from '../services/aiEngine';
import { ShipVisual } from './ShipVisual';
import { Battlefield3D } from './3d/Battlefield3D';
import { sound } from '../services/soundEngine';
import {
  RotateCw,
  Shuffle,
  RotateCcw,
  Play,
  CheckCircle2,
  Shield,
  Crosshair,
  Trash2,
  Box,
  LayoutGrid,
  Anchor,
} from 'lucide-react';
import { TranslationDict } from '../i18n/translations';

interface PlacementPhaseProps {
  gridSize: GridDimension;
  templates: ShipTemplate[];
  ships: PlacedShip[];
  onShipsChange: (ships: PlacedShip[]) => void;
  onConfirmPlacement: () => void;
  t: TranslationDict;
  theater: TheaterId;
}

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const PlacementPhase: React.FC<PlacementPhaseProps> = ({
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
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const allPlaced = templates.length > 0 && templates.every(tmpl => ships.some(s => s.id === tmpl.id));

  const handleToggleRotate = () => {
    sound.playRotate();
    setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const handleRandomize = () => {
    sound.playClick();
    const randomized = generateRandomFleet(gridSize, templates);
    onShipsChange(randomized);
    setSelectedTemplateId(null);
  };

  const handleReset = () => {
    sound.playClick();
    onShipsChange([]);
    setSelectedTemplateId(templates[0]?.id || null);
  };

  const handleRemoveShip = (shipId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    const updated = ships.filter(s => s.id !== shipId);
    onShipsChange(updated);
    setSelectedTemplateId(shipId);
  };

  const handleCellClick = (r: number, c: number) => {
    // Check if user clicked on an already placed ship
    const clickedShip = ships.find(s => s.positions.some(p => p.r === r && p.c === c));

    // If no ship is selected to place, or if they clicked a placed ship that isn't the currently selected one
    if (clickedShip && (!selectedTemplate || clickedShip.id !== selectedTemplate.id)) {
      sound.playClick();
      setSelectedTemplateId(clickedShip.id);
      setOrientation(clickedShip.orientation);
      return;
    }

    if (!selectedTemplate) {
      if (clickedShip) {
        setSelectedTemplateId(clickedShip.id);
      }
      return;
    }

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

      // Select next unplaced template
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

  // Calculate preview coordinates for hover / touch
  const previewPositions: Coordinate[] = [];
  let isPreviewValid = false;
  if (hoverCoord && selectedTemplate) {
    isPreviewValid = isValidPlacement(
      selectedTemplate.size,
      hoverCoord,
      orientation,
      gridSize,
      ships,
      selectedTemplate.id
    );
    for (let i = 0; i < selectedTemplate.size; i++) {
      const curR = orientation === 'horizontal' ? hoverCoord.r : hoverCoord.r + i;
      const curC = orientation === 'horizontal' ? hoverCoord.c + i : hoverCoord.c;
      if (curR < gridSize && curC < gridSize) {
        previewPositions.push({ r: curR, c: curC });
      }
    }
  }

  return (
    <div id="placement-phase-container" className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4 p-2 sm:p-4">
      {/* COMMAND DEPLOYMENT BANNER */}
      <div className="w-full bg-[#020c1b]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Anchor className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-cyan-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              {t.placeYourFleet}
            </h2>
            <p className="text-[11px] text-cyan-600 font-mono">
              {allPlaced
                ? '✅ ¡Toda tu flota está lista para el combate naval!'
                : `Toca una casilla del tablero para posicionar tu ${((t as any)[selectedTemplate?.nameKey || ''] || selectedTemplate?.nameKey || 'navío')}`}
            </p>
          </div>
        </div>

        {/* QUICK CONTROL ACTIONS */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* 3D / 2D VIEW TOGGLE */}
          <div className="flex items-center bg-[#020c1b] p-1 rounded-lg border border-cyan-500/40">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setViewMode('3d');
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-cyan-400 hover:text-cyan-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D HOLOGRÁFICO</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setViewMode('2d');
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-cyan-400 hover:text-cyan-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>2D TÁCTICO</span>
            </button>
          </div>

          <button
            id="rotate-ship-button"
            type="button"
            onClick={handleToggleRotate}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 active:scale-95 border border-cyan-400/60 rounded-lg text-cyan-300 font-mono font-bold text-xs uppercase shadow transition-all cursor-pointer"
            title="Girar orientación de la nave (Horizontal / Vertical)"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.rotateShip}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40">
              {orientation === 'horizontal' ? '↔ HORIZ' : '↕ VERT'}
            </span>
          </button>

          <button
            id="random-fleet-button"
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/40 hover:bg-cyan-900/50 active:scale-95 border border-cyan-700/60 rounded-lg text-cyan-200 font-mono text-xs uppercase shadow transition-all cursor-pointer"
            title="Auto-ubicar toda la flota aleatoriamente"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.randomFleet}</span>
          </button>

          <button
            id="reset-fleet-button"
            type="button"
            onClick={handleReset}
            className="p-2 bg-[#020c1b] hover:bg-red-950/50 active:scale-95 border border-red-900/50 hover:border-red-500 rounded-lg text-slate-400 hover:text-red-400 shadow transition-all cursor-pointer"
            title={t.resetFleet}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: DOCK & GRID */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* DOCK: SHIPS LIST */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 bg-[#020c1b]/95 border border-cyan-500/30 rounded-xl p-3.5 shadow-2xl">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-900/50">
            <h3 className="text-xs font-bold uppercase text-cyan-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.unplacedShips}</span>
            </h3>
            <span className="font-mono text-xs font-bold text-cyan-300">
              {ships.length}/{templates.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {templates.map(tmpl => {
              const placedShip = ships.find(s => s.id === tmpl.id);
              const isPlaced = !!placedShip;
              const isSelected = selectedTemplateId === tmpl.id;
              const name = (t as any)[tmpl.nameKey] || tmpl.nameKey;

              return (
                <div
                  key={tmpl.id}
                  id={`fleet-item-${tmpl.id}`}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTemplateId(tmpl.id);
                    if (placedShip) {
                      setOrientation(placedShip.orientation);
                    }
                  }}
                  className={`w-full p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                      : isPlaced
                      ? 'bg-cyan-950/30 border-cyan-800/50 text-cyan-200 hover:border-cyan-600'
                      : 'bg-[#020c1b]/80 border-slate-800 text-slate-300 hover:border-cyan-700 hover:bg-cyan-950/20'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold font-mono text-xs uppercase">
                      {isPlaced ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-cyan-700/60 flex items-center justify-center shrink-0 text-[9px] text-cyan-500 font-bold">
                          {tmpl.size}
                        </div>
                      )}
                      <span className={isSelected ? 'text-cyan-300 font-black' : ''}>{name}</span>
                    </div>

                    {/* Visual Segment Dots */}
                    <div className="flex gap-1 items-center">
                      {Array.from({ length: tmpl.size }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-2 rounded-[2px] ${
                            isPlaced ? 'bg-cyan-500' : isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPlaced && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveShip(tmpl.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/50 rounded transition"
                        title="Quitar este barco del tablero"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="font-mono text-[10px] text-cyan-600 font-bold uppercase">
                      {tmpl.size} {tmpl.size === 1 ? 'CASILLA' : 'CASILLAS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* START BATTLE BUTTON */}
          <button
            id="start-battle-button"
            type="button"
            disabled={!allPlaced}
            onClick={() => {
              sound.playCannonFire();
              onConfirmPlacement();
            }}
            className={`w-full mt-2 py-3 px-4 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all duration-200 cursor-pointer ${
              allPlaced
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse'
                : 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{allPlaced ? `⚔️ ${t.startBattle}` : `UBICA TU FLOTA (${ships.length}/${templates.length})`}</span>
          </button>
        </div>

        {/* INTERACTIVE BATTLEFIELD PLACEMENT GRID (3D OR 2D) */}
        <div className="lg:col-span-8 bg-[#020c1b]/95 border border-cyan-500/30 rounded-xl p-2 sm:p-4 shadow-2xl flex flex-col items-center">
          {viewMode === '3d' ? (
            <div className="w-full flex flex-col gap-2">
              <Battlefield3D
                mode="placement"
                gridSize={gridSize}
                theater={theater}
                ships={ships}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                orientation={orientation}
                onPlaceShip={(r, c) => handleCellClick(r, c)}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                  Sector Marítimo ({gridSize}x{gridSize})
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-600">
                  <span>Orientación: <strong className="text-cyan-300">{orientation.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>Barco: <strong className="text-cyan-300">{selectedTemplate ? ((t as any)[selectedTemplate.nameKey] || selectedTemplate.nameKey) : 'Ninguno'}</strong></span>
                </div>
              </div>

              {/* COLUMN LABELS (1 to N) */}
              <div
                className="w-full grid gap-1 mb-1 items-center"
                style={{
                  gridTemplateColumns: `24px repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                <div className="w-6 text-center text-[10px] font-mono text-cyan-700 font-bold uppercase">#</div>
                {Array.from({ length: gridSize }).map((_, c) => (
                  <div key={c} className="text-center font-mono text-[10px] sm:text-xs font-bold text-cyan-400/90">
                    {c + 1}
                  </div>
                ))}
              </div>

              {/* GRID ROWS & CELLS */}
              <div className="w-full flex flex-col gap-1">
                {Array.from({ length: gridSize }).map((_, r) => (
                  <div
                    key={r}
                    className="grid gap-1 items-center"
                    style={{
                      gridTemplateColumns: `24px repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
                    {/* ROW LETTER (A to L) */}
                    <div className="w-6 text-center font-mono text-[10px] sm:text-xs font-bold text-cyan-500">
                      {ROW_LETTERS[r]}
                    </div>

                    {/* CELLS */}
                    {Array.from({ length: gridSize }).map((_, c) => {
                      const existingShip = ships.find(s => s.positions.some(p => p.r === r && p.c === c));
                      const isOrigin = existingShip?.origin.r === r && existingShip?.origin.c === c;
                      const isPreview = previewPositions.some(p => p.r === r && p.c === c);

                      return (
                        <button
                          key={c}
                          id={`place-cell-${r}-${c}`}
                          type="button"
                          onMouseEnter={() => setHoverCoord({ r, c })}
                          onMouseLeave={() => setHoverCoord(null)}
                          onClick={() => handleCellClick(r, c)}
                          className={`relative aspect-square rounded-[3px] border flex items-center justify-center transition-all cursor-pointer ${
                            isPreview
                              ? isPreviewValid
                                ? 'bg-cyan-500/40 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)] z-20'
                                : 'bg-red-500/40 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] z-20'
                              : existingShip
                              ? 'bg-slate-900/90 border-cyan-500/60'
                              : 'bg-[#020c1b]/60 border-cyan-900/40 hover:border-cyan-400 hover:bg-cyan-950/40'
                          }`}
                        >
                          {/* RENDER PLACED SHIP GRAPHIC */}
                          {existingShip && isOrigin && (
                            <div
                              className="absolute top-0 left-0 pointer-events-none z-10 p-0.5"
                              style={{
                                width: existingShip.orientation === 'horizontal' ? `${existingShip.size * 100}%` : '100%',
                                height: existingShip.orientation === 'vertical' ? `${existingShip.size * 100}%` : '100%',
                              }}
                            >
                              <ShipVisual
                                type={existingShip.id}
                                size={existingShip.size}
                                orientation={existingShip.orientation}
                                className="w-full h-full"
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
