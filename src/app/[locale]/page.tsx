'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, insertItem } from '@/lib/db';
import { Play, Trophy, Users, ShieldAlert, Award, ArrowRight, Share2, MessageCircle, Sparkles } from 'lucide-react';
import SoccerCard from '@/components/cards/SoccerCard';
import confetti from 'canvas-confetti';

export default function Homepage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  const [freeAgents, setFreeAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const loadData = () => {
    setTournaments(getItems('tournaments').slice(0, 3));
    setMatches(getItems('matches'));
    setTeams(getItems('teams'));
    
    // Feed
    const feeds = getItems('feed_events');
    setFeedEvents(feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // Free agents from recruitment
    const listings = getItems('recruitment_listings').filter((l: any) => l.type === 'player_seeking_team');
    const profiles = getItems('profiles');
    const agents = listings.map((l: any) => profiles.find(p => p.id === l.creator_id)).filter(Boolean);
    setFreeAgents(agents.slice(0, 3));

    // Global leaderboards top 3 players
    const ranked = [...profiles].sort((a: any, b: any) => (b.aggregated_stats?.wins || 0) - (a.aggregated_stats?.wins || 0));
    setLeaderboard(ranked.slice(0, 3));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTeamName = (teamId: string) => {
    const t = getItems('teams').find((tm: any) => tm.id === teamId);
    return t ? t.name : 'TBD';
  };

  const getTeamLogo = (teamId: string) => {
    const t = getItems('teams').find((tm: any) => tm.id === teamId);
    return t ? t.logo_url : 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=64&h=64&q=80';
  };

  const handleShareFeed = (id: string) => {
    alert('Haber/Özet bağlantısı kopyalandı! Arkadaşlarınızla paylaşın.');
    confetti({ particleCount: 30, spread: 40 });
  };

  const liveOrUpcoming = matches.slice(0, 4);

  return (
    <div className="flex-grow space-y-12 pb-16">
      
      {/* 1. Hero Banner */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 text-center bg-zinc-950 overflow-hidden min-h-[480px] flex items-center justify-center">
        {/* Neon glowing center background */}
        <div className="absolute w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-4xl space-y-6 z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest leading-none">
            <Sparkles size={12} className="animate-spin" /> Şehrinin Ligi Başlıyor
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-heading font-black text-white uppercase tracking-wider leading-[1.1]">
            Şehrinin Ligi, <span className="text-primary">Senin Sahân!</span>
          </h1>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Yerel spor turnuvalarına katılın, takımınızı kurun, formanızı tasarlayın ve profesyonel VAR/telemetri analizleriyle performansınızı takip edin.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => router.push('/recruitment')}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/95 transition-all font-heading uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.25)]"
            >
              Takımını Kur / Bul
            </button>
            <button
              onClick={() => router.push('/tournaments')}
              className="w-full sm:w-auto px-8 py-3.5 border border-white/10 hover:bg-white/5 text-xs font-bold text-white rounded-xl transition-all font-heading uppercase tracking-widest"
            >
              Turnuvaları İncele
            </button>
          </div>
        </div>
      </section>

      {/* 2. Matches Ticker Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <h2 className="text-xs font-heading font-black text-muted-foreground uppercase tracking-widest mb-4">Maç Fikstürü & Canlı Ticker</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveOrUpcoming.map((m) => (
            <div
              key={m.id}
              onClick={() => router.push(m.status === 'completed' ? `/matches/${m.id}` : `/tournaments/${m.tournament_id}`)}
              className="bg-zinc-900/60 border border-white/5 hover:border-primary/20 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-xl transition-all duration-300"
            >
              <div className="space-y-2 text-xs font-heading font-bold text-left flex-grow">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <img src={getTeamLogo(m.home_team_id)} alt="" className="w-5 h-5 rounded object-cover" />
                    <span className="text-white truncate max-w-[80px]">{getTeamName(m.home_team_id)}</span>
                  </div>
                  <span className="text-white">{m.status === 'completed' ? m.home_score : '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <img src={getTeamLogo(m.away_team_id)} alt="" className="w-5 h-5 rounded object-cover" />
                    <span className="text-white truncate max-w-[80px]">{getTeamName(m.away_team_id)}</span>
                  </div>
                  <span className="text-white">{m.status === 'completed' ? m.away_score : '-'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 border-l border-white/5 pl-4 ml-4">
                {m.status === 'completed' ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">MS</span>
                ) : (
                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full animate-pulse">CANLI</span>
                )}
                <span className="text-[8px] text-muted-foreground/50">{new Date(m.match_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Tournaments & Leaderboards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Featured Tournaments (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-heading font-black text-muted-foreground uppercase tracking-widest">Öne Çıkan Ligler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/tournaments/${t.id}`)}
                className="bg-zinc-900/60 border border-white/5 hover:border-primary/20 p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{t.sport}</span>
                    <h3 className="text-base font-heading font-extrabold text-white uppercase tracking-wider mt-2 leading-tight">{t.name}</h3>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl"><Trophy size={16} className="text-primary" /></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 border-t border-white/5 pt-3 mt-2">
                  <span>Format: {t.format === 'single_elimination' ? 'Knockout' : 'Lig standardı'}</span>
                  <span className="text-primary font-bold">Detayları Gör &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Top Players spotlight (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-heading font-black text-muted-foreground uppercase tracking-widest">Haftanın Oyuncuları</h2>
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
            {leaderboard.map((player, idx) => (
              <div
                key={player.id}
                onClick={() => router.push(`/players/${player.id}`)}
                className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl cursor-pointer hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-heading font-black text-muted-foreground w-4">#{idx + 1}</span>
                  <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  <div className="text-left leading-none">
                    <span className="text-xs font-heading font-extrabold text-white uppercase tracking-wide">{player.full_name}</span>
                    <span className="text-[9px] text-muted-foreground/60 block mt-0.5">@{player.username}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary">{player.aggregated_stats?.wins} Galibiyet</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Match Highlights Feed Story feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-heading font-black text-muted-foreground uppercase tracking-widest">Maç Özetleri & VAR Kurguları</h2>
          
          <div className="space-y-6">
            {feedEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{evt.event_type}</span>
                    <h3 className="text-base font-heading font-extrabold text-white uppercase tracking-wider mt-2">{evt.title}</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 font-semibold">{new Date(evt.created_at).toLocaleDateString()}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{evt.description}</p>

                {evt.media_url && (
                  evt.media_type === 'video' ? (
                    <video src={evt.media_url} controls className="w-full h-56 rounded-2xl object-cover border border-white/10 bg-black" />
                  ) : (
                    <img src={evt.media_url} alt="" className="w-full h-56 rounded-2xl object-cover border border-white/10" />
                  )
                )}

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  {evt.match_id ? (
                    <button
                      onClick={() => router.push(`/matches/${evt.match_id}`)}
                      className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline uppercase"
                    >
                      <Play size={10} fill="currentColor" /> VAR Telemetri Analizi
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => handleShareFeed(evt.id)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white uppercase font-bold"
                  >
                    <Share2 size={12} /> Paylaş
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free Agents Column (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-heading font-black text-muted-foreground uppercase tracking-widest">Serbest Oyuncu Vitrini</h2>
          <div className="space-y-4">
            {freeAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => router.push(`/players/${agent.id}`)}
                className="bg-zinc-900/60 border border-white/5 hover:border-primary/20 p-5 rounded-3xl cursor-pointer hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center gap-3"
              >
                <img src={agent.avatar_url} alt="" className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                
                <div className="text-center">
                  <h4 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">{agent.full_name}</h4>
                  <span className="text-[9px] text-primary font-bold uppercase tracking-widest block mt-1">{agent.preferred_position} ({agent.skill_level})</span>
                </div>

                <p className="text-[10px] text-muted-foreground leading-normal max-w-[180px] truncate">{agent.bio}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
