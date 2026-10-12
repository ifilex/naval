import React from 'react';
import { CampaignMission } from '../types/game';
import { TranslationDict } from '../i18n/translations';
import { sound } from '../services/soundEngine';
import { ArrowLeft, Star, Lock, Play, Compass, Award } from 'lucide-react';

interface CampaignMissionsProps {
  missions: CampaignMission[];
  onSelectMission: (mission: CampaignMission) => void;
  onBack: () => void;
  t: TranslationDict;
}

export const CampaignMissions: React.FC<CampaignMissionsProps> = ({
  missions,
  onSelectMission,
  onBack,
  t,
}) => {
  return (
    <div id="campaign-missions-view" className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-3 sm:p-4 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-[#020c1b]/90 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            id="campaign-back-button"
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="p-2 bg-cyan-950/40 hover:bg-cyan-900/40 active:scale-95 text-cyan-300 rounded-lg border border-cyan-800/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-cyan-400">{t.campaignMode}</h2>
            <p className="text-[10px] sm:text-xs text-cyan-700 font-mono uppercase tracking-wider">Tactical Campaign Mission Log</p>
          </div>
        </div>
      </div>

      {/* MISSIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missions.map(mission => {
          const isUnlocked = mission.unlocked;

          return (
            <div
              key={mission.id}
              id={`mission-card-${mission.id}`}
              className={`relative rounded-xl border p-4 flex flex-col justify-between gap-4 transition-all duration-200 ${
                isUnlocked
                  ? 'bg-[#020c1b]/90 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-[#020c1b]/60 border-cyan-950 opacity-50'
              }`}
            >
              <div>
                {/* TOP BADGES */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                    {t.mission} #{mission.id}
                  </span>

                  {/* STARS */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map(sIndex => (
                      <Star
                        key={sIndex}
                        className={`w-3.5 h-3.5 ${
                          sIndex <= mission.stars
                            ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                            : 'text-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* TITLE & DESCRIPTION */}
                <h3 className="font-bold font-mono text-sm sm:text-base uppercase tracking-tight text-cyan-200">{mission.nameKey}</h3>
                <p className="text-xs text-slate-400 mt-1">{mission.descKey}</p>

                {/* META INFO */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] font-mono text-cyan-300">
                  <span className="bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/60 flex items-center gap-1 uppercase">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    {mission.theater}
                  </span>
                  <span className="bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/60 uppercase">
                    {mission.gridSize}x{mission.gridSize} SECTORS
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border uppercase font-bold ${
                      mission.difficulty === 'admiral'
                        ? 'bg-red-950/50 text-red-400 border-red-800/40'
                        : mission.difficulty === 'veteran'
                        ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                        : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/40'
                    }`}
                  >
                    {mission.difficulty}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              {isUnlocked ? (
                <button
                  id={`start-mission-btn-${mission.id}`}
                  type="button"
                  onClick={() => {
                    sound.playCannonFire();
                    onSelectMission(mission);
                  }}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-bold font-mono rounded-lg flex items-center justify-center gap-2 text-xs uppercase shadow transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Deploy Mission</span>
                </button>
              ) : (
                <div className="w-full py-2.5 bg-slate-900/40 text-slate-600 font-mono font-semibold rounded-lg flex items-center justify-center gap-2 text-xs uppercase">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sector Locked</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
