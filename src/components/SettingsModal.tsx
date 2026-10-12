import React from 'react';
import { LanguageCode, SoundSettings } from '../types/game';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { Settings, X, Volume2, VolumeX, Music, Globe, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  soundSettings: SoundSettings;
  onSoundSettingsChange: (settings: SoundSettings) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  t: TranslationDict;
}

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
  { code: 'ru', label: 'Русский', flag: 'RU' },
  { code: 'zh', label: '中文', flag: 'ZH' },
  { code: 'ja', label: '日本語', flag: 'JA' },
  { code: 'pt', label: 'Português', flag: 'PT' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  soundSettings,
  onSoundSettingsChange,
  isMusicPlaying,
  onToggleMusic,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#020c1b] border border-cyan-500/30 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-white flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold uppercase text-sm sm:text-base">
            <Settings className="w-4 h-4" />
            <h2>{t.settings}</h2>
          </div>
          <button
            id="close-settings-button"
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-cyan-950/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. LANGUAGE SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2 flex items-center gap-1.5 font-mono">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            {t.language}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(item => (
              <button
                key={item.code}
                id={`lang-select-${item.code}`}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onLanguageChange(item.code);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-mono font-bold uppercase transition ${
                  lang === item.code
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-cyan-950/20 border-cyan-900/40 text-slate-300 hover:border-cyan-700'
                }`}
              >
                <span className="text-[10px] px-1 py-0.5 bg-cyan-950 border border-cyan-800 rounded text-cyan-400 font-bold">{item.flag}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. AUDIO CONTROLS */}
        <div className="flex flex-col gap-3 border-t border-cyan-900/50 pt-4">
          <h3 className="text-xs font-bold uppercase text-cyan-500 border-l-4 border-cyan-500 pl-2 flex items-center gap-1.5 font-mono">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            {t.soundEffects} & {t.soundMusic}
          </h3>

          {/* MILITARY MUSIC TOGGLE */}
          <div className="flex items-center justify-between bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase">{t.soundMusic}</span>
            </div>
            <button
              id="settings-toggle-music"
              type="button"
              onClick={() => {
                sound.playClick();
                onToggleMusic();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                isMusicPlaying
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/60 text-slate-400 border border-cyan-900/60'
              }`}
            >
              {isMusicPlaying ? t.musicOn : t.musicOff}
            </button>
          </div>

          {/* SOUND SFX TOGGLE */}
          <div className="flex items-center justify-between bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="flex items-center gap-2">
              {soundSettings.muted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-xs font-mono font-bold uppercase">{t.soundEffects}</span>
            </div>
            <button
              id="settings-toggle-sfx"
              type="button"
              onClick={() => {
                const nextMuted = !soundSettings.muted;
                sound.setMuted(nextMuted);
                onSoundSettingsChange({ ...soundSettings, muted: nextMuted });
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                !soundSettings.muted
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/60 text-slate-400 border border-cyan-900/60'
              }`}
            >
              {!soundSettings.muted ? t.soundOn : t.soundOff}
            </button>
          </div>

          {/* HAPTIC TOUCH FEEDBACK */}
          <div className="flex items-center justify-between bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase">{t.hapticFeedback}</span>
            </div>
            <button
              id="settings-toggle-haptics"
              type="button"
              onClick={() => {
                const nextHaptics = !soundSettings.haptics;
                sound.setHaptics(nextHaptics);
                onSoundSettingsChange({ ...soundSettings, haptics: nextHaptics });
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                soundSettings.haptics
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/60 text-slate-400 border border-cyan-900/60'
              }`}
            >
              {soundSettings.haptics ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          id="save-settings-button"
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-mono font-bold uppercase rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition text-xs"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
