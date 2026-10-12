import React from 'react';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { BookOpen, X, Crosshair, Shield, Flame, Anchor } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDict;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div id="how-to-play-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#020c1b] border border-cyan-500/30 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-white flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold uppercase text-sm sm:text-base">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2>{t.ruleTitle}</h2>
          </div>
          <button
            id="close-how-to-play-button"
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

        {/* 4 RULES LIST */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase text-cyan-300">{t.rule1Title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.rule1Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="p-2 rounded bg-red-500/10 text-red-400 border border-red-500/30 shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase text-red-300">{t.rule2Title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.rule2Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase text-amber-300">{t.rule3Title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.rule3Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/40">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase text-cyan-300">{t.rule4Title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.rule4Desc}</p>
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <button
          id="got-it-button"
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-mono font-bold uppercase rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition text-xs"
        >
          {t.gotIt}
        </button>
      </div>
    </div>
  );
};
