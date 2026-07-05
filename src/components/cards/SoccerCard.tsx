'use client';

import React from 'react';
import { Award } from 'lucide-react';

interface SoccerCardProps {
  player: {
    full_name: string;
    avatar_url: string;
    preferred_position: string;
    football_nickname: string;
    skill_level: string;
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
  tier?: 'gold' | 'silver' | 'black';
}

export default function SoccerCard({ player, tier = 'gold' }: SoccerCardProps) {
  // Compute attributes based on player stats or presets
  const stats = player.aggregated_stats || {};
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const mvps = stats.mvps || 0;
  const matches = stats.matches_played || 0;

  // Mock attribute scores (out of 99) based on skill level and stats
  const base = player.skill_level === 'semi-pro' ? 85 : player.skill_level === 'advanced' ? 78 : player.skill_level === 'intermediate' ? 68 : 55;
  const pac = Math.min(99, base + Math.floor(goals * 0.8) + Math.floor(Math.random() * 5));
  const sho = Math.min(99, base + Math.floor(goals * 1.2));
  const pas = Math.min(99, base + Math.floor(assists * 1.5));
  const dri = Math.min(99, base + Math.floor(assists * 0.6) + Math.floor(Math.random() * 6));
  const def = Math.min(99, base - 10 + Math.floor(mvps * 1.2));
  const phy = Math.min(99, base + 5 + Math.floor(matches * 0.3));
  
  const rating = Math.round((pac + sho + pas + dri + def + phy) / 6);

  // Styling based on card tier
  const styles = {
    gold: {
      bg: 'bg-gradient-to-br from-amber-600 via-yellow-400 to-amber-600',
      border: 'border-yellow-300',
      glow: 'shadow-[0_0_25px_rgba(234,179,8,0.3)]',
      textColor: 'text-amber-950',
      statLabel: 'text-amber-900/70',
      accentBg: 'bg-amber-900/10'
    },
    silver: {
      bg: 'bg-gradient-to-br from-zinc-500 via-zinc-300 to-zinc-500',
      border: 'border-zinc-200',
      glow: 'shadow-[0_0_25px_rgba(228,228,231,0.2)]',
      textColor: 'text-zinc-950',
      statLabel: 'text-zinc-900/70',
      accentBg: 'bg-zinc-900/10'
    },
    black: {
      bg: 'bg-gradient-to-br from-zinc-950 via-zinc-800 to-zinc-950',
      border: 'border-primary/40',
      glow: 'shadow-[0_0_25px_rgba(180,100,50,0.4)]',
      textColor: 'text-white',
      statLabel: 'text-muted-foreground',
      accentBg: 'bg-primary/10'
    }
  }[tier];

  return (
    <div className={`relative w-[260px] h-[370px] rounded-[30px] border ${styles.border} ${styles.bg} ${styles.glow} p-1 flex flex-col items-center select-none overflow-hidden group`}>
      
      {/* Decorative soccer crest overlays */}
      <div className="absolute top-4 left-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Award size={64} className={styles.textColor} />
      </div>

      <div className="relative w-full h-full bg-zinc-950/95 rounded-[27px] p-4 flex flex-col items-center justify-between">
        
        {/* Top Header Section */}
        <div className="w-full flex justify-between items-start">
          <div className="flex flex-col items-center leading-none">
            <span className="text-4xl font-heading font-black text-primary tracking-tighter">{rating}</span>
            <span className="text-xs font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">{player.preferred_position}</span>
          </div>
          
          <div className="flex flex-col items-end opacity-60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{player.skill_level}</span>
          </div>
        </div>

        {/* Player Avatar */}
        <div className="relative w-28 h-28 mt-1">
          {/* Card framing glows */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
          <img
            src={player.avatar_url}
            alt={player.full_name}
            className="w-full h-full rounded-full border-2 border-primary/30 object-cover relative z-10"
          />
        </div>

        {/* Player Name */}
        <div className="text-center w-full mt-2">
          <h3 className="text-base font-heading font-extrabold text-white tracking-wide uppercase leading-none truncate">
            {player.football_nickname || player.full_name.split(' ')[0]}
          </h3>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold mt-1 block">
            {player.full_name}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-white/5 pt-3 mt-2 text-xs">
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">PAC</span>
            <span className="font-bold text-white">{pac}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">DRI</span>
            <span className="font-bold text-white">{dri}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">SHO</span>
            <span className="font-bold text-white">{sho}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">DEF</span>
            <span className="font-bold text-white">{def}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">PAS</span>
            <span className="font-bold text-white">{pas}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 rounded bg-white/5">
            <span className="text-muted-foreground/60 font-medium">PHY</span>
            <span className="font-bold text-white">{phy}</span>
          </div>
        </div>

        {/* Sponsor / Footer brand logo */}
        {player.personal_sponsor_logo_url ? (
          <div className="w-full flex items-center justify-center gap-1.5 border-t border-white/5 pt-2 mt-2 h-7 opacity-75">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-wider">Sponsored by</span>
            <img
              src={player.personal_sponsor_logo_url}
              alt={player.personal_sponsor_name || 'Sponsor'}
              className="h-4 w-auto object-contain filter invert brightness-200"
            />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center border-t border-white/5 pt-2 mt-2 h-7 opacity-40">
            <span className="text-[9px] text-muted-foreground font-bold tracking-widest">CITYLEAGUE LİSANS</span>
          </div>
        )}

      </div>
    </div>
  );
}
