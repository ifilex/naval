import React from 'react';
import { LanguageCode } from '../../types/game';
import { TranslationDict } from '../../i18n/translations';
import { sound } from '../../services/soundEngine';
import { Maximize2, Minimize2, Volume2, VolumeX, Music, Settings, Award } from 'lucide-react';

interface PixelHeaderProps {
  score: number;
  aiIntegrity: number;
  playerIntegrity: number;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenCampaign: () => void;
  lang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  t: TranslationDict;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const QUICK_LANGS: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
  { code: 'pt', label: 'PT', flag: '🇵🇹' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳' },
  { code: 'ja', label: 'JA', flag: '🇯🇵' },
];

export const PixelHeader: React.FC<PixelHeaderProps> = ({
  score,
  aiIntegrity,
  playerIntegrity,
  isMusicPlaying,
  onToggleMusic,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenCampaign,
  lang,
  onSelectLang,
  t,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="relative z-30 w-full bg-[#0f172a] border-b-2 sm:border-b-4 border-black px-1.5 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between shadow-[0_2px_0_rgba(0,0,0,0.4)] text-white select-none shrink-0 font-silkscreen">
      {/* LEFT: 8-BIT RETRO ACCENT & TITLE */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Neon Cyan Pill */}
        <div className="w-2 h-6 sm:w-3 sm:h-7 bg-[#00b4d8] border border-black sm:border-2 rounded-xs shadow-[inset_1px_1px_0_#fff]" />
        
        <div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[9px] sm:text-xs font-pixel text-[#facc15] tracking-wider">
              ★ NAVAL PIXEL
            </span>
            <span className="bg-[#ff4d6d] text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.2 rounded-xs border border-black uppercase font-pixel tracking-wider shadow-xs">
              8-BIT
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] text-cyan-300 font-pixel hidden sm:inline-block">
            TACTICS ED.
          </span>
        </div>
      </div>

      {/* CENTER: RETRO 16-BIT TELEMETRY SCORE & HP HEARTS */}
      <div className="flex items-center gap-2 sm:gap-6">
        {/* SCORE COIN DISPLAY */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#020617] px-2 py-0.5 sm:px-2.5 sm:py-1 border border-black sm:border-2 rounded-md shadow-[inset_0_2px_0_rgba(0,0,0,0.5)]">
          <span className="text-[#facc15] font-pixel text-[10px] sm:text-xs animate-bounce">🪙</span>
          <div className="flex flex-col">
            <span className="text-[7px] sm:text-[8px] text-slate-400 font-pixel leading-none">PTS</span>
            <span className="font-pixel text-[10px] sm:text-xs text-[#fef08a] leading-tight">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* FLEET HP HEALTH BARS */}
        <div className="hidden md:flex items-center gap-4 bg-[#020617] px-3 py-1 border-2 border-black rounded-md">
          {/* PLAYER HP */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[8px] font-pixel text-[#38bdf8] mb-0.5">
              <span>TU FLOTA</span>
              <span>{playerIntegrity}%</span>
            </div>
            <div className="w-16 lg:w-20 h-2 bg-[#1e293b] border border-black rounded-sm overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${playerIntegrity}%` }}
              />
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800" />

          {/* AI HP */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[8px] font-pixel text-[#ff4d6d] mb-0.5">
              <span>IA ENEMIGA</span>
              <span>{aiIntegrity}%</span>
            </div>
            <div className="w-16 lg:w-20 h-2 bg-[#1e293b] border border-black rounded-sm overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                style={{ width: `${aiIntegrity}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: FULLSCREEN, SOUND & LANGUAGE CONTROLS */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* FULLSCREEN BUTTON */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleFullscreen();
          }}
          className="p-1 sm:px-2 sm:py-1 bg-[#1e293b] hover:bg-[#334155] active:translate-y-0.5 border border-black sm:border-2 rounded text-[#facc15] font-pixel text-[8px] sm:text-[9px] flex items-center gap-1 cursor-pointer pixel-btn"
          title="Pantalla Completa"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          <span className="hidden lg:inline">{isFullscreen ? 'VENTANA' : 'FULL'}</span>
        </button>

        {/* MUSIC CHIPTUNE TOGGLE */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMusic();
          }}
          className={`p-1 sm:px-2 sm:py-1 border border-black sm:border-2 rounded font-pixel text-[8px] sm:text-[9px] flex items-center gap-1 cursor-pointer pixel-btn ${
            isMusicPlaying
              ? 'bg-[#f59e0b] text-black'
              : 'bg-[#1e293b] text-slate-400 hover:bg-[#334155]'
          }`}
          title="Música 16-bit"
        >
          <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">{isMusicPlaying ? 'BGM ON' : 'BGM'}</span>
        </button>

        {/* SFX MUTE TOGGLE */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          className={`p-1 sm:px-2 sm:py-1 border border-black sm:border-2 rounded font-pixel text-[8px] sm:text-[9px] flex items-center gap-1 cursor-pointer pixel-btn ${
            !isMuted
              ? 'bg-[#10b981] text-black'
              : 'bg-[#1e293b] text-slate-400 hover:bg-[#334155]'
          }`}
          title="Sonido SFX"
        >
          {!isMuted ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
        </button>

        {/* LANGUAGE SELECTOR PILL */}
        <select
          value={lang}
          onChange={(e) => {
            sound.playClick();
            onSelectLang(e.target.value as LanguageCode);
          }}
          className="bg-[#020617] text-[#38bdf8] border border-black sm:border-2 rounded px-1 py-0.5 sm:px-1.5 sm:py-1 text-[8px] sm:text-[9px] font-pixel font-bold cursor-pointer"
        >
          {QUICK_LANGS.map(item => (
            <option key={item.code} value={item.code} className="bg-[#0f172a] text-white">
              {item.flag} {item.label}
            </option>
          ))}
        </select>

        {/* SETTINGS BUTTON */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="p-1 sm:p-1.5 bg-[#1e293b] hover:bg-[#334155] border border-black sm:border-2 rounded text-cyan-300 cursor-pointer pixel-btn"
          title="Ajustes"
        >
          <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </header>
  );
};
