import React from 'react';
import { AIDifficulty, GridDimension, TheaterId } from '../types/game';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { Play, Shield, Compass, Cpu, BookOpen, Settings, Flame, Award } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenCampaign: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  theater: TheaterId;
  onSelectTheater: (theater: TheaterId) => void;
  gridSize: GridDimension;
  onSelectGridSize: (size: GridDimension) => void;
  difficulty: AIDifficulty;
  onSelectDifficulty: (diff: AIDifficulty) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  t: TranslationDict;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenCampaign,
  onOpenHowToPlay,
  onOpenSettings,
  theater,
  onSelectTheater,
  gridSize,
  onSelectGridSize,
  difficulty,
  onSelectDifficulty,
  t,
}) => {
  return (
    <div id="main-menu-view" className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 p-3 sm:p-6 animate-fade-in relative z-10">
      {/* HERO BANNER & CIRCULAR SECTOR BADGE */}
      <div className="text-center flex flex-col items-center gap-3 mt-2">
        <div className="w-14 h-14 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <span className="text-sm font-black font-mono text-cyan-400">SEC-1</span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            {t.appTitle}
          </h1>
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-cyan-700 font-bold font-mono mt-1">
            {t.appSubtitle} • AI TACTICAL COMBAT SUITE
          </p>
        </div>
      </div>

      {/* QUICK LAUNCH BAR */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {/* PRIMARY DEPLOY BUTTON */}
        <button
          id="main-menu-start-battle"
          type="button"
          onClick={() => {
            sound.playCannonFire();
            onStartGame();
          }}
          className="w-full py-4 px-6 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-black text-base sm:text-lg rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.35)] border border-cyan-300 flex items-center justify-center gap-3 transition-all cursor-pointer tracking-wider uppercase"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{t.quickBattle}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="main-menu-campaign"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenCampaign();
            }}
            className="py-3 px-4 bg-[#020c1b]/90 hover:bg-cyan-950/40 active:scale-95 border border-cyan-900/60 hover:border-cyan-500 rounded-lg text-cyan-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition tracking-wide uppercase font-mono"
          >
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{t.campaignMode}</span>
          </button>

          <button
            id="main-menu-how-to-play"
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            className="py-3 px-4 bg-[#020c1b]/90 hover:bg-cyan-950/40 active:scale-95 border border-cyan-900/60 hover:border-cyan-500 rounded-lg text-cyan-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition tracking-wide uppercase font-mono"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{t.howToPlay}</span>
          </button>
        </div>
      </div>

      {/* CUSTOMIZATION WORKBENCH: THEATER, GRID, DIFFICULTY */}
      <div className="w-full bg-[#020c1b]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-6">
        {/* 1. WAR THEATER SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            {t.selectTheater}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['pacific', 'atlantic', 'arctic', 'cyber'] as TheaterId[]).map(th => {
              const isSelected = theater === th;
              const title =
                th === 'pacific'
                  ? t.theaterPacific
                  : th === 'atlantic'
                  ? t.theaterAtlantic
                  : th === 'arctic'
                  ? t.theaterArctic
                  : t.theaterCyber;

              return (
                <button
                  key={th}
                  id={`theater-option-${th}`}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectTheater(th);
                  }}
                  className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-700 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold font-mono uppercase tracking-tight">{title}</span>
                  <span className="text-[10px] text-cyan-700 line-clamp-1 font-mono">
                    {th === 'pacific' ? 'CORAL REEF' : th === 'atlantic' ? 'STORM ABYSS' : th === 'arctic' ? 'GLACIAL' : 'CYBER MATRIX'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. GRID SIZE SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            {t.selectGrid}
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {([8, 10, 12] as GridDimension[]).map(size => {
              const isSelected = gridSize === size;
              const title = size === 8 ? t.gridBlitz : size === 10 ? t.gridClassic : t.gridArmada;

              return (
                <button
                  key={size}
                  id={`grid-option-${size}`}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectGridSize(size);
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-mono font-bold uppercase">{title}</div>
                  <div className="text-[10px] text-cyan-700 mt-0.5 font-mono">{size} x {size} SECTORS</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. AI DIFFICULTY SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            {t.selectDifficulty}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['recruit', 'veteran', 'admiral'] as AIDifficulty[]).map(diff => {
              const isSelected = difficulty === diff;
              const title = diff === 'recruit' ? t.recruit : diff === 'veteran' ? t.veteran : t.admiral;
              const desc = diff === 'recruit' ? t.recruitDesc : diff === 'veteran' ? t.veteranDesc : t.admiralDesc;

              return (
                <button
                  key={diff}
                  id={`diff-option-${diff}`}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectDifficulty(diff);
                  }}
                  className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? diff === 'admiral'
                        ? 'bg-red-950/70 border-red-500 ring-1 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-700 text-slate-300'
                  }`}
                >
                  <span className={`text-xs font-mono font-bold uppercase ${isSelected && diff === 'admiral' ? 'text-red-400' : 'text-cyan-300'}`}>
                    {title}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
