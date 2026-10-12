import React from 'react';

interface ShipVisualProps {
  type: string;
  size: number;
  orientation?: 'horizontal' | 'vertical';
  isSunk?: boolean;
  damageRatio?: number; // 0 to 1
  className?: string;
}

export const ShipVisual: React.FC<ShipVisualProps> = ({
  type,
  size,
  orientation = 'horizontal',
  isSunk = false,
  damageRatio = 0,
  className = '',
}) => {
  // Color palette for modern naval camouflage
  const hullDark = isSunk ? '#334155' : '#1e293b';
  const hullMid = isSunk ? '#475569' : '#334155';
  const hullLight = isSunk ? '#64748b' : '#475569';
  const deckColor = isSunk ? '#1e293b' : '#0f172a';
  const accentMetal = isSunk ? '#64748b' : '#38bdf8';

  return (
    <div
      id={`ship-visual-${type}-${orientation}`}
      className={`relative flex items-center justify-center select-none transition-all duration-300 ${
        isSunk ? 'opacity-80 grayscale contrast-125' : ''
      } ${className}`}
      style={{
        width: orientation === 'horizontal' ? `${size * 100}%` : '100%',
        height: orientation === 'vertical' ? `${size * 100}%` : '100%',
      }}
    >
      <svg
        viewBox={`0 0 ${orientation === 'horizontal' ? size * 60 : 60} ${
          orientation === 'horizontal' ? 60 : size * 60
        }`}
        className="w-full h-full drop-shadow-md"
        preserveAspectRatio="none"
      >
        <g
          transform={
            orientation === 'vertical'
              ? `rotate(90 30 30) translate(0, -${(size - 1) * 60})`
              : ''
          }
        >
          {/* BASE SHIP HULL */}
          <path
            d={`M 10 30 
               Q 25 12, 60 12 
               L ${size * 60 - 20} 12 
               Q ${size * 60 - 5} 12, ${size * 60 - 5} 30 
               Q ${size * 60 - 5} 48, ${size * 60 - 20} 48 
               L 60 48 
               Q 25 48, 10 30 Z`}
            fill={hullMid}
            stroke={accentMetal}
            strokeWidth="1.5"
          />

          {/* INNER DECK */}
          <path
            d={`M 25 30 
               Q 35 18, 65 18 
               L ${size * 60 - 25} 18 
               Q ${size * 60 - 15} 18, ${size * 60 - 15} 30 
               Q ${size * 60 - 15} 42, ${size * 60 - 25} 42 
               L 65 42 
               Q 35 42, 25 30 Z`}
            fill={deckColor}
          />

          {/* SPECIFIC SHIP SUPERSTRUCTURE ACCENTS */}
          {type === 'carrier' && (
            <g>
              {/* Flight Deck Yellow Runways & Landing Arrows */}
              <line x1="40" y1="30" x2={size * 60 - 30} y2="30" stroke="#facc15" strokeWidth="2" strokeDasharray="6,4" />
              <line x1="30" y1="24" x2={size * 60 - 35} y2="24" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="36" x2={size * 60 - 35} y2="36" stroke="#e2e8f0" strokeWidth="1" />
              {/* Carrier Island Control Tower */}
              <rect x={size * 60 * 0.45} y="14" width="30" height="8" rx="2" fill={hullLight} stroke="#64748b" />
              <circle cx={size * 60 * 0.45 + 15} cy="18" r="2.5" fill="#38bdf8" />
            </g>
          )}

          {type === 'battleship' && (
            <g>
              {/* Triple Heavy Gun Turrets */}
              <circle cx="55" cy="30" r="10" fill={hullLight} stroke="#64748b" />
              <line x1="55" y1="28" x2="30" y2="28" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              <line x1="55" y1="32" x2="30" y2="32" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

              <circle cx={size * 60 - 65} cy="30" r="10" fill={hullLight} stroke="#64748b" />
              <line x1={size * 60 - 65} y1="28" x2={size * 60 - 40} y2="28" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              <line x1={size * 60 - 65} y1="32" x2={size * 60 - 40} y2="32" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

              {/* Command Bridge Tower */}
              <rect x={size * 60 * 0.4} y="22" width="40" height="16" rx="4" fill={hullDark} stroke="#38bdf8" strokeWidth="1" />
            </g>
          )}

          {type === 'cruiser' && (
            <g>
              {/* Dual Guns & Torpedo Array */}
              <circle cx="45" cy="30" r="8" fill={hullLight} stroke="#64748b" />
              <line x1="45" y1="30" x2="25" y2="30" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

              <circle cx={size * 60 - 45} cy="30" r="8" fill={hullLight} stroke="#64748b" />
              <line x1={size * 60 - 45} y1="30" x2={size * 60 - 25} y2="30" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

              <rect x={size * 60 * 0.4} y="23" width="28" height="14" rx="3" fill={hullDark} />
              <circle cx={size * 60 * 0.4 + 14} cy="30" r="3" fill="#22c55e" />
            </g>
          )}

          {type === 'submarine' && (
            <g>
              {/* Conning Tower & Periscope */}
              <ellipse cx={size * 60 * 0.5} cy="30" rx="20" ry="8" fill={hullDark} stroke="#0284c7" strokeWidth="1.5" />
              <circle cx={size * 60 * 0.5} cy="30" r="4" fill="#38bdf8" />
              {/* Hydroplanes */}
              <path d={`M 35 15 L 45 15 L 40 20 Z`} fill={hullLight} />
              <path d={`M 35 45 L 45 45 L 40 40 Z`} fill={hullLight} />
            </g>
          )}

          {type === 'destroyer' && (
            <g>
              {/* Rapid Cannon & Radar Mast */}
              <circle cx="35" cy="30" r="7" fill={hullLight} stroke="#64748b" />
              <line x1="35" y1="30" x2="18" y2="30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <rect x={size * 60 * 0.55} y="24" width="22" height="12" rx="2" fill={hullDark} />
            </g>
          )}

          {type === 'patrol' && (
            <g>
              <circle cx="30" cy="30" r="5" fill="#38bdf8" />
              <line x1="30" y1="30" x2="15" y2="30" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* HULL DETAILS & WATERLINE */}
          <line x1="20" y1="30" x2={size * 60 - 15} y2="30" stroke="#0ea5e9" strokeWidth="0.5" strokeOpacity="0.4" />
        </g>
      </svg>

      {/* DAMAGE & SUNK OVERLAY: FLAMES, SMOKE & SKULL BADGE */}
      {(isSunk || damageRatio > 0) && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Animated burning flames */}
          <div className="absolute flex items-center gap-1">
            <span className="inline-block animate-pulse text-amber-500 text-xs">🔥</span>
            {damageRatio >= 0.5 && <span className="inline-block animate-bounce text-red-500 text-xs">💥</span>}
            {isSunk && <span className="inline-block animate-ping text-orange-600 text-xs">🔥</span>}
          </div>

          {isSunk && (
            <div className="absolute bg-red-950/80 border border-red-500 text-red-300 text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
              DESTROYED
            </div>
          )}
        </div>
      )}
    </div>
  );
};
