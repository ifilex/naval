/**
 * Procedural Pixel Art Sprite Drawing Engine
 * Renders authentic 16-bit Nintendo Switch indie style ships, explosions,
 * water effects, and UI elements directly on HTML5 Canvas.
 */

export interface PixelPoint {
  x: number;
  y: number;
}

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function drawPixelBorderBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string,
  borderColor: string = '#000000',
  borderWidth: number = 3
) {
  // Shadow
  drawPixelRect(ctx, x + 4, y + 4, w, h, 'rgba(0,0,0,0.4)');
  // Border
  drawPixelRect(ctx, x, y, w, h, borderColor);
  // Inner background
  drawPixelRect(
    ctx,
    x + borderWidth,
    y + borderWidth,
    w - borderWidth * 2,
    h - borderWidth * 2,
    bgColor
  );
  // Top highlight
  drawPixelRect(ctx, x + borderWidth, y + borderWidth, w - borderWidth * 2, 2, 'rgba(255,255,255,0.4)');
  // Bottom shadow
  drawPixelRect(ctx, x + borderWidth, y + h - borderWidth - 2, w - borderWidth * 2, 2, 'rgba(0,0,0,0.3)');
}

/**
 * Draws 16-bit animated pixel water background
 */
export function drawPixelWaterBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tick: number,
  theater: string = 'pacific'
) {
  // Base water gradient
  const baseColor =
    theater === 'pacific'
      ? '#0284c7'
      : theater === 'atlantic'
      ? '#0369a1'
      : theater === 'arctic'
      ? '#0e7490'
      : '#0f172a';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  // Animated Pixel Waves
  const waveColors = ['rgba(255,255,255,0.25)', 'rgba(56,189,248,0.35)', 'rgba(2,132,199,0.4)'];
  const waveSpacing = 32;

  for (let y = 0; y < h; y += waveSpacing) {
    const shift = Math.floor(Math.sin((tick * 0.04) + y * 0.05) * 8);
    const color = waveColors[(Math.floor(y / waveSpacing)) % waveColors.length];
    ctx.fillStyle = color;

    for (let x = -20; x < w + 20; x += 40) {
      const wx = x + shift;
      ctx.fillRect(wx, y, 12, 3);
      ctx.fillRect(wx + 2, y - 2, 8, 2);
    }
  }
}

/**
 * Draws water grid tiles with grid lines and waves
 */
export function drawPixelGridTiles(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  gridSize: number,
  cellSize: number,
  tick: number,
  theater: string = 'pacific'
) {
  const totalDim = cellSize * gridSize;

  // Background box with black border and shadow
  drawPixelBorderBox(ctx, startX - 4, startY - 4, totalDim + 8, totalDim + 8, '#0369a1', '#000000', 3);

  // Draw each grid tile
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;

      const isEven = (r + c) % 2 === 0;
      ctx.fillStyle = isEven ? '#0284c7' : '#0369a1';
      ctx.fillRect(x, y, cellSize, cellSize);

      // Subtle water wave speckle
      if ((r * 3 + c * 5 + Math.floor(tick * 0.05)) % 7 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x + 4, y + 4, 4, 2);
      }

      // Thin inner grid line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }

  // Outer bold black grid border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(startX, startY, totalDim, totalDim);
}

/**
 * Draws animated fire and smoke on hit cells
 */
export function drawPixelHitFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  tick: number
) {
  const fireColors = ['#fef08a', '#facc15', '#f97316', '#ef4444'];
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;

  // Fire base
  for (let f = 0; f < 5; f++) {
    const angle = (f / 5) * Math.PI * 2;
    const height = Math.abs(Math.sin(tick * 0.2 + f)) * 8 + 4;
    const fx = centerX + Math.cos(angle) * 3 - 2;
    const fy = centerY - height + 2;
    const color = fireColors[(f + Math.floor(tick * 0.2)) % fireColors.length];

    drawPixelRect(ctx, fx, fy, 4, height, color);
  }

  // Smoke puffs rising
  const smokePuff = (tick % 20) * 0.8;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  drawPixelRect(ctx, centerX - 3, centerY - 10 - smokePuff, 6, 6, 'rgba(30, 41, 59, 0.7)');
  drawPixelRect(ctx, centerX - 1, centerY - 16 - smokePuff, 4, 4, 'rgba(51, 65, 85, 0.5)');
}

/**
 * Draws a detailed 16-bit pixel warship
 */
export function drawPixelShip(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  size: number,
  orientation: 'horizontal' | 'vertical',
  cellSize: number,
  isSunk: boolean = false,
  animTick: number = 0
) {
  ctx.save();
  ctx.translate(x, y);

  const length = size * cellSize;
  const width = cellSize;

  if (orientation === 'vertical') {
    ctx.translate(width / 2, length / 2);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-length / 2, -width / 2);
  }

  // Ship Colors (Vibrant Nintendo Switch Indie Style)
  const hullColor = isSunk ? '#27272a' : '#475569';
  const hullHighlight = isSunk ? '#3f3f46' : '#64748b';
  const hullShadow = isSunk ? '#18181b' : '#334155';
  const deckColor = isSunk ? '#1c1917' : '#94a3b8';
  const accentColor = isSunk ? '#7f1d1d' : '#f59e0b';
  const whiteTrim = isSunk ? '#52525b' : '#f8fafc';

  const padX = 3;
  const padY = 4;
  const shipW = length - padX * 2;
  const shipH = width - padY * 2;

  // 1. Water Wake / Foam around ship
  if (!isSunk) {
    const waveOffset = Math.sin(animTick * 0.1) * 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(padX - 4, padY + waveOffset, 4, shipH - waveOffset * 2);
    ctx.fillRect(padX + shipW, padY + 2, 6, shipH - 4);
    ctx.fillRect(padX + 2, padY - 2, shipW - 4, 2);
    ctx.fillRect(padX + 2, padY + shipH, shipW - 4, 2);
  }

  // 2. Black Pixel Outline
  ctx.fillStyle = '#000000';
  ctx.fillRect(padX, padY, shipW, shipH);

  // Pointy Bow on Right
  ctx.fillRect(padX + shipW - 6, padY - 2, 6, 2);
  ctx.fillRect(padX + shipW - 6, padY + shipH, 6, 2);

  // 3. Main Hull Body
  ctx.fillStyle = hullColor;
  ctx.fillRect(padX + 2, padY + 2, shipW - 4, shipH - 4);

  // Top Light Highlight
  ctx.fillStyle = hullHighlight;
  ctx.fillRect(padX + 2, padY + 2, shipW - 4, 3);

  // Bottom Shadow
  ctx.fillStyle = hullShadow;
  ctx.fillRect(padX + 2, padY + shipH - 5, shipW - 4, 3);

  // 4. Deck Overlay
  ctx.fillStyle = deckColor;
  ctx.fillRect(padX + 6, padY + 5, shipW - 14, shipH - 10);

  // 5. SHIP SPECIFIC SUPERSTRUCTURE
  if (type === 'carrier') {
    // Flight Deck Yellow / White Runway Lines
    ctx.fillStyle = '#facc15';
    ctx.fillRect(padX + 8, padY + shipH / 2 - 1, shipW - 18, 3);

    // Lateral stripes
    ctx.fillStyle = whiteTrim;
    ctx.fillRect(padX + 12, padY + 6, 3, shipH - 12);
    ctx.fillRect(padX + shipW - 20, padY + 6, 3, shipH - 12);

    // Starboard Island Bridge
    ctx.fillStyle = '#000000';
    ctx.fillRect(padX + shipW * 0.5, padY + 3, 14, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padX + shipW * 0.5 + 2, padY + 4, 10, 4);

    // Pixel Radar dish
    ctx.fillStyle = accentColor;
    ctx.fillRect(padX + shipW * 0.5 + 5, padY + 1, 4, 3);
  } else if (type === 'battleship') {
    // 3 Triple Gun Turrets
    const turretPositions = [
      padX + shipW * 0.25,
      padX + shipW * 0.5,
      padX + shipW * 0.75,
    ];

    turretPositions.forEach((tx, idx) => {
      // Turret base
      ctx.fillStyle = '#000000';
      ctx.fillRect(tx - 5, padY + shipH / 2 - 4, 10, 8);
      ctx.fillStyle = hullHighlight;
      ctx.fillRect(tx - 4, padY + shipH / 2 - 3, 8, 6);

      // Barrels
      ctx.fillStyle = accentColor;
      const barrelDir = idx === 0 ? -1 : 1;
      ctx.fillRect(tx + (barrelDir === 1 ? 4 : -8), padY + shipH / 2 - 2, 5, 2);
      ctx.fillRect(tx + (barrelDir === 1 ? 4 : -8), padY + shipH / 2 + 1, 5, 2);
    });

    // Command Tower Bridge
    ctx.fillStyle = '#000000';
    ctx.fillRect(padX + shipW * 0.45, padY + 4, 12, shipH - 8);
    ctx.fillStyle = whiteTrim;
    ctx.fillRect(padX + shipW * 0.45 + 2, padY + 6, 8, shipH - 12);
  } else if (type === 'cruiser') {
    // Dual Turrets
    [padX + shipW * 0.25, padX + shipW * 0.75].forEach(tx => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(tx - 4, padY + shipH / 2 - 3, 8, 6);
      ctx.fillStyle = hullHighlight;
      ctx.fillRect(tx - 3, padY + shipH / 2 - 2, 6, 4);

      ctx.fillStyle = accentColor;
      ctx.fillRect(tx + 3, padY + shipH / 2 - 1, 5, 2);
    });

    // Center Bridge
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padX + shipW * 0.45, padY + shipH / 2 - 4, 10, 8);
  } else if (type === 'submarine') {
    // Conning Tower & Periscope
    ctx.fillStyle = '#000000';
    ctx.fillRect(padX + shipW * 0.4, padY + shipH / 2 - 4, 12, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padX + shipW * 0.4 + 2, padY + shipH / 2 - 2, 8, 4);

    // Periscope
    ctx.fillStyle = accentColor;
    ctx.fillRect(padX + shipW * 0.4 + 5, padY + shipH / 2 - 7, 3, 4);
  } else {
    // Destroyer / Patrol
    ctx.fillStyle = '#000000';
    ctx.fillRect(padX + shipW * 0.6, padY + shipH / 2 - 3, 7, 6);
    ctx.fillStyle = accentColor;
    ctx.fillRect(padX + shipW * 0.6 + 6, padY + shipH / 2 - 1, 4, 2);
  }

  // Sunk Fire Particles
  if (isSunk) {
    const fireColors = ['#f59e0b', '#ef4444', '#f97316', '#fbbf24'];
    for (let f = 0; f < 6; f++) {
      const fx = padX + 8 + (f * (shipW - 16)) / 5;
      const fy = padY + 2 + Math.sin(animTick * 0.2 + f) * 3;
      const color = fireColors[(f + Math.floor(animTick * 0.1)) % fireColors.length];
      drawPixelRect(ctx, fx, fy, 4, 6, color);
      // Smoke
      drawPixelRect(ctx, fx + 1, fy - 6, 3, 4, 'rgba(60,60,60,0.8)');
    }
  }

  ctx.restore();
}

/**
 * Draws animated 16-bit pixel explosion
 */
export function drawPixelExplosion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  frame: number
) {
  const colors = ['#fef08a', '#facc15', '#f97316', '#ef4444', '#991b1b'];
  const count = 16;

  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + frame * 0.1;
    const dist = (radius * (frame % 8)) / 8;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const size = Math.max(3, 8 - frame * 0.8);
    const color = colors[(i + frame) % colors.length];

    drawPixelRect(ctx, px - size / 2, py - size / 2, size, size, color);
    // Outer black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(px - size / 2), Math.floor(py - size / 2), size, size);
  }

  // Central Core Flash
  if (frame < 5) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, radius * 0.4 - frame * 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws animated pixel water splash
 */
export function drawPixelWaterSplash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  frame: number
) {
  ctx.save();
  ctx.translate(x, y);

  const colors = ['#ffffff', '#e0f2fe', '#bae6fd', '#38bdf8'];
  const ringRadius = (radius * (frame % 10)) / 10;

  // Expanding Water Splash Ring
  ctx.strokeStyle = colors[frame % colors.length];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRadius, ringRadius * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Water droplets flying up
  for (let d = -2; d <= 2; d++) {
    const dx = d * 6;
    const dy = -Math.sin(((frame % 8) / 8) * Math.PI) * 16 + Math.abs(d) * 2;
    drawPixelRect(ctx, dx, dy, 3, 4, '#ffffff');
  }

  ctx.restore();
}
