'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface GenericCardProps {
  player: {
    full_name: string;
    avatar_url: string;
    preferred_position: string;
    skill_level: string;
    primary_sport: string;
    personal_sponsor_logo_url?: string;
    personal_sponsor_name?: string;
    aggregated_stats?: {
      wins?: number;
      matches_played?: number;
      goals?: number;
      assists?: number;
      mvps?: number;
    };
  };
}

export default function GenericCard({ player }: GenericCardProps) {
  const stats = player.aggregated_stats || {};
  const base = player.skill_level === 'semi-pro' ? 85 : player.skill_level === 'advanced' ? 75 : player.skill_level === 'intermediate' ? 65 : 55;

  // Custom stats based on sport type (e.g. Volleyball)
  const isVolleyball = player.primary_sport === 'volleyball';
  const label1 = isVolleyball ? 'KILLS' : 'WINS';
  const val1 = isVolleyball ? (base / 10 + (stats.goals || 0) * 0.5).toFixed(1) : stats.wins || 0;
  
  const label2 = isVolleyball ? 'BLOCKS' : 'MATCHES';
  const val2 = isVolleyball ? (base / 15 + (stats.mvps || 0) * 0.4).toFixed(1) : stats.matches_played || 0;

  const label3 = isVolleyball ? 'DIGS' : 'SKILL';
  const val3 = isVolleyball ? (base / 12 + (stats.assists || 0) * 0.3).toFixed(1) : base;

  return (
    <div className="relative w-[260px] h-[370px] rounded-[30px] border border-lime-500/30 bg-zinc-950 shadow-[0_0_25px_rgba(132,204,22,0.15)] p-[2px] flex flex-col overflow-hidden group select-none">
      
      {/* Light neon gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-500 via-zinc-900 to-emerald-500 opacity-20" />
      
      <div className="relative w-full h-full bg-zinc-950/95 rounded-[28px] p-4 flex flex-col items-center justify-between z-10">
        
        {/* Top Header */}
        <div className="w-full flex justify-between items-center">
          <div className="bg-lime-500/10 border border-lime-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-lime-400 uppercase tracking-widest">
            {player.preferred_position}
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <ShieldCheck size={12} className="text-lime-400" />
            <span className="text-[10px] font-heading font-semibold text-white tracking-wider uppercase">{player.skill_level}</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative w-28 h-28 mt-2">
          <div className="absolute inset-0 rounded-full border border-lime-500/40 p-1 flex items-center justify-center animate-pulse">
            <div className="w-full h-full rounded-full border border-lime-500/10" />
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
          <span className="text-[9px] text-lime-400/80 uppercase font-bold tracking-widest mt-1 block">
            {player.primary_sport} ATHLETE
          </span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-2 text-center">
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">{label1}</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{val1}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">{label2}</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{val2}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">{label3}</div>
            <div className="text-sm font-heading font-black text-white mt-0.5">{val3}</div>
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
