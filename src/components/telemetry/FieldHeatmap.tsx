'use client';

import React from 'react';

interface Coordinate {
  x: number;
  y: number;
  value: number;
}

interface FieldHeatmapProps {
  coordinates: Coordinate[];
  sport?: 'football' | 'basketball';
}

export default function FieldHeatmap({ coordinates, sport = 'football' }: FieldHeatmapProps) {
  const isBasketball = sport === 'basketball';

  return (
    <div className="relative w-full bg-zinc-950 border border-white/5 rounded-3xl p-6 flex flex-col items-center">
      
      {/* Label */}
      <div className="absolute top-4 left-4 bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full">
        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{sport === 'football' ? 'Sahası Dağılımı' : 'Saha Isı Haritası'}</span>
      </div>

      <div className="relative w-full max-w-lg aspect-[5/3] bg-emerald-950/20 border border-emerald-500/20 rounded-2xl overflow-hidden mt-6">
        
        {/* Dynamic heatmap spots rendering */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {coordinates.map((spot, idx) => {
            // Translate percentage coordinates to styles
            const color = spot.value > 20 ? 'rgba(239, 68, 68, 0.4)' : spot.value > 10 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.2)';
            const size = spot.value * 2.5 + 20; // scale size
            
            return (
              <div
                key={idx}
                className="absolute rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>

        {/* Vector Field markings */}
        {isBasketball ? (
          // Basketball court lines SVG
          <svg viewBox="0 0 100 60" className="w-full h-full stroke-emerald-500/30 stroke-[0.4] fill-none">
            {/* Outline */}
            <rect x="0" y="0" width="100" height="60" />
            {/* Midline */}
            <line x1="50" y1="0" x2="50" y2="60" />
            <circle cx="50" cy="30" r="10" />
            {/* Left Key */}
            <rect x="0" y="18" width="19" height="24" />
            <path d="M 19 24 A 6 6 0 0 1 19 36" />
            <circle cx="5" cy="30" r="1" fill="currentColor" />
            {/* Right Key */}
            <rect x="81" y="18" width="19" height="24" />
            <path d="M 81 24 A 6 6 0 0 0 81 36" />
            <circle cx="95" cy="30" r="1" fill="currentColor" />
            {/* 3 point lines */}
            <path d="M 0 5 A 25 25 0 0 0 0 55" />
            <path d="M 100 5 A 25 25 0 0 1 100 55" />
          </svg>
        ) : (
          // Soccer pitch lines SVG
          <svg viewBox="0 0 100 60" className="w-full h-full stroke-emerald-500/30 stroke-[0.4] fill-none">
            {/* Outline */}
            <rect x="0" y="0" width="100" height="60" />
            {/* Half line */}
            <line x1="50" y1="0" x2="50" y2="60" />
            <circle cx="50" cy="30" r="9.15" />
            {/* Left Penalty box */}
            <rect x="0" y="10" width="16.5" height="40" />
            <rect x="0" y="20.5" width="5.5" height="19" />
            <path d="M 16.5 25 A 9.15 9.15 0 0 1 16.5 35" />
            <circle cx="11" cy="30" r="0.5" fill="currentColor" />
            {/* Right Penalty box */}
            <rect x="83.5" y="10" width="16.5" height="40" />
            <rect x="94.5" y="20.5" width="5.5" height="19" />
            <path d="M 83.5 25 A 9.15 9.15 0 0 0 83.5 35" />
            <circle cx="89" cy="30" r="0.5" fill="currentColor" />
          </svg>
        )}
      </div>

      <div className="w-full flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 blur-xs" />
          <span>Yüksek Yoğunluk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40 blur-xs" />
          <span>Orta Yoğunluk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 blur-xs" />
          <span>Düşük Yoğunluk</span>
        </div>
      </div>

    </div>
  );
}
