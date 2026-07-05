'use client';

import React from 'react';
import { Target } from 'lucide-react';

interface BasketballCardProps {
  player: {
    full_name: string;
    avatar_url: string;
    preferred_position: string;
    skill_level: string;
    personal_sponsor_logo_url?: string;
    personal_sponsor_name?: string;
    aggregated_stats?: {
      wins?: number;
      matches_played?: number;
      goals?: number; // repurposed as points if needed, or defaults
      assists?: number;
      mvps?: number;
    };
  };
}

export default function BasketballCard({ player }: BasketballCardProps) {
  const stats = player.aggregated_stats || {};
  const wins = stats.wins || 0;
  const matches = stats.matches_played || 0;

  // Mock attributes
  const base = player.skill_level === 'semi-pro' ? 88 : player.skill_level === 'advanced' ? 80 : player.skill_level === 'intermediate' ? 70 : 60;
  
  const ppg = (base / 5 + (wins * 0.4)).toFixed(1);
  const rpg = (base / 10 + (Math.random() * 4)).toFixed(1);
  const apg = (base / 12 + (stats.assists || 0) * 0.2).toFixed(1);
  const spg = (1.2 + (Math.random() * 1.5)).toFixed(1);
  const bpg = (0.5 + (Math.random() * 1.2)).toFixed(1);
  const fg = Math.min(99, base - 25 + Math.floor(Math.random() * 15)) + '%';

  return (
    <div className="relative w-[260px] h-[370px] rounded-[30px] border border-cyan-500/30 bg-zinc-950 shadow-[0_0_25px_rgba(6,182,212,0.15)] p-[2px] flex flex-col overflow-hidden group select-none">
      
      {/* Dynamic neon linear gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-zinc-900 to-indigo-500 opacity-20" />
      
      <div className="relative w-full h-full bg-zinc-950/95 rounded-[28px] p-4 flex flex-col items-center justify-between z-10">
        
        {/* Top Header */}
        <div className="w-full flex justify-between items-center">
          <div className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
            {player.preferred_position}
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <Target size={12} className="text-cyan-400" />
            <span className="text-[10px] font-heading font-semibold text-white tracking-wider uppercase">{player.skill_level}</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative w-28 h-28 mt-2">
          {/* Circular neon frame */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/40 p-1 flex items-center justify-center animate-pulse">
            <div className="w-full h-full rounded-full border border-cyan-500/10" />
          </div>
          <img
            src={player.avatar_url}
            alt={player.full_name}
            className="w-[104px] h-[104px] rounded-full object-cover mx-auto absolute top-1 left-1 border border-white/10"
          />
        </div>

        {/* Player Name */}
        <div className="text-center w-full mt-2">
          <h3 className="text-sm font-heading font-extrabold text-white tracking-wider uppercase leading-none truncate">
            {player.full_name}
          </h3>
          <span className="text-[9px] text-cyan-400/80 uppercase font-bold tracking-widest mt-1 block">
            BASKETBALL ATHLETE
          </span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-2 text-center">
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">PPG</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{ppg}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">RPG</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{rpg}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">APG</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{apg}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">SPG</div>
            <div className="text-xs font-semibold text-white mt-0.5">{spg}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">BPG</div>
            <div className="text-xs font-semibold text-white mt-0.5">{bpg}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">FG%</div>
            <div className="text-xs font-semibold text-white mt-0.5">{fg}</div>
          </div>
        </div>

        {/* Sponsor */}
        {player.personal_sponsor_logo_url ? (
          <div className="w-full flex items-center justify-center gap-1.5 border-t border-white/5 pt-2 mt-2 h-7 opacity-75">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wider">Sponsor</span>
            <img
              src={player.personal_sponsor_logo_url}
              alt={player.personal_sponsor_name || 'Sponsor'}
              className="h-3 w-auto object-contain filter invert brightness-200"
            />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center border-t border-white/5 pt-2 mt-2 h-7 opacity-30">
            <span className="text-[9px] text-muted-foreground font-bold tracking-widest">CITYLEAGUE LİSANS</span>
          </div>
        )}

      </div>
    </div>
  );
}
