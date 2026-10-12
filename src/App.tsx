/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  GamePhase,
  LanguageCode,
  TheaterId,
  GridDimension,
  AIDifficulty,
  PlacedShip,
  BoardCell,
  Coordinate,
  MoveRecord,
  GameStats,
  CampaignMission,
  SoundSettings,
} from './types/game';
import { getTranslation, detectBrowserLanguage } from './i18n/translations';
import { sound } from './services/soundEngine';
import {
  getFleetTemplates,
  generateRandomFleet,
  getNextAIShot,
  calculateProbabilityHeatmap,
  evaluateCombatStats,
} from './services/aiEngine';
import { CAMPAIGN_MISSIONS } from './data/campaignMissions';

import { PixelHeader } from './components/pixel/PixelHeader';
import { PixelMenu } from './components/pixel/PixelMenu';
import { PixelPlacement } from './components/pixel/PixelPlacement';
import { PixelBattlefield } from './components/pixel/PixelBattlefield';
import { Battlefield3D } from './components/3d/Battlefield3D';
import { TacticalHUD } from './components/TacticalHUD';
import { PlayAnalysisModal } from './components/PlayAnalysisModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { CampaignMissions } from './components/CampaignMissions';
import { Box, LayoutGrid } from 'lucide-react';

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

export default function App() {
  // --- 1. LOCALIZATION & SETTINGS STATE ---
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('naval_lang');
    return (saved as LanguageCode) || detectBrowserLanguage();
  });

  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    masterVolume: 1,
    sfxVolume: 0.7,
    musicVolume: 0.35,
    muted: false,
    haptics: true,
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // --- 2. GAME CONFIGURATION STATE ---
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [theater, setTheater] = useState<TheaterId>('pacific');
  const [gridSize, setGridSize] = useState<GridDimension>(10);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('veteran');
  const [currentMission, setCurrentMission] = useState<CampaignMission | null>(null);

  // Campaign progression
  const [missions, setMissions] = useState<CampaignMission[]>(() => {
    const saved = localStorage.getItem('naval_campaign');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return CAMPAIGN_MISSIONS;
      }
    }
    return CAMPAIGN_MISSIONS;
  });

  // --- 3. BATTLEFIELD STATE ---
  const [playerShips, setPlayerShips] = useState<PlacedShip[]>([]);
  const [aiShips, setAiShips] = useState<PlacedShip[]>([]);

  // Board cells: [r][c]
  const [playerBoardCells, setPlayerBoardCells] = useState<BoardCell[][]>([]);
  const [aiBoardCells, setAiBoardCells] = useState<BoardCell[][]>([]);

  const [currentTurn, setCurrentTurn] = useState<'player' | 'ai'>('player');
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [lastPlayerTarget, setLastPlayerTarget] = useState<Coordinate | null>(null);
  const [lastAITarget, setLastAITarget] = useState<Coordinate | null>(null);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'target' | 'fleet' | 'both'>('target');

  const [gameStats, setGameStats] = useState<GameStats>({
    playerShots: 0,
    playerHits: 0,
    playerMisses: 0,
    playerSunken: 0,
    maxStreak: 0,
    currentStreak: 0,
    aiShots: 0,
    aiHits: 0,
    aiMisses: 0,
    aiSunken: 0,
    startTime: Date.now(),
    score: 0,
  });

  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [battleViewMode, setBattleViewMode] = useState<'pixel' | '3d'>('pixel');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Exit fullscreen failed', err);
        });
      }
    }
  };

  const t = getTranslation(lang);

  // Handle language change and persist
  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem('naval_lang', newLang);
  };

  // Toggle military music
  const handleToggleMusic = () => {
    const active = sound.toggleMusic();
    setIsMusicPlaying(active);
  };

  // Create initial empty board matrix
  const createEmptyBoard = useCallback((dimension: GridDimension): BoardCell[][] => {
    return Array.from({ length: dimension }, (_, r) =>
      Array.from({ length: dimension }, (_, c) => ({
        r,
        c,
        hasShip: false,
        status: 'empty',
      }))
    );
  }, []);

  // START PLACEMENT PHASE
  const handleStartQuickGame = () => {
    setCurrentMission(null);
    setPlayerShips([]);
    setGamePhase('placement');
  };

  const handleStartCampaignMission = (mission: CampaignMission) => {
    setCurrentMission(mission);
    setTheater(mission.theater);
    setGridSize(mission.gridSize);
    setDifficulty(mission.difficulty);
    setPlayerShips([]);
    setGamePhase('placement');
  };

  // START BATTLE ENGAGEMENT
  const handleConfirmPlacement = () => {
    // Generate AI fleet
    const templates = currentMission ? currentMission.fleetComposition : getFleetTemplates(gridSize);
    const enemyFleet = generateRandomFleet(gridSize, templates);
    setAiShips(enemyFleet);

    // Build fresh boards
    const pBoard = createEmptyBoard(gridSize);
    playerShips.forEach(ship => {
      ship.positions.forEach(p => {
        if (pBoard[p.r] && pBoard[p.r][p.c]) {
          pBoard[p.r][p.c].hasShip = true;
          pBoard[p.r][p.c].shipId = ship.id;
        }
      });
    });
    setPlayerBoardCells(pBoard);

    const aBoard = createEmptyBoard(gridSize);
    enemyFleet.forEach(ship => {
      ship.positions.forEach(p => {
        if (aBoard[p.r] && aBoard[p.r][p.c]) {
          aBoard[p.r][p.c].hasShip = true;
          aBoard[p.r][p.c].shipId = ship.id;
        }
      });
    });
    setAiBoardCells(aBoard);

    // Reset combat state
    setCurrentTurn('player');
    setMoveHistory([]);
    setLastPlayerTarget(null);
    setLastAITarget(null);
    setWinner(null);
    setGameStats({
      playerShots: 0,
      playerHits: 0,
      playerMisses: 0,
      playerSunken: 0,
      maxStreak: 0,
      currentStreak: 0,
      aiShots: 0,
      aiHits: 0,
      aiMisses: 0,
      aiSunken: 0,
      startTime: Date.now(),
      score: 0,
    });

    setGamePhase('battle');
  };

  // --- PLAYER FIRES SALVO AT ENEMY RADAR ---
  const handlePlayerFire = (coord: Coordinate) => {
    if (currentTurn !== 'player' || gamePhase !== 'battle' || winner) return;

    const cell = aiBoardCells[coord.r]?.[coord.c];
    if (!cell || cell.status !== 'empty') return;

    sound.playCannonFire();
    setLastPlayerTarget(coord);

    const isHit = cell.hasShip;
    const targetShip = isHit ? aiShips.find(s => s.positions.some(p => p.r === coord.r && p.c === coord.c)) : null;

    let updatedAiShips = [...aiShips];
    let isSunk = false;
    let shipNameKey: string | undefined = undefined;

    if (isHit && targetShip) {
      const newHits = targetShip.hits + 1;
      const shipSunk = newHits >= targetShip.size;
      isSunk = shipSunk;
      shipNameKey = targetShip.nameKey;

      updatedAiShips = updatedAiShips.map(s => {
        if (s.id === targetShip.id) {
          return { ...s, hits: newHits, sunk: shipSunk };
        }
        return s;
      });

      if (shipSunk) {
        sound.playShipSunkAlarm();
      } else {
        sound.playHitExplosion();
      }
    } else {
      sound.playWaterSplash();
    }

    // Update target grid cell status
    const updatedAiBoard = aiBoardCells.map(row => row.map(c => ({ ...c })));
    const newStatus = isSunk ? 'sunk' : isHit ? 'hit' : 'miss';
    updatedAiBoard[coord.r][coord.c].status = newStatus;

    // If ship sunk, mark all its cells as 'sunk'
    if (isSunk && targetShip) {
      targetShip.positions.forEach(p => {
        updatedAiBoard[p.r][p.c].status = 'sunk';
      });
    }

    setAiBoardCells(updatedAiBoard);
    setAiShips(updatedAiShips);

    // Update Stats & Streaks
    const newStreak = isHit ? gameStats.currentStreak + 1 : 0;
    const maxStreak = Math.max(gameStats.maxStreak, newStreak);
    const newHits = gameStats.playerHits + (isHit ? 1 : 0);
    const newMisses = gameStats.playerMisses + (isHit ? 0 : 1);
    const newSunken = gameStats.playerSunken + (isSunk ? 1 : 0);
    const totalShots = gameStats.playerShots + 1;

    setGameStats(prev => ({
      ...prev,
      playerShots: totalShots,
      playerHits: newHits,
      playerMisses: newMisses,
      playerSunken: newSunken,
      currentStreak: newStreak,
      maxStreak,
      score: prev.score + (isHit ? (isSunk ? 500 : 200) * (newStreak > 1 ? 1.5 : 1) : 0),
    }));

    // Record Move
    const record: MoveRecord = {
      shooter: 'player',
      coord,
      result: isSunk ? 'sunk' : isHit ? 'hit' : 'miss',
      shipNameKey,
      turn: moveHistory.length + 1,
      timestamp: Date.now(),
    };
    setMoveHistory(prev => [...prev, record]);

    // CHECK PLAYER VICTORY (all enemy ships destroyed)
    const allAiSunk = updatedAiShips.every(s => s.sunk);
    if (allAiSunk) {
      handleGameOver('player', updatedAiShips, playerShips);
      return;
    }

    // Pass turn to AI after slight delay for visual satisfaction
    setCurrentTurn('ai');
  };

  // --- AI TAKES ITS TURN ---
  useEffect(() => {
    if (currentTurn !== 'ai' || gamePhase !== 'battle' || winner) return;

    const timer = setTimeout(() => {
      // Build shot history dictionary for AI
      const aiShotsDict: { [key: string]: 'empty' | 'miss' | 'hit' | 'sunk' } = {};
      playerBoardCells.forEach(row => {
        row.forEach(cell => {
          if (cell.status !== 'empty') {
            aiShotsDict[`${cell.r},${cell.c}`] = cell.status;
          }
        });
      });

      const unsunkPlayerShips = playerShips.filter(s => !s.sunk);
      const aiCoord = getNextAIShot(gridSize, difficulty, aiShotsDict, unsunkPlayerShips);
      setLastAITarget(aiCoord);

      const cell = playerBoardCells[aiCoord.r]?.[aiCoord.c];
      if (!cell) return;

      const isHit = cell.hasShip;
      const targetShip = isHit ? playerShips.find(s => s.positions.some(p => p.r === aiCoord.r && p.c === aiCoord.c)) : null;

      let updatedPlayerShips = [...playerShips];
      let isSunk = false;
      let shipNameKey: string | undefined = undefined;

      if (isHit && targetShip) {
        const newHits = targetShip.hits + 1;
        const shipSunk = newHits >= targetShip.size;
        isSunk = shipSunk;
        shipNameKey = targetShip.nameKey;

        updatedPlayerShips = updatedPlayerShips.map(s => {
          if (s.id === targetShip.id) {
            return { ...s, hits: newHits, sunk: shipSunk };
          }
          return s;
        });

        if (shipSunk) {
          sound.playShipSunkAlarm();
        } else {
          sound.playHitExplosion();
        }
      } else {
        sound.playWaterSplash();
      }

      // Update player board cells
      const updatedPlayerBoard = playerBoardCells.map(row => row.map(c => ({ ...c })));
      const newStatus = isSunk ? 'sunk' : isHit ? 'hit' : 'miss';
      updatedPlayerBoard[aiCoord.r][aiCoord.c].status = newStatus;

      if (isSunk && targetShip) {
        targetShip.positions.forEach(p => {
          updatedPlayerBoard[p.r][p.c].status = 'sunk';
        });
      }

      setPlayerBoardCells(updatedPlayerBoard);
      setPlayerShips(updatedPlayerShips);

      // Record AI move
      const record: MoveRecord = {
        shooter: 'ai',
        coord: aiCoord,
        result: isSunk ? 'sunk' : isHit ? 'hit' : 'miss',
        shipNameKey,
        turn: moveHistory.length + 1,
        timestamp: Date.now(),
      };
      setMoveHistory(prev => [...prev, record]);

      setGameStats(prev => ({
        ...prev,
        aiShots: prev.aiShots + 1,
        aiHits: prev.aiHits + (isHit ? 1 : 0),
        aiMisses: prev.aiMisses + (isHit ? 0 : 1),
        aiSunken: prev.aiSunken + (isSunk ? 1 : 0),
      }));

      // CHECK AI VICTORY (all player ships destroyed)
      const allPlayerSunk = updatedPlayerShips.every(s => s.sunk);
      if (allPlayerSunk) {
        handleGameOver('ai', aiShips, updatedPlayerShips);
        return;
      }

      // Back to Player Turn
      setCurrentTurn('player');
    }, 700);

    return () => clearTimeout(timer);
  }, [currentTurn, gamePhase, winner, playerBoardCells, playerShips, gridSize, difficulty]);

  // --- GAME OVER HANDLER ---
  const handleGameOver = (
    wonBy: 'player' | 'ai',
    finalAiShips: PlacedShip[],
    finalPlayerShips: PlacedShip[]
  ) => {
    setWinner(wonBy);

    const evaluated = evaluateCombatStats(
      gameStats.playerHits,
      gameStats.playerShots,
      moveHistory.length,
      gridSize,
      difficulty,
      wonBy === 'player',
      gameStats.maxStreak
    );

    setGameStats(prev => ({
      ...prev,
      score: evaluated.score,
      grade: evaluated.grade,
      endTime: Date.now(),
    }));

    if (wonBy === 'player') {
      sound.playVictoryFanfare();
      // Victory confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#22d3ee', '#38bdf8', '#34d399', '#facc15'],
        });
      } catch (e) {}

      // If in campaign, unlock next mission & award stars
      if (currentMission) {
        const accuracy = Math.round((gameStats.playerHits / Math.max(1, gameStats.playerShots)) * 100);
        const stars = accuracy >= 50 ? 3 : accuracy >= 35 ? 2 : 1;

        const updatedMissions = missions.map(m => {
          if (m.id === currentMission.id) {
            return { ...m, stars: Math.max(m.stars, stars), bestScore: Math.max(m.bestScore || 0, evaluated.score) };
          }
          if (m.id === currentMission.id + 1) {
            return { ...m, unlocked: true };
          }
          return m;
        });

        setMissions(updatedMissions);
        localStorage.setItem('naval_campaign', JSON.stringify(updatedMissions));
      }
    } else {
      sound.playDefeat();
    }

    setGamePhase('gameover');
  };

  // Compute live heatmap on target grid for player tactical overlay
  const playerShotsDict: { [key: string]: 'empty' | 'miss' | 'hit' | 'sunk' } = {};
  aiBoardCells.forEach(row => {
    row.forEach(cell => {
      if (cell.status !== 'empty') {
        playerShotsDict[`${cell.r},${cell.c}`] = cell.status;
      }
    });
  });
  const unsunkAiShips = aiShips.filter(s => !s.sunk);
  const targetHeatmap = calculateProbabilityHeatmap(gridSize, playerShotsDict, unsunkAiShips);

  const regionName =
    theater === 'pacific'
      ? 'Pacific Coral Reef'
      : theater === 'atlantic'
      ? 'North Atlantic Abyss'
      : theater === 'arctic'
      ? 'Arctic Glacial Trench'
      : 'Cyber Tactical Grid';

  const aiSunkenCount = aiShips.filter(s => s.sunk).length;
  const aiIntegrity = Math.max(0, Math.round(((aiShips.length - aiSunkenCount) / Math.max(1, aiShips.length)) * 100));

  const playerSunkenCount = playerShips.filter(s => s.sunk).length;
  const playerIntegrity = Math.max(0, Math.round(((playerShips.length - playerSunkenCount) / Math.max(1, playerShips.length)) * 100));

  return (
    <div className="h-dvh w-screen bg-[#0284c7] text-white flex flex-col overflow-hidden select-none font-silkscreen">
      {/* 1. 8-BIT RETRO PIXEL HEADER */}
      <PixelHeader
        score={gameStats.score}
        aiIntegrity={aiIntegrity}
        playerIntegrity={playerIntegrity}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={handleToggleMusic}
        isMuted={soundSettings.muted}
        onToggleMute={() => {
          const next = !soundSettings.muted;
          sound.setMuted(next);
          setSoundSettings(s => ({ ...s, muted: next }));
          sound.playClick();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCampaign={() => setGamePhase('campaign')}
        lang={lang}
        onSelectLang={handleLanguageChange}
        t={t}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 2. MAIN PIXEL WORKSPACE (FULLSCREEN SCROLL-FREE VIEWPORT) */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 flex flex-col items-center justify-center overflow-y-auto">
        {/* A) PIXEL RETRO MAIN MENU */}
        {gamePhase === 'menu' && (
          <PixelMenu
            onStartGame={handleStartQuickGame}
            onOpenCampaign={() => setGamePhase('campaign')}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            theater={theater}
            onSelectTheater={setTheater}
            gridSize={gridSize}
            onSelectGridSize={setGridSize}
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            t={t}
          />
        )}

        {/* B) CAMPAIGN MISSIONS */}
        {gamePhase === 'campaign' && (
          <CampaignMissions
            missions={missions}
            onSelectMission={handleStartCampaignMission}
            onBack={() => setGamePhase('menu')}
            t={t}
          />
        )}

        {/* C) FLEET PLACEMENT PHASE */}
        {gamePhase === 'placement' && (
          <PixelPlacement
            gridSize={gridSize}
            templates={currentMission ? currentMission.fleetComposition : getFleetTemplates(gridSize)}
            ships={playerShips}
            onShipsChange={setPlayerShips}
            onConfirmPlacement={handleConfirmPlacement}
            t={t}
            theater={theater}
          />
        )}

        {/* D) ACTIVE BATTLE PHASE */}
        {(gamePhase === 'battle' || gamePhase === 'gameover') && (
          <div className="w-full flex flex-col gap-1.5 sm:gap-2.5 max-w-4xl mx-auto">
            {/* COMPACT BATTLE TOOLBAR */}
            {battleViewMode === 'pixel' ? (
              <div className="w-full bg-[#0f172a] border border-black sm:border-2 px-2 py-1 rounded-lg pixel-box flex items-center justify-between gap-1.5 text-white">
                {/* ACCURACY & STREAK INFO */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#020617] px-2 py-0.5 rounded border border-black text-[8px] sm:text-[9px] font-pixel text-[#38bdf8]">
                    <span>🎯 PUNTERÍA:</span>
                    <span className="text-[#fef08a] font-bold">
                      {gameStats.playerShots > 0 ? Math.round((gameStats.playerHits / gameStats.playerShots) * 100) : 0}%
                    </span>
                  </div>

                  {gameStats.currentStreak > 1 && (
                    <div className="hidden xs:flex items-center gap-1 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50 text-[8px] sm:text-[9px] font-pixel text-amber-300 animate-pulse">
                      <span>🔥 {gameStats.currentStreak}x</span>
                    </div>
                  )}
                </div>

                {/* CONTROLS (SONAR HEATMAP, 3D SWITCH, MENU) */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* SONAR HEATMAP */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowHeatmap(prev => !prev);
                    }}
                    className={`px-2 py-1 rounded border border-black text-[8px] sm:text-[9px] font-pixel transition cursor-pointer pixel-btn ${
                      showHeatmap
                        ? 'bg-[#00b4d8] text-black font-bold'
                        : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
                    }`}
                    title="Sonar de Probabilidad"
                  >
                    <span>{showHeatmap ? '👁️ SONAR ON' : '👁️ SONAR'}</span>
                  </button>

                  {/* 3D PERSPECTIVE SWITCH */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setBattleViewMode('3d');
                    }}
                    className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-cyan-300 rounded border border-black text-[8px] sm:text-[9px] font-pixel cursor-pointer pixel-btn"
                    title="Cambiar a Vista 3D"
                  >
                    <span>⚓ 3D</span>
                  </button>

                  {/* EXIT / SURRENDER */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setGamePhase('menu');
                    }}
                    className="p-1 sm:px-2 sm:py-1 bg-[#ef4444]/80 hover:bg-[#ef4444] text-white rounded border border-black text-[8px] sm:text-[9px] font-pixel cursor-pointer pixel-btn"
                    title="Volver al Menú"
                  >
                    <span className="hidden sm:inline">SALIR</span>
                    <span className="sm:hidden">✕</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TACTICAL HUD (FOR 3D MODE) */}
                <TacticalHUD
                  currentTurn={currentTurn}
                  playerShips={playerShips}
                  aiShips={aiShips}
                  stats={gameStats}
                  moves={moveHistory}
                  showHeatmap={showHeatmap}
                  onToggleHeatmap={() => setShowHeatmap(prev => !prev)}
                  mobileView={mobileView}
                  onSetMobileView={setMobileView}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onSurrender={() => setGamePhase('menu')}
                  t={t}
                />

                {/* PERSPECTIVE SWITCH BACK TO PIXEL */}
                <div className="w-full flex items-center justify-between bg-[#0f172a] border-2 border-black p-1.5 rounded-lg pixel-box text-white">
                  <span className="text-[9px] font-pixel text-[#facc15] uppercase">
                    VISTA ACTUAL: 3D OCEÁNICO
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setBattleViewMode('pixel');
                    }}
                    className="px-2.5 py-1 text-[9px] font-pixel rounded border border-black bg-[#facc15] text-black font-bold cursor-pointer pixel-btn"
                  >
                    ★ CAMBIAR A 8-BIT
                  </button>
                </div>
              </>
            )}

            {/* RENDER ACTIVE BATTLEFIELD */}
            {battleViewMode === 'pixel' ? (
              <PixelBattlefield
                mode="battle"
                gridSize={gridSize}
                playerBoardCells={playerBoardCells}
                aiBoardCells={aiBoardCells}
                playerShips={playerShips}
                aiShips={aiShips}
                currentTurn={currentTurn}
                onCellClick={handlePlayerFire}
                lastTargetCoord={lastPlayerTarget}
                theater={theater}
              />
            ) : (
              <Battlefield3D
                mode="battle"
                gridSize={gridSize}
                playerBoardCells={playerBoardCells}
                aiBoardCells={aiBoardCells}
                playerShips={playerShips}
                aiShips={aiShips}
                currentTurn={currentTurn}
                onCellClick={handlePlayerFire}
                lastTargetCoord={lastPlayerTarget}
                theater={theater}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. MODALS & OVERLAYS */}
      {/* POST-COMBAT PLAY ANALYSIS MODAL */}
      {gamePhase === 'gameover' && winner && (
        <PlayAnalysisModal
          stats={gameStats}
          moves={moveHistory}
          winner={winner}
          onPlayAgain={handleConfirmPlacement}
          onBackToMenu={() => setGamePhase('menu')}
          t={t}
          lang={lang}
          difficulty={difficulty}
          gridSize={gridSize}
          theater={theater}
          playerShips={playerShips}
          aiShips={aiShips}
        />
      )}

      {/* RULES / HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        t={t}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        soundSettings={soundSettings}
        onSoundSettingsChange={setSoundSettings}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={handleToggleMusic}
        t={t}
      />
    </div>
  );
}
