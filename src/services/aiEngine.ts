import { Coordinate, GridDimension, PlacedShip, ShipTemplate, AIDifficulty, CellStatus } from '../types/game';

export const STANDARD_FLEET_10: ShipTemplate[] = [
  { id: 'carrier', nameKey: 'carrier', size: 5, iconName: 'Ship' },
  { id: 'battleship', nameKey: 'battleship', size: 4, iconName: 'Shield' },
  { id: 'cruiser', nameKey: 'cruiser', size: 3, iconName: 'Anchor' },
  { id: 'submarine', nameKey: 'submarine', size: 3, iconName: 'Radio' },
  { id: 'destroyer', nameKey: 'destroyer', size: 2, iconName: 'Crosshair' },
];

export const BLITZ_FLEET_8: ShipTemplate[] = [
  { id: 'battleship', nameKey: 'battleship', size: 4, iconName: 'Shield' },
  { id: 'cruiser', nameKey: 'cruiser', size: 3, iconName: 'Anchor' },
  { id: 'submarine', nameKey: 'submarine', size: 3, iconName: 'Radio' },
  { id: 'destroyer', nameKey: 'destroyer', size: 2, iconName: 'Crosshair' },
];

export const ARMADA_FLEET_12: ShipTemplate[] = [
  { id: 'carrier', nameKey: 'carrier', size: 5, iconName: 'Ship' },
  { id: 'battleship', nameKey: 'battleship', size: 4, iconName: 'Shield' },
  { id: 'cruiser', nameKey: 'cruiser', size: 3, iconName: 'Anchor' },
  { id: 'submarine', nameKey: 'submarine', size: 3, iconName: 'Radio' },
  { id: 'destroyer', nameKey: 'destroyer', size: 2, iconName: 'Crosshair' },
  { id: 'patrol', nameKey: 'patrolBoat', size: 1, iconName: 'Compass' },
];

export function getFleetTemplates(gridSize: GridDimension): ShipTemplate[] {
  if (gridSize === 8) return BLITZ_FLEET_8;
  if (gridSize === 12) return ARMADA_FLEET_12;
  return STANDARD_FLEET_10;
}

export function isValidPlacement(
  shipSize: number,
  origin: Coordinate,
  orientation: 'horizontal' | 'vertical',
  gridSize: GridDimension,
  existingShips: PlacedShip[],
  excludeShipId?: string
): boolean {
  const { r, c } = origin;
  if (r < 0 || c < 0) return false;

  const positions: Coordinate[] = [];
  for (let i = 0; i < shipSize; i++) {
    const curR = orientation === 'horizontal' ? r : r + i;
    const curC = orientation === 'horizontal' ? c + i : c;
    if (curR >= gridSize || curC >= gridSize) return false;
    positions.push({ r: curR, c: curC });
  }

  // Check collision with other ships
  for (const ship of existingShips) {
    if (excludeShipId && ship.id === excludeShipId) continue;
    for (const p of ship.positions) {
      if (positions.some(pos => pos.r === p.r && pos.c === p.c)) {
        return false;
      }
    }
  }

  return true;
}

export function generateRandomFleet(gridSize: GridDimension, templates: ShipTemplate[]): PlacedShip[] {
  const placed: PlacedShip[] = [];

  for (const t of templates) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 1000) {
      attempts++;
      const orientation: 'horizontal' | 'vertical' = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const maxR = orientation === 'vertical' ? gridSize - t.size : gridSize - 1;
      const maxC = orientation === 'horizontal' ? gridSize - t.size : gridSize - 1;

      const r = Math.floor(Math.random() * (maxR + 1));
      const c = Math.floor(Math.random() * (maxC + 1));
      const origin = { r, c };

      if (isValidPlacement(t.size, origin, orientation, gridSize, placed)) {
        const positions: Coordinate[] = [];
        for (let i = 0; i < t.size; i++) {
          positions.push({
            r: orientation === 'horizontal' ? r : r + i,
            c: orientation === 'horizontal' ? c + i : c,
          });
        }
        placed.push({
          id: t.id,
          nameKey: t.nameKey,
          size: t.size,
          orientation,
          origin,
          positions,
          hits: 0,
          sunk: false,
        });
        success = true;
      }
    }
  }

  return placed;
}

/**
 * Calculates the Probability Density Heatmap of enemy ship placements.
 * Used by Admiral AI and for tactical analytics visualization!
 */
export function calculateProbabilityHeatmap(
  gridSize: GridDimension,
  playerShots: { [key: string]: CellStatus }, // key is "r,c"
  unsunkShips: { size: number }[]
): number[][] {
  const heatmap: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  // Find all active hits that haven't been sunk yet
  const activeHits: Coordinate[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (playerShots[`${r},${c}`] === 'hit') {
        activeHits.push({ r, c });
      }
    }
  }

  // Slide each unsunk ship across every valid coordinate
  for (const ship of unsunkShips) {
    const size = ship.size;

    // Check horizontal fits
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c <= gridSize - size; c++) {
        let valid = true;
        let hitsEncountered = 0;

        for (let i = 0; i < size; i++) {
          const status = playerShots[`${r},${c + i}`];
          if (status === 'miss' || status === 'sunk') {
            valid = false;
            break;
          }
          if (status === 'hit') {
            hitsEncountered++;
          }
        }

        if (valid) {
          const weight = hitsEncountered > 0 ? (hitsEncountered + 1) * 10 : 1;
          for (let i = 0; i < size; i++) {
            if (!playerShots[`${r},${c + i}`]) {
              heatmap[r][c + i] += weight;
            }
          }
        }
      }
    }

    // Check vertical fits
    for (let r = 0; r <= gridSize - size; r++) {
      for (let c = 0; c < gridSize; c++) {
        let valid = true;
        let hitsEncountered = 0;

        for (let i = 0; i < size; i++) {
          const status = playerShots[`${r + i},${c}`];
          if (status === 'miss' || status === 'sunk') {
            valid = false;
            break;
          }
          if (status === 'hit') {
            hitsEncountered++;
          }
        }

        if (valid) {
          const weight = hitsEncountered > 0 ? (hitsEncountered + 1) * 10 : 1;
          for (let i = 0; i < size; i++) {
            if (!playerShots[`${r + i},${c}`]) {
              heatmap[r + i][c] += weight;
            }
          }
        }
      }
    }
  }

  // Boost neighbors of active hits if any
  if (activeHits.length > 0) {
    for (const h of activeHits) {
      const neighbors = [
        { r: h.r - 1, c: h.c },
        { r: h.r + 1, c: h.c },
        { r: h.r, c: h.c - 1 },
        { r: h.r, c: h.c + 1 },
      ];
      for (const n of neighbors) {
        if (n.r >= 0 && n.r < gridSize && n.c >= 0 && n.c < gridSize) {
          if (!playerShots[`${n.r},${n.c}`]) {
            heatmap[n.r][n.c] += 25;
          }
        }
      }
    }

    // If multiple hits, boost the collinear direction
    if (activeHits.length >= 2) {
      const isHorizontal = activeHits.every(h => h.r === activeHits[0].r);
      const isVertical = activeHits.every(h => h.c === activeHits[0].c);

      if (isHorizontal) {
        const row = activeHits[0].r;
        const cols = activeHits.map(h => h.c).sort((a, b) => a - b);
        const minCol = cols[0] - 1;
        const maxCol = cols[cols.length - 1] + 1;

        if (minCol >= 0 && !playerShots[`${row},${minCol}`]) heatmap[row][minCol] += 50;
        if (maxCol < gridSize && !playerShots[`${row},${maxCol}`]) heatmap[row][maxCol] += 50;
      } else if (isVertical) {
        const col = activeHits[0].c;
        const rows = activeHits.map(h => h.r).sort((a, b) => a - b);
        const minRow = rows[0] - 1;
        const maxRow = rows[rows.length - 1] + 1;

        if (minRow >= 0 && !playerShots[`${minRow},${col}`]) heatmap[minRow][col] += 50;
        if (maxRow < gridSize && !playerShots[`${maxRow},${col}`]) heatmap[maxRow][col] += 50;
      }
    }
  }

  return heatmap;
}

/**
 * Intelligent AI Decision Maker
 */
export function getNextAIShot(
  gridSize: GridDimension,
  difficulty: AIDifficulty,
  aiShotHistory: { [key: string]: CellStatus },
  unsunkPlayerShips: PlacedShip[]
): Coordinate {
  // Collect all untried cells
  const available: Coordinate[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!aiShotHistory[`${r},${c}`]) {
        available.push({ r, c });
      }
    }
  }

  if (available.length === 0) return { r: 0, c: 0 };

  // RECRUIT: Random + basic adjacent hit tracking
  if (difficulty === 'recruit') {
    // Check if any hit is waiting for neighbor
    const recentHits = Object.keys(aiShotHistory).filter(k => aiShotHistory[k] === 'hit');
    if (recentHits.length > 0 && Math.random() < 0.6) {
      const hitCoord = recentHits[recentHits.length - 1].split(',').map(Number);
      const neighbors = [
        { r: hitCoord[0] - 1, c: hitCoord[1] },
        { r: hitCoord[0] + 1, c: hitCoord[1] },
        { r: hitCoord[0], c: hitCoord[1] - 1 },
        { r: hitCoord[0], c: hitCoord[1] + 1 },
      ].filter(n => n.r >= 0 && n.r < gridSize && n.c >= 0 && n.c < gridSize && !aiShotHistory[`${n.r},${n.c}`]);

      if (neighbors.length > 0) {
        return neighbors[Math.floor(Math.random() * neighbors.length)];
      }
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  // VETERAN: Hunt & Target with checkerboard parity
  if (difficulty === 'veteran') {
    const hits = Object.keys(aiShotHistory).filter(k => aiShotHistory[k] === 'hit');

    if (hits.length > 0) {
      // Find candidate neighbors for active hits
      const candidates: Coordinate[] = [];
      for (const hStr of hits) {
        const [hr, hc] = hStr.split(',').map(Number);
        const adj = [
          { r: hr - 1, c: hc },
          { r: hr + 1, c: hc },
          { r: hr, c: hc - 1 },
          { r: hr, c: hc + 1 },
        ];
        for (const a of adj) {
          if (a.r >= 0 && a.r < gridSize && a.c >= 0 && a.c < gridSize && !aiShotHistory[`${a.r},${a.c}`]) {
            candidates.push(a);
          }
        }
      }
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // Parity search (checkerboard parity filter)
    const smallestShipSize = Math.min(...unsunkPlayerShips.map(s => s.size), 2);
    const parityAvailable = available.filter(coord => (coord.r + coord.c) % smallestShipSize === 0);
    if (parityAvailable.length > 0) {
      return parityAvailable[Math.floor(Math.random() * parityAvailable.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  // ADMIRAL: Full Probability Density Function (PDM)
  const heatmap = calculateProbabilityHeatmap(gridSize, aiShotHistory, unsunkPlayerShips);

  let maxProb = -1;
  let bestCandidates: Coordinate[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!aiShotHistory[`${r},${c}`]) {
        const prob = heatmap[r][c];
        if (prob > maxProb) {
          maxProb = prob;
          bestCandidates = [{ r, c }];
        } else if (prob === maxProb) {
          bestCandidates.push({ r, c });
        }
      }
    }
  }

  if (bestCandidates.length > 0) {
    return bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
  }

  return available[0];
}

/**
 * Computes Military Efficiency Grade and Score
 */
export function evaluateCombatStats(
  playerHits: number,
  playerShots: number,
  turns: number,
  gridSize: GridDimension,
  difficulty: AIDifficulty,
  won: boolean,
  streak: number
): { score: number; grade: 'S' | 'A' | 'B' | 'C' | 'D'; accuracy: number } {
  const accuracy = playerShots > 0 ? Math.round((playerHits / playerShots) * 100) : 0;

  const diffMultiplier = difficulty === 'admiral' ? 1.5 : difficulty === 'veteran' ? 1.2 : 1.0;
  const gridMultiplier = gridSize === 12 ? 1.4 : gridSize === 10 ? 1.0 : 0.8;

  let baseScore = playerHits * 250;
  baseScore += streak * 150;
  if (won) {
    baseScore += 5000;
    // Turn efficiency bonus
    const parTurns = gridSize === 8 ? 24 : gridSize === 10 ? 36 : 50;
    const efficiency = Math.max(0, parTurns - turns) * 100;
    baseScore += efficiency;
  }

  const finalScore = Math.round(baseScore * diffMultiplier * gridMultiplier);

  let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
  if (won) {
    if (accuracy >= 55 && turns <= (gridSize * gridSize) * 0.4) {
      grade = 'S';
    } else if (accuracy >= 45) {
      grade = 'A';
    } else if (accuracy >= 35) {
      grade = 'B';
    } else {
      grade = 'C';
    }
  } else {
    grade = accuracy >= 40 ? 'C' : 'D';
  }

  return { score: finalScore, grade, accuracy };
}
