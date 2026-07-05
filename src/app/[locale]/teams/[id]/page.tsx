'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { getItem, getItems } from '@/lib/db';
import { ShieldCheck, Award, Users, ShoppingBag, ShieldAlert, Trophy, MapPin } from 'lucide-react';

export default function TeamProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = use(params);
  const router = useRouter();

  const [team, setTeam] = useState<any | null>(null);
  const [captain, setCaptain] = useState<any | null>(null);
  const [coach, setCoach] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);

  const loadData = () => {
    const t = getItem('teams', teamId);
    if (!t) return;
    setTeam(t);

    const cap = getItem('profiles', t.captain_id);
    setCaptain(cap);

    if (t.coach_id) {
      const coa = getItem('profiles', t.coach_id);
      setCoach(coa);
    }

    // Get team members
    const members = getItems('team_members').filter((m: any) => m.team_id === teamId);
    const profiles = getItems('profiles');
    const orderItems = getItems('jersey_order_items'); // to get their jersey details if any
    
    const rosterList = members.map((m: any) => {
      const p = profiles.find((prof: any) => prof.id === m.profile_id);
      // Try to find if they have a squad number from a jersey order
      const item = orderItems.find((oi: any) => oi.profile_id === m.profile_id);
      return {
        profile: p,
        joined_at: m.joined_at,
        role: m.role,
        squad_number: item ? item.squad_number : null
      };
    });
    setRoster(rosterList);
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  if (!team) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <ShieldAlert className="text-destructive w-12 h-12 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Takım profili bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <img
            src={team.logo_url}
            alt={team.name}
            className="w-16 h-16 rounded-2xl border border-white/10 object-cover"
          />
          <div className="text-left">
            <h1 className="text-3xl font-heading font-black text-white uppercase tracking-wider">{team.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin size={12} className="text-primary" /> {team.city} Kulübü • Branş: {team.sport.toUpperCase()}
            </p>
          </div>
        </div>

        {team.team_sponsor_logo_url && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-2xl">
            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase">SPONSOR</span>
            <img
              src={team.team_sponsor_logo_url}
              alt={team.team_sponsor_name}
              className="h-6 w-auto object-contain filter invert brightness-200"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Jersey design snapshot & Team info card */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Takım Zırhı / Forma</h2>

          {/* Jersey visual preview */}
          {team.jersey_design ? (
            <div className="bg-zinc-950 border border-white/5 p-6 rounded-3xl flex flex-col items-center">
              <div className="w-full flex items-center justify-center p-4">
                {/* SVG Jersey Representation */}
                <svg viewBox="0 0 400 450" className="w-full h-72 drop-shadow-2xl">
                  {/* Sleeve markings */}
                  <path d="M 130 90 L 70 140 L 95 180 L 135 150 Z" fill={team.jersey_design.primaryColor} stroke={team.jersey_design.accentColor} strokeWidth="2" />
                  <path d="M 270 90 L 330 140 L 305 180 L 265 150 Z" fill={team.jersey_design.primaryColor} stroke={team.jersey_design.accentColor} strokeWidth="2" />
                  {/* Main Torso */}
                  <path d="M 130 90 C 150 110 250 110 270 90 L 275 150 L 265 410 L 135 410 L 125 150 Z" fill={team.jersey_design.templateId === 'striped' ? 'url(#stripes-t)' : team.jersey_design.templateId === 'hooped' ? 'url(#hoops-t)' : team.jersey_design.primaryColor} stroke={team.jersey_design.accentColor} strokeWidth="3" />
                  <path d="M 130 90 C 150 110 250 110 270 90" fill="none" stroke={team.jersey_design.accentColor} strokeWidth="10" />
                  
                  {/* Squad Number */}
                  <text x="200" y="270" textAnchor="middle" fill={team.jersey_design.accentColor} fontFamily="Outfit, sans-serif" fontSize="80" fontWeight="900">{team.jersey_design.number || '10'}</text>
                  
                  {/* Lettering Text */}
                  <text x="200" y="160" textAnchor="middle" fill={team.jersey_design.accentColor} fontFamily="Outfit, sans-serif" fontSize="22" fontWeight="800">{team.jersey_design.text || 'CITY'}</text>
                  
                  {/* Definitions */}
                  <defs>
                    <pattern id="stripes-t" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="20" height="40" fill={team.jersey_design.primaryColor} />
                      <rect x="20" width="20" height="40" fill={team.jersey_design.secondaryColor} />
                    </pattern>
                    <pattern id="hoops-t" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="40" height="20" fill={team.jersey_design.primaryColor} />
                      <rect y="20" width="40" height="20" fill={team.jersey_design.secondaryColor} />
                    </pattern>
                  </defs>
                </svg>
              </div>

              <div className="w-full border-t border-white/5 pt-4 mt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <ShoppingBag size={14} className="text-primary" />
                <span>Renk Kodları: {team.jersey_design.primaryColor} &amp; {team.jersey_design.secondaryColor}</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-white/5 p-12 rounded-3xl text-center text-xs text-muted-foreground">
              Forma tasarımı bulunmamaktadır.
            </div>
          )}

          {/* About Team */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 text-left space-y-3">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Takım Hikayesi</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {team.description || 'Bu takım henüz bir kulüp hikayesi eklememiş.'}
            </p>
          </div>
        </div>

        {/* Right Side: Roster list & stats */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest text-left">Takım Kadrosu</h2>

          {/* Roster profiles list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roster.map((member) => (
              <div
                key={member.profile.id}
                onClick={() => router.push(`/players/${member.profile.id}`)}
                className="bg-zinc-900/60 border border-white/5 hover:border-primary/20 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-lg transition-all group text-xs text-left"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.profile.avatar_url}
                    alt={member.profile.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <div className="font-extrabold text-white leading-tight uppercase group-hover:text-primary transition-colors">
                      {member.profile.full_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {member.profile.preferred_position} • {member.profile.skill_level}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {member.squad_number ? (
                    <span className="text-lg font-heading font-black text-primary pr-2">
                      #{member.squad_number}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/30 pr-2">
                      No Yok
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-muted-foreground uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded-full ml-1">
                    {member.role === 'captain' ? 'KAPTAN' : 'OYUNCU'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Technical staff card */}
          {(captain || coach) && (
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 text-left space-y-4">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Teknik Ekip</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {captain && (
                  <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl">
                    <img src={captain.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="text-[10px] font-bold text-primary uppercase">Takım Kaptanı</div>
                      <div className="text-xs font-bold text-white mt-0.5">{captain.full_name}</div>
                    </div>
                  </div>
                )}

                {coach ? (
                  <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl">
                    <img src={coach.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="text-[10px] font-bold text-accent uppercase">Teknik Sorumlu</div>
                      <div className="text-xs font-bold text-white mt-0.5">{coach.full_name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 bg-black/20 border border-dashed border-white/5 rounded-xl text-[10px] text-muted-foreground/50">
                    Kayıtlı teknik sorumlu antrenör yok.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
