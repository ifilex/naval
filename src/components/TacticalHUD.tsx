import React from 'react';
import { PlacedShip, MoveRecord, GameStats } from '../types/game';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { Shield, Crosshair, Zap, Eye, EyeOff, Radio, Settings, Home, Activity } from 'lucide-react';

interface TacticalHUDProps {
  currentTurn: 'player' | 'ai';
  playerShips: PlacedShip[];
  aiShips: PlacedShip[];
  stats: GameStats;
  moves: MoveRecord[];
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  mobileView: 'target' | 'fleet' | 'both';
  onSetMobileView: (view: 'target' | 'fleet' | 'both') => void;
  onOpenSettings: () => void;
  onSurrender: () => void;
  t: TranslationDict;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  currentTurn,
  playerShips,
  aiShips,
  stats,
  moves,
  showHeatmap,
  onToggleHeatmap,
  mobileView,
  onSetMobileView,
  onOpenSettings,
  onSurrender,
  t,
}) => {
  const accuracy = stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0;
  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  const playerSunkenCount = playerShips.filter(s => s.sunk).length;
  const aiSunkenCount = aiShips.filter(s => s.sunk).length;
  const aiIntegrity = Math.max(0, Math.round(((aiShips.length - aiSunkenCount) / Math.max(1, aiShips.length)) * 100));

  return (
    <div id="tactical-hud-container" className="w-full flex flex-col gap-3">
      {/* 1. TOP GEOMETRIC COMMAND STRIP */}
      <div className="w-full bg-[#020c1b]/90 border border-cyan-500/30 rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* TURN STATUS & RADAR SCAN */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 shrink-0">
            <div
              className={`w-3 h-3 rounded-full ${
                currentTurn === 'player' ? 'bg-cyan-400 animate-ping' : 'bg-red-500 animate-pulse'
              }`}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-cyan-400 flex items-center gap-2">
              <span>{currentTurn === 'player' ? t.yourTurn : t.aiTurn}</span>
              {currentTurn === 'player' && (
                <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  WEAPONS FREE
                </span>
              )}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-cyan-700 font-bold">
              {currentTurn === 'player' ? 'Select Sector to Fire Salvo' : t.aiThinking}
            </p>
          </div>
        </div>

        {/* METRICS & QUICK CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* ACCURACY BADGE */}
          <div className="flex flex-col items-center px-2.5 py-1 rounded border border-cyan-900/60 bg-cyan-950/30">
            <span className="text-[9px] uppercase tracking-widest text-cyan-600 font-mono">Accuracy</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-cyan-200">{accuracy}%</span>
          </div>

          {/* AI INTEGRITY */}
          <div className="flex flex-col items-center px-2.5 py-1 rounded border border-red-900/50 bg-red-950/20">
            <span className="text-[9px] uppercase tracking-widest text-red-700 font-mono">AI Fleet</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-red-400">{aiIntegrity}%</span>
          </div>

          {/* STREAK */}
          {stats.currentStreak > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-950/80 border border-amber-500/50 rounded font-mono text-xs text-amber-300 animate-pulse">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{stats.currentStreak}x</span>
            </div>
          )}

          {/* SONAR / HEATMAP TOGGLE */}
          <button
            id="hud-toggle-heatmap"
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleHeatmap();
            }}
            className={`px-3 py-1.5 rounded border text-[10px] uppercase font-bold tracking-wider transition flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'border-cyan-800 text-cyan-400 hover:border-cyan-500 bg-cyan-950/30'
            }`}
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showHeatmap ? t.hideHeatmap : t.showHeatmap}</span>
          </button>

          {/* SETTINGS */}
          <button
            id="hud-settings-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2 border border-cyan-900/60 rounded bg-cyan-950/20 hover:border-cyan-500 text-cyan-400 transition"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* ABORT / SURRENDER */}
          <button
            id="hud-surrender-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              onSurrender();
            }}
            className="p-2 border border-red-900/50 rounded bg-red-950/20 hover:border-red-500 text-red-400 transition"
            title={t.backToMenu}
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FLEET HEALTH DOT PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* PLAYER FLEET */}
        <div className="bg-[#020c1b]/80 border border-cyan-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2">
              {t.yourFleet} ({playerShips.length - playerSunkenCount}/{playerShips.length})
            </h3>
            <span className="text-[10px] font-mono text-cyan-700 uppercase">Command Squad</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {playerShips.map(s => {
              const name = (t as any)[s.nameKey] || s.nameKey;
              return (
                <div
                  key={s.id}
                  className={`p-2 border rounded transition ${
                    s.sunk
                      ? 'border-red-900/50 bg-red-900/10'
                      : s.hits > 0
                      ? 'border-amber-900/60 bg-amber-900/10'
                      : 'border-cyan-900/40 bg-cyan-900/10'
                  }`}
                >
                  <div className="flex gap-1 mb-1 items-center">
                    {Array.from({ length: s.size }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          s.sunk
                            ? 'bg-red-800'
                            : idx < s.hits
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-cyan-500'
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-[9px] uppercase font-bold tracking-wider truncate ${
                      s.sunk ? 'text-red-600 line-through' : 'text-cyan-400'
                    }`}
                  >
                    {name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ENEMY FLEET */}
        <div className="bg-[#020c1b]/80 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-red-500 border-l-4 border-red-500 pl-2">
              {t.enemyFleet} ({aiShips.length - aiSunkenCount}/{aiShips.length})
            </h3>
            <span className="text-[10px] font-mono text-red-800 uppercase">Hostile Target</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {aiShips.map(s => {
              const name = (t as any)[s.nameKey] || s.nameKey;
              return (
                <div
                  key={s.id}
                  className={`p-2 border rounded transition ${
                    s.sunk
                      ? 'border-red-900/50 bg-red-900/20'
                      : 'border-slate-800 bg-slate-900/30'
                  }`}
                >
                  <div className="flex gap-1 mb-1 items-center">
                    {Array.from({ length: s.size }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          s.sunk ? 'bg-red-600' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-[9px] uppercase font-bold tracking-wider truncate ${
                      s.sunk ? 'text-red-500 font-black' : 'text-slate-400'
                    }`}
                  >
                    {s.sunk ? `${name} (HUNDIDO)` : name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TELEMETRY STRIP */}
      <div className="border border-cyan-900/40 rounded-lg bg-blue-950/15 p-2.5 sm:p-3 flex items-center justify-around overflow-hidden relative shadow-inner">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,255,0.15)_50%,transparent_100%)] animate-pulse" />
        </div>

        {/* LAST ACTION */}
        <div className="text-center">
          <div className="text-[10px] font-mono text-cyan-600 uppercase mb-0.5">Last Action</div>
          <div className="text-xs sm:text-sm text-white font-bold font-mono truncate max-w-[140px] sm:max-w-none">
            {lastMove
              ? `${lastMove.shooter === 'player' ? 'YOU' : 'AI'}: ${lastMove.result.toUpperCase()} AT ${String.fromCharCode(
                  65 + lastMove.coord.r
                )}${lastMove.coord.c + 1}`
              : 'INITIALIZING RADAR'}
          </div>
        </div>

        <div className="h-7 w-px bg-cyan-900/50" />

        {/* STATUS */}
        <div className="text-center">
          <div className="text-[10px] font-mono text-cyan-600 uppercase mb-0.5">Status</div>
          <div className="text-xs sm:text-sm text-green-400 font-bold font-mono flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            <span>{currentTurn === 'player' ? 'TARGET LOCK' : 'DEFENSE ALERT'}</span>
          </div>
        </div>

        <div className="h-7 w-px bg-cyan-900/50" />

        {/* COORDINATES / SCORE */}
        <div className="text-center">
          <div className="text-[10px] font-mono text-cyan-600 uppercase mb-0.5">Combat Score</div>
          <div className="text-xs sm:text-sm text-cyan-100 font-bold font-mono">
            {stats.score.toLocaleString()} PTS
          </div>
        </div>
      </div>

      {/* 4. MOBILE VIEW SWITCHER */}
      <div className="flex md:hidden items-center justify-center gap-2 bg-[#020c1b]/90 p-1 rounded-lg border border-cyan-900/50">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSetMobileView('target');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded uppercase transition ${
            mobileView === 'target'
              ? 'bg-cyan-500 text-black shadow'
              : 'bg-slate-900/80 text-slate-400'
          }`}
        >
          {t.targetGrid}
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSetMobileView('fleet');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded uppercase transition ${
            mobileView === 'fleet'
              ? 'bg-cyan-500 text-black shadow'
              : 'bg-slate-900/80 text-slate-400'
          }`}
        >
          {t.fleetGrid}
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSetMobileView('both');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded uppercase transition ${
            mobileView === 'both'
              ? 'bg-cyan-500 text-black shadow'
              : 'bg-slate-900/80 text-slate-400'
          }`}
        >
          {t.bothGrids}
        </button>
      </div>
    </div>
  );
};
