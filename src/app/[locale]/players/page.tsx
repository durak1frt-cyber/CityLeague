'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { getItems } from '@/lib/db';
import { Search, Filter, Trophy, ArrowRight, Award } from 'lucide-react';

export default function PlayersDirectoryPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');

  useEffect(() => {
    setProfiles(getItems('profiles'));
  }, []);

  const filtered = profiles.filter((p) => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.username.toLowerCase().includes(search.toLowerCase());
    const matchesSport = sportFilter === 'all' || p.primary_sport === sportFilter;
    const matchesSkill = skillFilter === 'all' || p.skill_level === skillFilter;
    
    return matchesSearch && matchesSport && matchesSkill;
  });

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Oyuncu Havuzu</h1>
        <p className="text-sm text-muted-foreground mt-1">Platformdaki tüm lisanslı sporcuları arayın ve istatistiklerini inceleyin.</p>
      </div>

      {/* Filter / Search Bar Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={18} className="absolute left-3.5 top-3 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Oyuncu adı veya kullanıcı adı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Sport */}
        <div>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="all">Tüm Sporlar</option>
            <option value="football">Futbol</option>
            <option value="basketball">Basketbol</option>
            <option value="volleyball">Voleybol</option>
          </select>
        </div>

        {/* Skill */}
        <div>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="beginner">Başlangıç</option>
            <option value="intermediate">Orta Seviye</option>
            <option value="advanced">İleri Seviye</option>
            <option value="semi-pro">Yarı Profesyonel</option>
          </select>
        </div>

      </div>

      {/* Grid List displaying Mini Profile Card summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((player) => {
          // Compute mock overall rating for visual tag
          const baseRating = player.skill_level === 'semi-pro' ? 86 : player.skill_level === 'advanced' ? 78 : player.skill_level === 'intermediate' ? 68 : 55;

          return (
            <div
              key={player.id}
              onClick={() => router.push(`/players/${player.id}`)}
              className="bg-zinc-900/60 border border-white/5 hover:border-primary/20 rounded-2xl p-5 text-center flex flex-col items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] cursor-pointer group hover:-translate-y-1"
            >
              
              {/* Avatar & Overall Tag */}
              <div className="relative">
                <img
                  src={player.avatar_url}
                  alt={player.full_name}
                  className="w-20 h-20 rounded-full border border-white/10 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 bg-primary text-black text-[10px] font-heading font-black px-2 py-0.5 rounded-full border border-zinc-900">
                  {baseRating}
                </span>
              </div>

              {/* Name Details */}
              <div className="text-center w-full">
                <h3 className="text-sm font-heading font-extrabold text-white tracking-wider uppercase truncate">
                  {player.full_name}
                </h3>
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold mt-0.5 block">
                  @{player.username}
                </span>
              </div>

              {/* Stats badges / tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                <span className="text-[9px] font-semibold text-primary uppercase bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded-full">
                  {player.primary_sport}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                  {player.preferred_position}
                </span>
              </div>

              {/* Match Played Counter */}
              <div className="w-full flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-muted-foreground/60">
                <span>Maç: {player.aggregated_stats?.matches_played || 0}</span>
                <span className="text-primary font-bold hover:underline flex items-center gap-0.5">
                  Kartı Gör <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs text-muted-foreground">
            Arama kriterlerinize uygun oyuncu bulunamadı.
          </div>
        )}
      </div>

    </div>
  );
}
