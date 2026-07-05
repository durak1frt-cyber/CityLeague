'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItem, getItems, updateItem, insertItem } from '@/lib/db';
import SoccerCard from '@/components/cards/SoccerCard';
import BasketballCard from '@/components/cards/BasketballCard';
import GenericCard from '@/components/cards/GenericCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Trophy, Calendar, Award, Edit2, Check, Share2, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: playerId } = use(params);
  const router = useRouter();
  const { user, switchUser } = useAuth();

  const [profile, setProfile] = useState<any | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [bio, setBio] = useState('');
  const [footballNickname, setFootballNickname] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');

  const loadData = () => {
    const p = getItem('profiles', playerId);
    if (!p) return;
    setProfile(p);

    setBio(p.bio || '');
    setFootballNickname(p.football_nickname || '');
    setPreferredPosition(p.preferred_position || '');
    setSkillLevel(p.skill_level || 'intermediate');
    setSponsorName(p.personal_sponsor_name || '');
    setSponsorLogo(p.personal_sponsor_logo_url || '');

    // Get match history
    const allStats = getItems('player_match_stats').filter((s: any) => s.player_id === playerId);
    const matches = getItems('matches');
    const teams = getItems('teams');

    const history = allStats.map((s: any) => {
      const match = matches.find((m: any) => m.id === s.match_id);
      if (!match) return null;
      const homeTeam = teams.find((t: any) => t.id === match.home_team_id);
      const awayTeam = teams.find((t: any) => t.id === match.away_team_id);
      return {
        stats: s.stats_values,
        match,
        homeTeam,
        awayTeam
      };
    }).filter(Boolean);

    setMatchHistory(history);
  };

  useEffect(() => {
    loadData();
  }, [playerId]);

  if (!profile) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <ShieldAlert className="text-destructive w-12 h-12 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Oyuncu profili bulunamadı.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && user.id === profile.id;

  const handleSave = () => {
    const updated = updateItem('profiles', profile.id, {
      bio,
      football_nickname: footballNickname.toUpperCase(),
      preferred_position: preferredPosition,
      skill_level: skillLevel,
      personal_sponsor_name: sponsorName,
      personal_sponsor_logo_url: sponsorLogo
    });

    setProfile(updated);
    setIsEditing(false);
    if (isOwnProfile) {
      switchUser(profile.id);
    }
    loadData();
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    confetti({ particleCount: 80, spread: 80 });
    alert('Oyuncu profil adresi panoya kopyalandı! Sosyal medyada paylaşabilirsiniz.');
  };

  // Recharts radar data computation
  const baseRating = profile.skill_level === 'semi-pro' ? 85 : profile.skill_level === 'advanced' ? 76 : profile.skill_level === 'intermediate' ? 66 : 52;
  const radarData = [
    { subject: 'Hız (PAC)', A: baseRating + 5, fullMark: 100 },
    { subject: 'Şut (SHO)', A: baseRating - 2, fullMark: 100 },
    { subject: 'Pas (PAS)', A: baseRating + 8, fullMark: 100 },
    { subject: 'Top Kontrol (DRI)', A: baseRating + 3, fullMark: 100 },
    { subject: 'Defans (DEF)', A: baseRating - 10, fullMark: 100 },
    { subject: 'Kondisyon (PHY)', A: baseRating + 12, fullMark: 100 },
  ];

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-16 h-16 rounded-full border border-primary/20 object-cover"
          />
          <div className="text-left">
            <h1 className="text-2xl font-heading font-black text-white uppercase tracking-wider">{profile.full_name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">@{profile.username} • {profile.city}, {profile.location_detail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 border border-white/10 hover:bg-white/5 text-xs font-bold text-white rounded-xl transition-all font-heading uppercase"
          >
            <Share2 size={14} className="text-primary" /> Paylaş
          </button>
          
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-xl transition-all font-heading uppercase"
            >
              {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
              {isEditing ? 'Vazgeç' : 'Profili Düzenle'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Col 1: Card display & Details edit */}
        <div className="lg:col-span-1 space-y-6 flex flex-col items-center">
          {/* Card Component */}
          {profile.primary_sport === 'football' ? (
            <SoccerCard player={profile} tier="gold" />
          ) : profile.primary_sport === 'basketball' ? (
            <BasketballCard player={profile} />
          ) : (
            <GenericCard player={profile} />
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="w-full bg-zinc-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detayları Güncelle</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Forma Arkası İsmi</label>
                  <input
                    type="text"
                    value={footballNickname}
                    onChange={(e) => setFootballNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Biyografi</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Sponsor Adı</label>
                  <input
                    type="text"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Sponsor Logo URL</label>
                  <input
                    type="text"
                    value={sponsorLogo}
                    onChange={(e) => setSponsorLogo(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full py-2.5 bg-primary text-black hover:bg-primary/95 text-xs font-bold rounded-xl transition-all font-heading uppercase"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Col 2 & 3: Statistics charts, Radar, and Match History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Analytics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Radar Attribute Chart */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 self-start">Karakteristik Analiz</h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" stroke="#888" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#333" tick={false} />
                    <Radar name={profile.full_name} dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Aggregated Stats Numbers */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">İstatistik Raporu</h3>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Oynanan Maç</div>
                  <div className="text-xl font-heading font-black text-white mt-1">{profile.aggregated_stats?.matches_played || 0}</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Galibiyet</div>
                  <div className="text-xl font-heading font-black text-white mt-1">{profile.aggregated_stats?.wins || 0}</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Goller (Sayı)</div>
                  <div className="text-xl font-heading font-black text-white mt-1">{profile.aggregated_stats?.goals || 0}</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Asist</div>
                  <div className="text-xl font-heading font-black text-white mt-1">{profile.aggregated_stats?.assists || 0}</div>
                </div>
              </div>

              {/* Bio summary */}
              <div className="border-t border-white/5 pt-3 text-left">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Oyuncu Hakkında</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{profile.bio || 'Oyuncu henüz bir biyografi girmemiş.'}</p>
              </div>
            </div>

          </div>

          {/* Match History timeline */}
          <div className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl space-y-4 text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Son Karşılaşmalar</h3>

            {matchHistory.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Henüz kayıtlı maç verisi bulunmamaktadır.
              </div>
            ) : (
              <div className="space-y-4">
                {matchHistory.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/30 border border-white/5 rounded-2xl gap-4 hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => router.push(`/matches/${item.match.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 font-heading font-bold text-xs text-white">
                        <span>{item.homeTeam?.name}</span>
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm">
                          {item.match.home_score} - {item.match.away_score}
                        </span>
                        <span>{item.awayTeam?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      {/* Match specific stats highlights */}
                      <div className="flex gap-4 text-[11px] text-muted-foreground">
                        {item.stats.goals > 0 && (
                          <span>⚽ {item.stats.goals} Gol</span>
                        )}
                        {item.stats.assists > 0 && (
                          <span>👟 {item.stats.assists} Asist</span>
                        )}
                        {item.stats.mvp && (
                          <span className="text-primary font-semibold">⭐ MVP</span>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground/40 font-semibold tracking-wider">
                        {new Date(item.match.match_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
