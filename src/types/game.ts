export type LanguageCode = 'es' | 'en' | 'de' | 'fr' | 'it' | 'ru' | 'zh' | 'ja' | 'pt';

export type TheaterId = 'pacific' | 'atlantic' | 'arctic' | 'cyber';

export type GridDimension = 8 | 10 | 12;

export type AIDifficulty = 'recruit' | 'veteran' | 'admiral';

export type GamePhase = 'menu' | 'placement' | 'battle' | 'gameover' | 'campaign';

export type CellStatus = 'empty' | 'miss' | 'hit' | 'sunk';

export interface Coordinate {
  r: number; // Row index (0-indexed)
  c: number; // Column index (0-indexed)
}

export interface ShipTemplate {
  id: string;
  nameKey: string;
  size: number;
  iconName: string;
}

export interface PlacedShip {
  id: string;
  nameKey: string;
  size: number;
  orientation: 'horizontal' | 'vertical';
  origin: Coordinate;
  positions: Coordinate[];
  hits: number;
  sunk: boolean;
}

export interface BoardCell {
  r: number;
  c: number;
  hasShip: boolean;
  shipId?: string;
  status: CellStatus;
  hitTimestamp?: number;
}

export interface MoveRecord {
  shooter: 'player' | 'ai';
  coord: Coordinate;
  result: 'hit' | 'miss' | 'sunk';
  shipNameKey?: string;
  turn: number;
  timestamp: number;
}

export interface GameStats {
  playerShots: number;
  playerHits: number;
  playerMisses: number;
  playerSunken: number;
  maxStreak: number;
  currentStreak: number;
  aiShots: number;
  aiHits: number;
  aiMisses: number;
  aiSunken: number;
  startTime: number;
  endTime?: number;
  score: number;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface CampaignMission {
  id: number;
  nameKey: string;
  descKey: string;
  theater: TheaterId;
  gridSize: GridDimension;
  difficulty: AIDifficulty;
  unlocked: boolean;
  stars: number; // 0 to 3
  bestScore?: number;
  fleetComposition: ShipTemplate[];
}

export interface SoundSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  haptics: boolean;
}
