import React, { useEffect, useState } from 'react';
import { GameStats, MoveRecord, AIDifficulty, GridDimension, TheaterId, PlacedShip } from '../types/game';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { Award, Crosshair, Zap, RotateCcw, Home, Brain, TrendingUp } from 'lucide-react';

interface PlayAnalysisModalProps {
  stats: GameStats;
  moves: MoveRecord[];
  winner: 'player' | 'ai';
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  t: TranslationDict;
  lang: string;
  difficulty: AIDifficulty;
  gridSize: GridDimension;
  theater: TheaterId;
  playerShips: PlacedShip[];
  aiShips: PlacedShip[];
}

export const PlayAnalysisModal: React.FC<PlayAnalysisModalProps> = ({
  stats,
  moves,
  winner,
  onPlayAgain,
  onBackToMenu,
  t,
  lang,
  difficulty,
  theater,
}) => {
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(true);

  const accuracy = stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0;
  const aiAccuracy = stats.aiShots > 0 ? Math.round((stats.aiHits / stats.aiShots) * 100) : 0;

  useEffect(() => {
    let isMounted = true;
    const fetchAiAnalysis = async () => {
      setLoadingAi(true);
      try {
        const res = await fetch('/api/tactical-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lang,
            winner,
            turns: moves.length,
            accuracy,
            playerHits: stats.playerHits,
            playerMisses: stats.playerMisses,
            aiHits: stats.aiHits,
            aiMisses: stats.aiMisses,
            playerSunken: stats.playerSunken,
            aiSunken: stats.aiSunken,
            theater,
            difficulty,
          }),
        });
        const data = await res.json();
        if (isMounted) {
          if (data && data.analysis) {
            setGeminiAnalysis(data.analysis);
          } else {
            setGeminiAnalysis(t.aiAdvisorPlaceholder);
          }
        }
      } catch (err) {
        if (isMounted) {
          setGeminiAnalysis(t.aiAdvisorPlaceholder);
        }
      } finally {
        if (isMounted) setLoadingAi(false);
      }
    };

    fetchAiAnalysis();
    return () => {
      isMounted = false;
    };
  }, [lang, winner, stats, theater, difficulty]);

  return (
    <div id="play-analysis-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#020c1b] border border-cyan-500/30 rounded-xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl flex flex-col gap-6 text-white relative my-auto">
        {/* BANNER HEADER */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                winner === 'player'
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-mono text-cyan-400">
                {winner === 'player' ? t.victory : t.defeat}
              </h2>
              <p className="text-[11px] font-mono text-cyan-700 uppercase tracking-widest">
                {winner === 'player' ? t.victoryDesc : t.defeatDesc}
              </p>
            </div>
          </div>

          {/* EFFICIENCY GRADE BADGE */}
          <div className="flex flex-col items-center bg-cyan-950/40 px-4 py-2 rounded-lg border border-cyan-900/60">
            <span className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest">{t.efficiencyGrade}</span>
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                stats.grade === 'S'
                  ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                  : stats.grade === 'A'
                  ? 'text-cyan-400'
                  : stats.grade === 'B'
                  ? 'text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {stats.grade || 'A'}
            </span>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex flex-col">
            <span className="text-[10px] text-cyan-600 uppercase font-mono flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              {t.accuracy}
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1">{accuracy}%</span>
            <span className="text-[10px] text-cyan-800 font-mono">AI: {aiAccuracy}%</span>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex flex-col">
            <span className="text-[10px] text-cyan-600 uppercase font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              {t.streak}
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.maxStreak}</span>
            <span className="text-[10px] text-cyan-800 font-mono">CONSECUTIVE</span>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex flex-col">
            <span className="text-[10px] text-cyan-600 uppercase font-mono flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              {t.totalShots}
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.playerShots}</span>
            <span className="text-[10px] text-cyan-800 font-mono">{stats.playerHits} HIT / {stats.playerMisses} MISS</span>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex flex-col">
            <span className="text-[10px] text-cyan-600 uppercase font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              {t.score}
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.score.toLocaleString()}</span>
            <span className="text-[10px] text-cyan-800 font-mono">POINTS</span>
          </div>
        </div>

        {/* AI ADMIRALTY TACTICAL DEBRIEFING */}
        <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs font-mono">
            <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{t.aiAdvisor}</span>
            {loadingAi && <span className="text-[10px] text-cyan-700 font-mono">({t.analyzingTactics})</span>}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic font-sans">
            "{geminiAnalysis || t.aiAdvisorPlaceholder}"
          </p>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-3 border-t border-cyan-900/50 pt-4">
          <button
            id="modal-menu-button"
            type="button"
            onClick={() => {
              sound.playClick();
              onBackToMenu();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-950/30 hover:bg-cyan-900/40 active:scale-95 border border-cyan-900/60 rounded-lg text-cyan-300 text-xs font-bold uppercase font-mono transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{t.backToMenu}</span>
          </button>

          <button
            id="modal-play-again-button"
            type="button"
            onClick={() => {
              sound.playCannonFire();
              onPlayAgain();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black text-xs font-bold uppercase font-mono rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.playAgain}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
