import * as THREE from 'three';

/**
 * Procedural 3D Naval Asset Builder using Three.js / WebGL
 * Real-world vivid tropical lighting, realistic naval warships,
 * tropical islands with palm trees & lighthouse, sunny skybox, and particle VFX.
 */

// VIVID NAVAL WARSHIP MATERIALS (High Visibility, Crisp Military Steel)
const shipHullMaterial = new THREE.MeshStandardMaterial({
  color: 0x475569, // Slate 600 Naval Steel
  roughness: 0.35,
  metalness: 0.65,
});

const shipDeckMaterial = new THREE.MeshStandardMaterial({
  color: 0x334155, // Slate 700 Dark Non-Skid Deck
  roughness: 0.5,
  metalness: 0.3,
});

const shipWhiteMarkings = new THREE.MeshStandardMaterial({
  color: 0xf8fafc, // Pure Crisp White Deck Striping
  roughness: 0.3,
  metalness: 0.1,
  emissive: 0xffffff,
  emissiveIntensity: 0.25,
});

const shipBrassGuns = new THREE.MeshStandardMaterial({
  color: 0xf59e0b, // Golden Brass Gun Barrels
  roughness: 0.25,
  metalness: 0.9,
});

const shipLifeRaftOrange = new THREE.MeshStandardMaterial({
  color: 0xf97316, // High-Vis Safety Orange
  roughness: 0.4,
  metalness: 0.1,
  emissive: 0xf97316,
  emissiveIntensity: 0.2,
});

const shipSunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x1c1917, // Charred Blackened Wreck
  roughness: 0.9,
  metalness: 0.1,
});

const runwayStripeMaterial = new THREE.MeshStandardMaterial({
  color: 0xfacc15, // Bright Flight Deck Gold Yellow
  roughness: 0.3,
  metalness: 0.1,
  emissive: 0xfacc15,
  emissiveIntensity: 0.4,
});

/**
 * Creates a detailed procedural 3D warship model
 */
export function createShip3DModel(
  type: string,
  size: number,
  isSunk: boolean = false,
  cellSize: number = 2.0
): THREE.Group {
  const group = new THREE.Group();
  const hullMat = isSunk ? shipSunkMaterial : shipHullMaterial;
  const deckMat = isSunk ? shipSunkMaterial : shipDeckMaterial;
  const brassMat = isSunk ? shipSunkMaterial : shipBrassGuns;

  const totalLength = size * cellSize * 0.92;
  const shipWidth = cellSize * 0.72;
  const shipHeight = 0.6;

  // 1. MAIN V-SHAPED SHIP HULL
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-totalLength / 2, 0);
  hullShape.lineTo(-totalLength / 2 + totalLength * 0.15, -shipWidth / 2);
  hullShape.lineTo(totalLength / 2 - totalLength * 0.2, -shipWidth / 2);
  hullShape.lineTo(totalLength / 2, 0); // Sharp Bow
  hullShape.lineTo(totalLength / 2 - totalLength * 0.2, shipWidth / 2);
  hullShape.lineTo(-totalLength / 2 + totalLength * 0.15, shipWidth / 2);
  hullShape.closePath();

  const extrudeSettings = {
    depth: shipHeight,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.translate(0, shipHeight / 2, 0);

  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  group.add(hullMesh);

  // Red Boot-topping waterline stripe
  const waterlineGeo = new THREE.BoxGeometry(totalLength * 0.94, 0.08, shipWidth * 0.94);
  const waterlineMat = new THREE.MeshBasicMaterial({ color: isSunk ? 0x450a0a : 0xb91c1c });
  const waterline = new THREE.Mesh(waterlineGeo, waterlineMat);
  waterline.position.set(0, 0.05, 0);
  group.add(waterline);

  // 2. ORANGE LIFE RAFTS ON HULL SIDES
  if (!isSunk) {
    [-shipWidth * 0.42, shipWidth * 0.42].forEach(sideZ => {
      for (let i = -1; i <= 1; i++) {
        const raftGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 8);
        raftGeo.rotateZ(Math.PI / 2);
        const raft = new THREE.Mesh(raftGeo, shipLifeRaftOrange);
        raft.position.set(i * (totalLength * 0.2), shipHeight + 0.08, sideZ);
        group.add(raft);
      }
    });
  }

  // 3. SHIP SPECIFIC SUPERSTRUCTURE
  if (type === 'carrier') {
    // Flight Deck
    const flightDeckGeo = new THREE.BoxGeometry(totalLength * 0.96, 0.14, shipWidth * 0.98);
    const flightDeckMesh = new THREE.Mesh(flightDeckGeo, deckMat);
    flightDeckMesh.position.set(0, shipHeight + 0.07, 0);
    flightDeckMesh.castShadow = true;
    group.add(flightDeckMesh);

    // Centerline runway stripe
    const stripeGeo = new THREE.BoxGeometry(totalLength * 0.85, 0.02, 0.14);
    const stripeMesh = new THREE.Mesh(stripeGeo, runwayStripeMaterial);
    stripeMesh.position.set(0, shipHeight + 0.15, 0);
    group.add(stripeMesh);

    // Takeoff Angle Lane
    const angleLaneGeo = new THREE.BoxGeometry(totalLength * 0.55, 0.02, 0.1);
    const angleLane = new THREE.Mesh(angleLaneGeo, shipWhiteMarkings);
    angleLane.position.set(-totalLength * 0.1, shipHeight + 0.15, -shipWidth * 0.22);
    angleLane.rotation.y = 0.16;
    group.add(angleLane);

    // Island Bridge on Starboard
    const islandGeo = new THREE.BoxGeometry(totalLength * 0.22, 0.48, shipWidth * 0.24);
    const islandMesh = new THREE.Mesh(islandGeo, hullMat);
    islandMesh.position.set(totalLength * 0.05, shipHeight + 0.38, shipWidth * 0.34);
    islandMesh.castShadow = true;
    group.add(islandMesh);

    // Radar Mast & Rotating Dish
    const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const mast = new THREE.Mesh(mastGeo, brassMat);
    mast.position.set(totalLength * 0.05, shipHeight + 0.72, shipWidth * 0.34);
    group.add(mast);

    const dishGeo = new THREE.BoxGeometry(0.35, 0.1, 0.04);
    const dish = new THREE.Mesh(dishGeo, shipWhiteMarkings);
    dish.position.set(totalLength * 0.05, shipHeight + 0.9, shipWidth * 0.34);
    group.add(dish);

    // Mini Jets on deck
    for (let i = -1; i <= 1; i += 2) {
      const jetGeo = new THREE.ConeGeometry(0.2, 0.45, 3);
      jetGeo.rotateX(Math.PI / 2);
      const jetMesh = new THREE.Mesh(jetGeo, shipWhiteMarkings);
      jetMesh.position.set(totalLength * 0.28, shipHeight + 0.22, i * (shipWidth * 0.26));
      group.add(jetMesh);
    }
  } else if (type === 'battleship') {
    // Armored Citadel
    const citadelGeo = new THREE.BoxGeometry(totalLength * 0.48, 0.38, shipWidth * 0.65);
    const citadelMesh = new THREE.Mesh(citadelGeo, hullMat);
    citadelMesh.position.set(0, shipHeight + 0.2, 0);
    citadelMesh.castShadow = true;
    group.add(citadelMesh);

    // Command Tower Bridge
    const bridgeGeo = new THREE.BoxGeometry(totalLength * 0.2, 0.5, shipWidth * 0.42);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, deckMat);
    bridgeMesh.position.set(totalLength * 0.06, shipHeight + 0.6, 0);
    bridgeMesh.castShadow = true;
    group.add(bridgeMesh);

    // Triple Heavy Gun Turrets with Brass Barrels
    const turretPositions = [
      { x: totalLength * 0.28, y: shipHeight + 0.16, rot: 0 },
      { x: totalLength * 0.14, y: shipHeight + 0.3, rot: 0 },
      { x: -totalLength * 0.26, y: shipHeight + 0.16, rot: Math.PI },
    ];

    turretPositions.forEach(pos => {
      const turretBaseGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.18, 12);
      const turretBase = new THREE.Mesh(turretBaseGeo, hullMat);
      turretBase.position.set(pos.x, pos.y, 0);
      group.add(turretBase);

      [-0.11, 0, 0.11].forEach(offsetZ => {
        const barrelGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.6, 8);
        barrelGeo.rotateZ(Math.PI / 2);
        const barrel = new THREE.Mesh(barrelGeo, brassMat);
        const barrelDir = pos.rot === 0 ? 1 : -1;
        barrel.position.set(pos.x + barrelDir * 0.35, pos.y + 0.05, offsetZ);
        group.add(barrel);
      });
    });
  } else if (type === 'cruiser') {
    // Sleek Superstructure
    const superGeo = new THREE.BoxGeometry(totalLength * 0.52, 0.32, shipWidth * 0.55);
    const superMesh = new THREE.Mesh(superGeo, hullMat);
    superMesh.position.set(0, shipHeight + 0.16, 0);
    superMesh.castShadow = true;
    group.add(superMesh);

    // Dual Gun Turrets
    [{ x: totalLength * 0.28, dir: 1 }, { x: -totalLength * 0.28, dir: -1 }].forEach(pos => {
      const turretGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.15, 10);
      const turret = new THREE.Mesh(turretGeo, hullMat);
      turret.position.set(pos.x, shipHeight + 0.16, 0);
      group.add(turret);

      [-0.08, 0.08].forEach(offsetZ => {
        const barrelGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.48, 8);
        barrelGeo.rotateZ(Math.PI / 2);
        const barrel = new THREE.Mesh(barrelGeo, brassMat);
        barrel.position.set(pos.x + pos.dir * 0.28, shipHeight + 0.18, offsetZ);
        group.add(barrel);
      });
    });
  } else if (type === 'submarine') {
    // Rounded Cigar Hull
    const subHullGeo = new THREE.CylinderGeometry(shipWidth * 0.42, shipWidth * 0.42, totalLength * 0.92, 16);
    subHullGeo.rotateZ(Math.PI / 2);
    const subHullMesh = new THREE.Mesh(subHullGeo, hullMat);
    subHullMesh.position.set(0, shipHeight * 0.85, 0);
    group.add(subHullMesh);

    // Conning Tower & Periscope
    const conningGeo = new THREE.BoxGeometry(totalLength * 0.24, 0.42, shipWidth * 0.32);
    const conningMesh = new THREE.Mesh(conningGeo, deckMat);
    conningMesh.position.set(0, shipHeight + 0.28, 0);
    group.add(conningMesh);

    const periscopeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const periscope = new THREE.Mesh(periscopeGeo, brassMat);
    periscope.position.set(0.06, shipHeight + 0.6, 0);
    group.add(periscope);
  } else {
    // Destroyer / Patrol Corvette
    const bridgeGeo = new THREE.BoxGeometry(totalLength * 0.38, 0.32, shipWidth * 0.52);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, hullMat);
    bridgeMesh.position.set(0, shipHeight + 0.16, 0);
    group.add(bridgeMesh);

    const cannonBaseGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.14, 10);
    const cannonBase = new THREE.Mesh(cannonBaseGeo, hullMat);
    cannonBase.position.set(totalLength * 0.26, shipHeight + 0.15, 0);
    group.add(cannonBase);

    const barrelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8);
    barrelGeo.rotateZ(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, brassMat);
    barrel.position.set(totalLength * 0.26 + 0.24, shipHeight + 0.17, 0);
    group.add(barrel);
  }

  return group;
}

/**
 * Creates 3D Ballistic Artillery Rocket Missile with Smoke Trail & Flame
 */
export function createMissile3D(): THREE.Group {
  const group = new THREE.Group();

  // Missile Body
  const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.8,
    roughness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Red Warhead Tip
  const tipGeo = new THREE.ConeGeometry(0.12, 0.4, 12);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.6,
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.set(0, 0.7, 0);
  group.add(tip);

  // Tail Stabilizer Fins
  const finGeo = new THREE.BoxGeometry(0.4, 0.18, 0.02);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const fin1 = new THREE.Mesh(finGeo, finMat);
  fin1.position.set(0, -0.42, 0);
  group.add(fin1);

  const fin2 = new THREE.Mesh(finGeo, finMat);
  fin2.rotation.y = Math.PI / 2;
  fin2.position.set(0, -0.42, 0);
  group.add(fin2);

  // Rocket Thruster Fire Glow
  const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.95,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -0.55, 0);
  group.add(glow);

  return group;
}

/**
 * Creates 3D Ocean Grid Base with High-Visibility Colors
 */
export function createOceanGrid3D(
  gridSize: number,
  cellSize: number = 2.0,
  themeColor: number = 0x06b6d4,
  labelPrefix: string = ''
): { group: THREE.Group; cellMeshes: THREE.Mesh[][] } {
  const group = new THREE.Group();
  const totalDim = gridSize * cellSize;
  const cellMeshes: THREE.Mesh[][] = [];

  // Crystal-clear Tropical Water Substrate
  const waterGeo = new THREE.PlaneGeometry(totalDim + 1.4, totalDim + 1.4, 32, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant Azure Sea
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(0, -0.04, 0);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Outer Grid Frame (Naval Buoy Steel Border)
  const frameGeo = new THREE.BoxGeometry(totalDim + 1.8, 0.45, totalDim + 1.8);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.7,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, -0.26, 0);
  group.add(frameMesh);

  // Outer Glowing Neon Border
  const outerBorderGeo = new THREE.EdgesGeometry(frameGeo);
  const outerBorderMat = new THREE.LineBasicMaterial({
    color: themeColor,
    linewidth: 3,
  });
  const outerLine = new THREE.LineSegments(outerBorderGeo, outerBorderMat);
  outerLine.position.set(0, -0.26, 0);
  group.add(outerLine);

  // Interactive 3D Grid Cells
  const halfDim = totalDim / 2;
  const cellGeo = new THREE.BoxGeometry(cellSize * 0.94, 0.08, cellSize * 0.94);

  for (let r = 0; r < gridSize; r++) {
    cellMeshes[r] = [];
    for (let c = 0; c < gridSize; c++) {
      const posX = -halfDim + c * cellSize + cellSize / 2;
      const posZ = -halfDim + r * cellSize + cellSize / 2;

      const cellMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: 0.45,
      });

      const cellMesh = new THREE.Mesh(cellGeo, cellMat);
      cellMesh.position.set(posX, 0.04, posZ);
      cellMesh.userData = { r, c };
      group.add(cellMesh);
      cellMeshes[r][c] = cellMesh;

      // Crisp cell wireframe border
      const cellEdgeGeo = new THREE.EdgesGeometry(cellGeo);
      const cellEdgeMat = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.45,
      });
      const cellEdge = new THREE.LineSegments(cellEdgeGeo, cellEdgeMat);
      cellEdge.position.set(posX, 0.04, posZ);
      group.add(cellEdge);
    }
  }

  return { group, cellMeshes };
}

/**
 * Creates Full 3D Tropical Environment: Sunny sky, dynamic clouds,
 * tropical sandy islands with palm trees, and naval lighthouse beacon.
 */
export function createTropicalEnvironment3D(): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. VIBRANT SKY DOME
  const skyGeo = new THREE.SphereGeometry(180, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Bright Tropical Sky Blue
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  envGroup.add(skyMesh);

  // 2. SUN GLOW DISC
  const sunGeo = new THREE.SphereGeometry(8, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(70, 90, -90);
  envGroup.add(sunMesh);

  // 3. FLUFFY 3D CUMULUS CLOUDS
  const cloudPositions = [
    { x: -50, y: 35, z: -70, s: 12 },
    { x: 40, y: 40, z: -80, s: 14 },
    { x: -30, y: 45, z: 60, s: 10 },
    { x: 60, y: 38, z: 50, s: 13 },
  ];

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  cloudPositions.forEach(pos => {
    const cloud = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const puffGeo = new THREE.SphereGeometry(pos.s * (0.4 + Math.random() * 0.4), 8, 8);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set((i - 2) * (pos.s * 0.4), Math.random() * (pos.s * 0.2), Math.random() * (pos.s * 0.3));
      cloud.add(puff);
    }
    cloud.position.set(pos.x, pos.y, pos.z);
    envGroup.add(cloud);
  });

  // 4. TROPICAL ISLAND IN BACKGROUND (Sandy shores, green palms, lighthouse)
  const islandGroup = new THREE.Group();
  islandGroup.position.set(-65, -0.2, -60);

  // Sandy Island Landmass
  const islandGeo = new THREE.ConeGeometry(24, 4, 16);
  const islandMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, 1.8, 0);
  islandGroup.add(islandMesh);

  // Lush Green Foliage Hill
  const hillGeo = new THREE.SphereGeometry(12, 12, 12);
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const hill = new THREE.Mesh(hillGeo, hillMat);
  hill.position.set(0, 3, 0);
  hill.scale.set(1.4, 0.5, 1.2);
  islandGroup.add(hill);

  // Palm Trees on Island
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

  for (let p = 0; p < 8; p++) {
    const angle = (p / 8) * Math.PI * 2;
    const dist = 7 + Math.random() * 5;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.5, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(px, 4, pz);
    trunk.rotation.z = (Math.random() - 0.5) * 0.3;
    islandGroup.add(trunk);

    // Palm Leaves Fronds
    const frondGeo = new THREE.ConeGeometry(2.2, 1.2, 6);
    const frond = new THREE.Mesh(frondGeo, palmMat);
    frond.position.set(px, 5.8, pz);
    islandGroup.add(frond);
  }

  // Naval Lighthouse Tower
  const lighthouse = new THREE.Group();
  lighthouse.position.set(0, 5.5, 0);

  // Base
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 6, 12);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, 3, 0);
  lighthouse.add(baseMesh);

  // Red Stripes
  const stripeGeo = new THREE.CylinderGeometry(1.3, 1.4, 1.2, 12);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 4, 0);
  lighthouse.add(stripe);

  // Light Room Beacon
  const beaconGeo = new THREE.CylinderGeometry(1.1, 1.1, 1.2, 8);
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 6.6, 0);
  lighthouse.add(beacon);

  islandGroup.add(lighthouse);
  envGroup.add(islandGroup);

  return envGroup;
}
