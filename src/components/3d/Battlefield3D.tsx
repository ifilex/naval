import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BoardCell, Coordinate, GridDimension, PlacedShip, ShipTemplate, TheaterId } from '../../types/game';
import {
  createShip3DModel,
  createOceanGrid3D,
  createMissile3D,
  createTropicalEnvironment3D,
} from '../../services/threeShipBuilder';
import { sound } from '../../services/soundEngine';
import { CanvasSpriteOverlay, FloatingSpriteText } from './CanvasSpriteOverlay';
import {
  Camera,
  RotateCw,
  Crosshair,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

interface Battlefield3DProps {
  mode: 'placement' | 'battle';
  gridSize: GridDimension;
  // Battle mode props
  playerBoardCells?: BoardCell[][];
  aiBoardCells?: BoardCell[][];
  playerShips?: PlacedShip[];
  aiShips?: PlacedShip[];
  currentTurn?: 'player' | 'ai';
  onCellClick?: (coord: Coordinate) => void;
  lastTargetCoord?: Coordinate | null;
  // Placement mode props
  templates?: ShipTemplate[];
  ships?: PlacedShip[];
  selectedTemplateId?: string | null;
  orientation?: 'horizontal' | 'vertical';
  onPlaceShip?: (r: number, c: number) => void;
  theater: TheaterId;
}

export const Battlefield3D: React.FC<Battlefield3DProps> = ({
  mode,
  gridSize,
  playerBoardCells = [],
  aiBoardCells = [],
  playerShips = [],
  aiShips = [],
  currentTurn = 'player',
  onCellClick,
  lastTargetCoord,
  selectedTemplateId,
  orientation = 'horizontal',
  onPlaceShip,
  templates = [],
  ships = [],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'target' | 'fleet' | 'top'>('iso');
  const [hoveredCoord, setHoveredCoord] = useState<Coordinate | null>(null);
  const [hoveredScreenPos, setHoveredScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingSpriteText[]>([]);
  const [isAmbientAudioOn, setIsAmbientAudioOn] = useState<boolean>(true);

  // Scene state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mesh registries
  const targetGridMeshesRef = useRef<THREE.Mesh[][]>([]);
  const fleetGridMeshesRef = useRef<THREE.Mesh[][]>([]);
  const targetGridGroupRef = useRef<THREE.Group | null>(null);
  const fleetGridGroupRef = useRef<THREE.Group | null>(null);
  const shipsGroupRef = useRef<THREE.Group | null>(null);
  const effectsGroupRef = useRef<THREE.Group | null>(null);

  // Orbit controls state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraDistanceRef = useRef(32);
  const cameraSphericalRef = useRef({ theta: 0.8, phi: 1.0 });

  const cellSize = 1.8;
  const gridSpacing = gridSize * cellSize + 6;

  // Auto-start ambient ocean sound on mount
  useEffect(() => {
    sound.startOceanAmbient();
    return () => {
      sound.stopOceanAmbient();
    };
  }, []);

  // Initialize Three.js Scene with Vibrant Tropical Lighting & Environment
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Vivid Tropical Sky
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 400);
    cameraRef.current = camera;

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
    rendererRef.current = renderer;

    // 3. VIBRANT TROPICAL SUNLIGHTING
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.4); // Sunny Sky Fill Light
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2); // Warm Golden Sun
    sunLight.position.set(40, 60, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // Subtle Turquoise Water Bounce Light
    const oceanFillLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    oceanFillLight.position.set(-20, -10, -20);
    scene.add(oceanFillLight);

    // 4. ADD TROPICAL ISLAND ENVIRONMENT (Sunny Sky, Clouds, Island, Palms)
    const envGroup = createTropicalEnvironment3D();
    scene.add(envGroup);

    // 5. SHIP & EFFECT GROUPS
    const shipsGroup = new THREE.Group();
    scene.add(shipsGroup);
    shipsGroupRef.current = shipsGroup;

    const effectsGroup = new THREE.Group();
    scene.add(effectsGroup);
    effectsGroupRef.current = effectsGroup;

    // 6. ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating ocean wave bobbing for ships
      if (shipsGroupRef.current) {
        shipsGroupRef.current.children.forEach((shipMesh, idx) => {
          shipMesh.position.y = Math.sin(elapsedTime * 1.6 + idx * 0.8) * 0.08;
          shipMesh.rotation.z = Math.sin(elapsedTime * 1.3 + idx * 0.8) * 0.02;
          shipMesh.rotation.x = Math.cos(elapsedTime * 1.1 + idx * 0.8) * 0.01;
        });
      }

      // Animate active missile and flame effects
      if (effectsGroupRef.current) {
        effectsGroupRef.current.children.forEach(effect => {
          if (effect.userData.type === 'missile') {
            const { start, end, speed, onComplete } = effect.userData;
            effect.userData.progress += speed;
            const p = effect.userData.progress;

            if (p >= 1) {
              if (onComplete) onComplete();
              effectsGroupRef.current?.remove(effect);
            } else {
              const currentX = THREE.MathUtils.lerp(start.x, end.x, p);
              const currentZ = THREE.MathUtils.lerp(start.z, end.z, p);
              const arcHeight = 14 * Math.sin(p * Math.PI);
              const currentY = THREE.MathUtils.lerp(start.y, end.y, p) + arcHeight;

              effect.position.set(currentX, currentY, currentZ);
              effect.lookAt(end.x, end.y, end.z);
            }
          } else if (effect.userData.type === 'flame') {
            effect.rotation.y += 0.06;
            const scale = 1 + Math.sin(elapsedTime * 10) * 0.25;
            effect.scale.set(scale, scale * 1.3, scale);
          }
        });
      }

      // Update camera spherical position smoothly
      const theta = cameraSphericalRef.current.theta;
      const phi = cameraSphericalRef.current.phi;
      const dist = cameraDistanceRef.current;
      const target = cameraTargetRef.current;

      camera.position.x = target.x + dist * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + dist * Math.cos(phi);
      camera.position.z = target.z + dist * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      renderer.render(scene, camera);
    };

    animate();

    // 7. RESIZE OBSERVER
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
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

  // Update Boards & Ship Meshes when state changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean up old grids
    if (targetGridGroupRef.current) scene.remove(targetGridGroupRef.current);
    if (fleetGridGroupRef.current) scene.remove(fleetGridGroupRef.current);
    if (shipsGroupRef.current) {
      while (shipsGroupRef.current.children.length > 0) {
        shipsGroupRef.current.remove(shipsGroupRef.current.children[0]);
      }
    }
    if (effectsGroupRef.current) {
      while (effectsGroupRef.current.children.length > 0) {
        effectsGroupRef.current.remove(effectsGroupRef.current.children[0]);
      }
    }

    if (mode === 'placement') {
      // Single Central Placement Grid (Vibrant Tropical Turquoise Base)
      const { group, cellMeshes } = createOceanGrid3D(gridSize, cellSize, 0x06b6d4, 'P');
      group.position.set(0, 0, 0);
      scene.add(group);
      targetGridGroupRef.current = group;
      targetGridMeshesRef.current = cellMeshes;

      // Render placed ships on grid
      const halfDim = (gridSize * cellSize) / 2;
      ships.forEach(ship => {
        const shipModel = createShip3DModel(ship.id, ship.size, false, cellSize);
        const originX = -halfDim + ship.origin.c * cellSize + cellSize / 2;
        const originZ = -halfDim + ship.origin.r * cellSize + cellSize / 2;

        if (ship.orientation === 'horizontal') {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX + centerOffset, 0, originZ);
          shipModel.rotation.y = 0;
        } else {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX, 0, originZ + centerOffset);
          shipModel.rotation.y = Math.PI / 2;
        }
        shipsGroupRef.current?.add(shipModel);
      });
    } else {
      // Battle Mode: DUAL 3D TROPICAL GRIDS
      const targetGridOffset = gridSpacing / 2;
      const fleetGridOffset = -gridSpacing / 2;

      // 1. ENEMY TARGET GRID (Bright Red / Orange Border for Visibility)
      const targetGrid = createOceanGrid3D(gridSize, cellSize, 0xef4444, 'E');
      targetGrid.group.position.set(targetGridOffset, 0, 0);
      scene.add(targetGrid.group);
      targetGridGroupRef.current = targetGrid.group;
      targetGridMeshesRef.current = targetGrid.cellMeshes;

      // 2. PLAYER OWN FLEET GRID (Bright Cyan / Emerald Border)
      const fleetGrid = createOceanGrid3D(gridSize, cellSize, 0x10b981, 'F');
      fleetGrid.group.position.set(fleetGridOffset, 0, 0);
      scene.add(fleetGrid.group);
      fleetGridGroupRef.current = fleetGrid.group;
      fleetGridMeshesRef.current = fleetGrid.cellMeshes;

      const halfDim = (gridSize * cellSize) / 2;

      // Render Player Ships on Fleet Grid
      playerShips.forEach(ship => {
        const shipModel = createShip3DModel(ship.id, ship.size, ship.sunk, cellSize);
        const originX = fleetGridOffset - halfDim + ship.origin.c * cellSize + cellSize / 2;
        const originZ = -halfDim + ship.origin.r * cellSize + cellSize / 2;

        if (ship.orientation === 'horizontal') {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX + centerOffset, 0, originZ);
          shipModel.rotation.y = 0;
        } else {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX, 0, originZ + centerOffset);
          shipModel.rotation.y = Math.PI / 2;
        }
        shipsGroupRef.current?.add(shipModel);
      });

      // Render Sunken AI Ships on Target Grid
      aiShips.filter(s => s.sunk).forEach(ship => {
        const shipModel = createShip3DModel(ship.id, ship.size, true, cellSize);
        const originX = targetGridOffset - halfDim + ship.origin.c * cellSize + cellSize / 2;
        const originZ = -halfDim + ship.origin.r * cellSize + cellSize / 2;

        if (ship.orientation === 'horizontal') {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX + centerOffset, 0, originZ);
          shipModel.rotation.y = 0;
        } else {
          const centerOffset = ((ship.size - 1) * cellSize) / 2;
          shipModel.position.set(originX, 0, originZ + centerOffset);
          shipModel.rotation.y = Math.PI / 2;
        }
        shipsGroupRef.current?.add(shipModel);
      });

      // Apply Hit / Miss / Sunk Cell Visuals on Target Grid
      aiBoardCells.forEach(row => {
        row.forEach(cell => {
          const mesh = targetGrid.cellMeshes[cell.r]?.[cell.c];
          if (!mesh) return;

          if (cell.status === 'hit' || cell.status === 'sunk') {
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
            (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;

            // Spawn 3D Flame
            const flameGeo = new THREE.ConeGeometry(0.38, 1.1, 6);
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(targetGridOffset - halfDim + cell.c * cellSize + cellSize / 2, 0.55, -halfDim + cell.r * cellSize + cellSize / 2);
            flame.userData = { type: 'flame' };
            effectsGroupRef.current?.add(flame);
          } else if (cell.status === 'miss') {
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7);
            (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;

            // Spawn 3D Water Splash Ring
            const ringGeo = new THREE.RingGeometry(0.12, 0.5, 16);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(targetGridOffset - halfDim + cell.c * cellSize + cellSize / 2, 0.09, -halfDim + cell.r * cellSize + cellSize / 2);
            effectsGroupRef.current?.add(ring);
          }
        });
      });

      // Apply Player Board Hit / Miss Visuals
      playerBoardCells.forEach(row => {
        row.forEach(cell => {
          const mesh = fleetGrid.cellMeshes[cell.r]?.[cell.c];
          if (!mesh) return;

          if (cell.status === 'hit' || cell.status === 'sunk') {
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
            (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;

            const flameGeo = new THREE.ConeGeometry(0.35, 0.9, 6);
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(fleetGridOffset - halfDim + cell.c * cellSize + cellSize / 2, 0.5, -halfDim + cell.r * cellSize + cellSize / 2);
            flame.userData = { type: 'flame' };
            effectsGroupRef.current?.add(flame);
          } else if (cell.status === 'miss') {
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7);
          }
        });
      });
    }
  }, [mode, gridSize, playerBoardCells, aiBoardCells, playerShips, aiShips, ships]);

  // Set Camera Presets
  const applyCameraPreset = (preset: 'iso' | 'target' | 'fleet' | 'top') => {
    sound.playClick();
    setCameraPreset(preset);

    if (mode === 'placement') {
      if (preset === 'top') {
        cameraSphericalRef.current = { theta: 0, phi: 0.05 };
        cameraDistanceRef.current = 26;
      } else {
        cameraSphericalRef.current = { theta: 0.6, phi: 0.95 };
        cameraDistanceRef.current = 26;
      }
      cameraTargetRef.current.set(0, 0, 0);
    } else {
      if (preset === 'target') {
        cameraTargetRef.current.set(gridSpacing / 2, 0, 0);
        cameraSphericalRef.current = { theta: 0.35, phi: 0.88 };
        cameraDistanceRef.current = 22;
      } else if (preset === 'fleet') {
        cameraTargetRef.current.set(-gridSpacing / 2, 0, 0);
        cameraSphericalRef.current = { theta: -0.35, phi: 0.88 };
        cameraDistanceRef.current = 22;
      } else if (preset === 'top') {
        cameraTargetRef.current.set(0, 0, 0);
        cameraSphericalRef.current = { theta: 0, phi: 0.05 };
        cameraDistanceRef.current = 38;
      } else {
        // Isometric full view
        cameraTargetRef.current.set(0, 0, 0);
        cameraSphericalRef.current = { theta: 0.7, phi: 1.0 };
        cameraDistanceRef.current = 34;
      }
    }
  };

  // Launch 3D Ballistic Artillery Rocket
  const trigger3DMissileLaunch = (targetCoord: Coordinate, screenX: number, screenY: number) => {
    if (!sceneRef.current || !effectsGroupRef.current) return;

    sound.playCannonFire();

    const halfDim = (gridSize * cellSize) / 2;
    const startX = -gridSpacing / 2;
    const startZ = 0;
    const endX = gridSpacing / 2 - halfDim + targetCoord.c * cellSize + cellSize / 2;
    const endZ = -halfDim + targetCoord.r * cellSize + cellSize / 2;

    const missile = createMissile3D();
    missile.position.set(startX, 2, startZ);
    missile.userData = {
      type: 'missile',
      start: new THREE.Vector3(startX, 2, startZ),
      end: new THREE.Vector3(endX, 0.2, endZ),
      progress: 0,
      speed: 0.045,
      onComplete: () => {
        // Trigger Explosion Flash in 3D
        if (sceneRef.current) {
          const flashGeo = new THREE.SphereGeometry(1.4, 16, 16);
          const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.95 });
          const flash = new THREE.Mesh(flashGeo, flashMat);
          flash.position.set(endX, 0.9, endZ);
          sceneRef.current.add(flash);
          setTimeout(() => sceneRef.current?.remove(flash), 160);
        }

        // Spawn 2D Canvas Floating Damage Sprite
        const textId = 'sprite_' + Date.now();
        const newFloatingText: FloatingSpriteText = {
          id: textId,
          text: '💥 ¡FUEGO!',
          x: screenX,
          y: screenY - 20,
          color: '#fbbf24',
          size: 22,
          opacity: 1,
          vy: -1.5,
          life: 0,
          maxLife: 60,
        };

        setFloatingTexts(prev => [...prev, newFloatingText]);

        // Animate floating text
        const interval = setInterval(() => {
          setFloatingTexts(current =>
            current
              .map(item => {
                if (item.id === textId) {
                  return {
                    ...item,
                    y: item.y + item.vy,
                    opacity: 1 - item.life / item.maxLife,
                    life: item.life + 1,
                  };
                }
                return item;
              })
              .filter(item => item.life < item.maxLife)
          );
        }, 16);

        setTimeout(() => clearInterval(interval), 1100);
      },
    };

    effectsGroupRef.current.add(missile);
  };

  // Pointer Handlers for Raycasting & Orbit
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.006;
      cameraSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.006));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast on 3D grid
    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const activeMeshes = targetGridMeshesRef.current.flat();
    const intersects = raycaster.intersectObjects(activeMeshes);

    if (intersects.length > 0) {
      const cellMesh = intersects[0].object as THREE.Mesh;
      if (cellMesh.userData.r !== undefined) {
        setHoveredCoord({ r: cellMesh.userData.r, c: cellMesh.userData.c });
        setHoveredScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      setHoveredCoord(null);
      setHoveredScreenPos(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const distMoved = Math.hypot(
      e.clientX - previousMousePositionRef.current.x,
      e.clientY - previousMousePositionRef.current.y
    );

    if (distMoved < 8 && hoveredCoord && mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (mode === 'placement' && onPlaceShip) {
        onPlaceShip(hoveredCoord.r, hoveredCoord.c);
      } else if (mode === 'battle' && onCellClick && currentTurn === 'player') {
        trigger3DMissileLaunch(hoveredCoord, screenX, screenY);
        onCellClick(hoveredCoord);
      }
    }
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[600px] rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] select-none bg-[#38bdf8]">
      {/* 1. 3D OPENGL / THREE.JS CANVAS */}
      <div
        ref={mountRef}
        id="battlefield-3d-mount"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setHoveredCoord(null);
          setHoveredScreenPos(null);
        }}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* 2. 2D CANVAS SPRITE OVERLAY (Animated Crosshair, Damage Numbers, Radar Compass) */}
      <CanvasSpriteOverlay
        hoveredScreenPos={hoveredScreenPos}
        hoveredCoord={hoveredCoord}
        floatingTexts={floatingTexts}
        isLocked={currentTurn === 'player' && !!hoveredCoord}
      />

      {/* 3. FLOATING IN-GAME 3D HUD CONTROLS */}
      {/* TOP LEFT: ACTIVE PERSPECTIVE & AMBIENT CONTROLS */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-cyan-400/40 shadow-lg text-white">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
            {mode === 'placement' ? 'Despliegue 3D' : 'Combate 3D'}
          </span>
        </div>

        {/* AMBIENT SOUND TOGGLE (WAVES & BREEZE) */}
        <button
          type="button"
          onClick={() => {
            if (isAmbientAudioOn) {
              sound.stopOceanAmbient();
              setIsAmbientAudioOn(false);
            } else {
              sound.startOceanAmbient();
              setIsAmbientAudioOn(true);
            }
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold backdrop-blur-md border shadow transition cursor-pointer ${
            isAmbientAudioOn
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
          title="Sonido de ambiente oceánico (Olas y brisa)"
        >
          {isAmbientAudioOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{isAmbientAudioOn ? 'OLAS & BRISA ON' : 'AMBIENTE OFF'}</span>
        </button>
      </div>

      {/* BOTTOM LEFT: 3D CAMERA PRESET BUTTONS */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-400/40 shadow-xl">
        <button
          type="button"
          onClick={() => applyCameraPreset('iso')}
          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
            cameraPreset === 'iso'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
              : 'text-cyan-300 hover:text-white'
          }`}
        >
          3D ISOMÉTRICO
        </button>

        {mode === 'battle' && (
          <>
            <button
              type="button"
              onClick={() => applyCameraPreset('target')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                cameraPreset === 'target'
                  ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  : 'text-red-400 hover:text-white'
              }`}
            >
              SECTOR ENEMIGO
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('fleet')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                cameraPreset === 'fleet'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              MI FLOTA
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => applyCameraPreset('top')}
          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
            cameraPreset === 'top'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
              : 'text-cyan-300 hover:text-white'
          }`}
        >
          CÉNIT (TOP)
        </button>
      </div>

      {/* BOTTOM RIGHT: INTERACTIVE HINT */}
      <div className="absolute bottom-3 right-3 z-30 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-[11px] font-mono text-cyan-200">
        <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Arrastra para rotar 360° | Toca una casilla para disparar</span>
      </div>
    </div>
  );
};
