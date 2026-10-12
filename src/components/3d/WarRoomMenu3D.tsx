import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AIDifficulty, GridDimension, TheaterId } from '../../types/game';
import { TranslationDict } from '../../i18n/translations';
import { sound } from '../../services/soundEngine';
import { createShip3DModel, createTropicalEnvironment3D } from '../../services/threeShipBuilder';
import { Play, Award, BookOpen, Settings, Compass, Shield, Cpu, Volume2, Music, Sparkles } from 'lucide-react';

interface WarRoomMenu3DProps {
  onStartGame: () => void;
  onOpenCampaign: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  theater: TheaterId;
  onSelectTheater: (t: TheaterId) => void;
  gridSize: GridDimension;
  onSelectGridSize: (s: GridDimension) => void;
  difficulty: AIDifficulty;
  onSelectDifficulty: (d: AIDifficulty) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  t: TranslationDict;
}

export const WarRoomMenu3D: React.FC<WarRoomMenu3DProps> = ({
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
  isMusicPlaying,
  onToggleMusic,
  t,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. SCENE & CAMERA (Vivid Tropical Day Atmosphere)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Sky blue
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 14, 24);
    camera.lookAt(0, 1, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. VIBRANT SUNNY LIGHTING
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 4. ADD TROPICAL ISLANDS & CLOUDS
    const env = createTropicalEnvironment3D();
    scene.add(env);

    // 5. TURQUOISE WATER PLATFORM WITH RADAR CONCENTRIC RINGS
    const waterGeo = new THREE.CylinderGeometry(14, 15, 0.6, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Tropical Blue
      roughness: 0.15,
      metalness: 0.8,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.3, 0);
    scene.add(waterMesh);

    // Luminous Gold & Cyan Radar Rings
    for (let r = 3; r <= 12; r += 3) {
      const ringGeo = new THREE.RingGeometry(r - 0.06, r + 0.06, 64);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.03, 0);
      scene.add(ring);
    }

    // Rotating Sonar Radar Sweep Beam
    const sweepGeo = new THREE.ConeGeometry(13.5, 0.05, 32, 1, false, 0, Math.PI / 3);
    sweepGeo.rotateX(Math.PI / 2);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.set(0, 0.05, 0);
    scene.add(sweepMesh);

    // 6. 3D WAR FLEET FORMATION IN MOTION
    const fleetGroup = new THREE.Group();
    scene.add(fleetGroup);

    const carrier = createShip3DModel('carrier', 5, false, 1.1);
    carrier.position.set(0, 0.15, 0);
    fleetGroup.add(carrier);

    const battleship = createShip3DModel('battleship', 4, false, 1.0);
    battleship.position.set(5.5, 0.15, 3);
    battleship.rotation.y = -Math.PI / 4;
    fleetGroup.add(battleship);

    const cruiser = createShip3DModel('cruiser', 3, false, 1.0);
    cruiser.position.set(-5.5, 0.15, -3);
    cruiser.rotation.y = Math.PI * 0.75;
    fleetGroup.add(cruiser);

    const destroyer = createShip3DModel('destroyer', 2, false, 1.0);
    destroyer.position.set(-4.5, 0.15, 4.5);
    destroyer.rotation.y = -Math.PI * 0.6;
    fleetGroup.add(destroyer);

    // 7. ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate radar sweep
      sweepMesh.rotation.z = -elapsedTime * 1.5;

      // Slow orbit camera effect
      camera.position.x = Math.sin(elapsedTime * 0.15) * 6;
      camera.position.z = 24 + Math.cos(elapsedTime * 0.15) * 3;
      camera.lookAt(0, 1, 0);

      // Ship gentle wave bobbing
      fleetGroup.children.forEach((ship, idx) => {
        ship.position.y = 0.15 + Math.sin(elapsedTime * 1.8 + idx * 1.2) * 0.12;
        ship.rotation.z = Math.sin(elapsedTime * 1.4 + idx * 1.2) * 0.03;
      });

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-5 items-center">
      {/* 3D SCENIC HERO VIEWPORT */}
      <div className="relative w-full h-[280px] sm:h-[360px] rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] bg-[#38bdf8]">
        <div ref={mountRef} className="w-full h-full" />

        {/* OVERLAID BRAND TITLE & SUBTITLE */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-400/40 shadow-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 uppercase">
              NAVAL WARFARE 3D
            </h1>
          </div>
          <p className="text-[11px] font-mono text-cyan-200 font-bold">
            Simulador de Batalla Naval Táctica en Tiempo Real
          </p>
        </div>

        {/* MUSIC TOGGLE BUTTON OVERLAY */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMusic();
          }}
          className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold backdrop-blur-md border shadow transition cursor-pointer ${
            isMusicPlaying
              ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-slate-900/85 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>{isMusicPlaying ? 'MÚSICA ACTIVA' : 'ACTIVAR MÚSICA'}</span>
        </button>
      </div>

      {/* QUICK GAME CONFIGURATION PANEL (VIBRANT HIGH-CONTRAST CARDS) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. SECTOR DE GUERRA */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 shadow-xl flex flex-col gap-2">
          <label className="text-xs font-bold font-mono text-cyan-300 uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Teatro de Operaciones</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'pacific', label: 'Pacífico', icon: '🌊' },
              { id: 'atlantic', label: 'Atlántico', icon: '⚡' },
              { id: 'arctic', label: 'Ártico', icon: '❄️' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectTheater(item.id as TheaterId);
                }}
                className={`py-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center gap-1 transition cursor-pointer border ${
                  theater === item.id
                    ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'bg-slate-800/80 text-cyan-200 border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. TAMAÑO DE CUADRÍCULA */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 shadow-xl flex flex-col gap-2">
          <label className="text-xs font-bold font-mono text-cyan-300 uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tamaño de Cuadrícula</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { size: 8, label: '8x8', desc: 'Rápido' },
              { size: 10, label: '10x10', desc: 'Estándar' },
              { size: 12, label: '12x12', desc: 'Épico' },
            ].map(item => (
              <button
                key={item.size}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectGridSize(item.size as GridDimension);
                }}
                className={`py-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center transition cursor-pointer border ${
                  gridSize === item.size
                    ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'bg-slate-800/80 text-cyan-200 border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                <span className="text-sm">{item.label}</span>
                <span className="text-[9px] opacity-80">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. NIVEL DE INTELIGENCIA ARTIFICIAL */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 shadow-xl flex flex-col gap-2">
          <label className="text-xs font-bold font-mono text-cyan-300 uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nivel de IA Enemiga</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'cadet', label: 'Cadete', color: 'emerald' },
              { id: 'veteran', label: 'Veterano', color: 'cyan' },
              { id: 'admiral', label: 'Almirante', color: 'red' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectDifficulty(item.id as AIDifficulty);
                }}
                className={`py-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center transition cursor-pointer border ${
                  difficulty === item.id
                    ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-800/80 text-amber-200 border-slate-700 hover:border-amber-500/50'
                }`}
              >
                <span className="text-sm">★</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRIMARY ACTION BUTTONS (LARGE, VIBRANT, TOUCH-FRIENDLY) */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        {/* START 3D BATTLE BUTTON */}
        <button
          id="start-game-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onStartGame();
          }}
          className="flex-1 w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.98] text-slate-950 font-black font-mono text-base uppercase rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2.5 transition cursor-pointer border-2 border-emerald-300"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>INICIAR DESPLIEGUE Y COMBATE 3D</span>
        </button>

        {/* CAMPAIGN MODE BUTTON */}
        <button
          id="campaign-mode-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenCampaign();
          }}
          className="w-full sm:w-auto py-4 px-6 bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-400/60 rounded-xl text-amber-300 font-mono font-bold text-sm uppercase shadow-lg flex items-center justify-center gap-2 transition cursor-pointer hover:border-amber-400"
        >
          <Award className="w-5 h-5 text-amber-400" />
          <span>MODO CAMPAÑA</span>
        </button>

        {/* HOW TO PLAY BUTTON */}
        <button
          id="how-to-play-menu-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenHowToPlay();
          }}
          className="w-full sm:w-auto py-4 px-5 bg-slate-900/90 hover:bg-slate-800 border-2 border-cyan-500/40 rounded-xl text-cyan-300 font-mono font-bold text-sm uppercase shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>CÓMO JUGAR</span>
        </button>
      </div>
    </div>
  );
};
