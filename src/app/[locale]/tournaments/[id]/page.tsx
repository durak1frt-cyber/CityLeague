'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItem, getItems, insertItem, updateItem } from '@/lib/db';
import { generateKnockoutBracket } from '@/lib/bracket-engine';
import { generateRoundRobinFixtures, calculateStandings } from '@/lib/round-robin-engine';
import { Trophy, Calendar, MapPin, Users, Award, Play, AlertCircle, CheckCircle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<any | null>(null);
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  
  // Roster checks
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [isMyTeamRegistered, setIsMyTeamRegistered] = useState(false);

  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'leaderboard' | 'feed'>('fixtures');

  const loadData = () => {
    const t = getItem('tournaments', tournamentId);
    if (!t) return;
    setTournament(t);

    // Get approved teams registered for this tournament
    const relations = getItems('tournament_teams').filter((r: any) => r.tournament_id === tournamentId && r.status === 'approved');
    setRegisteredTeams(relations);

    // Get matches
    const allMatches = getItems('matches').filter((m: any) => m.tournament_id === tournamentId);
    setMatches(allMatches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()));

    // Standings (for Round Robin)
    if (t.format === 'round_robin') {
      const calculated = calculateStandings(tournamentId, relations);
      setStandings(calculated);
    }

    // Load feed events
    const feeds = getItems('feed_events').filter((f: any) => f.tournament_id === tournamentId);
    setFeedEvents(feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // Load tournament leaderboard (aggregate player stats for matches in this tournament)
    const matchIds = allMatches.map(m => m.id);
    const allPlayerStats = getItems('player_match_stats').filter(s => matchIds.includes(s.match_id));
    const profiles = getItems('profiles');
    
    // Aggregate
    const playerAggMap: { [pId: string]: any } = {};
    allPlayerStats.forEach(stat => {
      if (!playerAggMap[stat.player_id]) {
        const p = profiles.find(prof => prof.id === stat.player_id);
        playerAggMap[stat.player_id] = {
          profile: p,
          goals: 0,
          assists: 0,
          mvps: 0
        };
      }
      playerAggMap[stat.player_id].goals += stat.stats_values.goals || 0;
      playerAggMap[stat.player_id].assists += stat.stats_values.assists || 0;
      if (stat.stats_values.mvp) {
        playerAggMap[stat.player_id].mvps += 1;
      }
    });

    const leaderboardList = Object.values(playerAggMap).sort((a: any, b: any) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.assists - a.assists;
    });
    setLeaderboard(leaderboardList);

    if (user) {
      // Find my team
      const allTeams = getItems('teams');
      const team = allTeams.find(tm => tm.captain_id === user.id);
      setMyTeam(team || null);

      if (team) {
        const registered = getItems('tournament_teams').some(r => r.tournament_id === tournamentId && r.team_id === team.id);
        setIsMyTeamRegistered(registered);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [tournamentId, user]);

  if (!tournament) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <AlertCircle className="text-destructive w-12 h-12 mx-auto mb-4 animate-bounce" />
          <p className="text-sm text-muted-foreground">Turnuva ayrıntıları yüklenemedi veya bulunamadı.</p>
        </div>
      </div>
    );
  }

  const handleRegisterTeam = () => {
    if (!myTeam || isMyTeamRegistered) return;

    // Check roster size completion
    const members = getItems('team_members').filter(m => m.team_id === myTeam.id);
    if (members.length < tournament.required_roster_size) {
      alert(`Kayıt başarısız. Takımınızın kadrosu bu turnuva için gerekli oyuncu sayısına (${tournament.required_roster_size}) ulaşmamıştır.`);
      return;
    }

    // Insert registration relation
    insertItem('tournament_teams', {
      tournament_id: tournamentId,
      team_id: myTeam.id,
      status: 'approved', // instantly approve for mock simplicity
      roster_complete: true
    });

    setIsMyTeamRegistered(true);
    confetti({ particleCount: 100, spread: 70 });
    
    // Log feed event
    insertItem('feed_events', {
      event_type: 'tournament_announced',
      tournament_id: tournamentId,
      title: `${myTeam.name} Turnuvaya Kaydoldu!`,
      description: `${myTeam.name} takımı resmi evraklarını tamamlayarak City Cup 2026 turnuvasına kaydını yaptırdı.`,
      media_url: myTeam.logo_url,
      media_type: 'photo'
    });

    loadData();
  };

  const getTeamName = (teamId: string) => {
    if (!teamId) return 'TBD';
    const t = getItem('teams', teamId);
    return t ? t.name : 'Unknown';
  };

  const getTeamLogo = (teamId: string) => {
    if (!teamId) return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=64&h=64&q=80';
    const t = getItem('teams', teamId);
    return t ? t.logo_url : '';
  };

  // Group matches by round for bracket view
  const matchesByRound: { [round: number]: any[] } = {};
  matches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Top Banner Header */}
      <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
              {tournament.status}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">{tournament.sport} • {tournament.format === 'single_elimination' ? 'KNOCKOUT ELEME' : 'LİG FORMATI'}</span>
          </div>

          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-wider">{tournament.name}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> Son Kayıt: {new Date(tournament.registration_deadline).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> Katılanlar: {registeredTeams.length} / {tournament.max_teams} Takım</span>
            <span className="flex items-center gap-1.5"><Award size={14} className="text-primary" /> Roster Limit: En Az {tournament.required_roster_size} Oyuncu</span>
          </div>
        </div>

        {/* Action Button for Captains */}
        {myTeam && !isMyTeamRegistered && tournament.status === 'pending_activation' && (
          <button
            onClick={handleRegisterTeam}
            className="flex items-center justify-center gap-1.5 px-6 py-3 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/90 transition-all font-heading uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            Takımımı Kaydet
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-white/5 flex gap-6 text-sm font-heading font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'fixtures' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          {tournament.format === 'single_elimination' ? 'Turnuva Ağacı' : 'Maç Fikstürü'}
        </button>

        {tournament.format === 'round_robin' && (
          <button
            onClick={() => setActiveTab('standings')}
            className={`pb-3 border-b-2 transition-all ${activeTab === 'standings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
          >
            Puan Durumu
          </button>
        )}

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Gol Krallığı
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Turnuva Akışı
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Panel 1: Brackets or fixtures */}
        {activeTab === 'fixtures' && (
          <div className="w-full">
            {tournament.format === 'single_elimination' ? (
              // Knockout Tree Column Layout
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
                {Object.keys(matchesByRound).map((roundStr) => {
                  const rnd = parseInt(roundStr);
                  const roundMatches = matchesByRound[rnd];
                  return (
                    <div key={rnd} className="w-full max-w-sm space-y-6">
                      <h3 className="text-xs font-heading font-black text-primary tracking-widest uppercase text-center bg-primary/10 py-1.5 rounded-xl border border-primary/20">
                        {rnd === 1 ? 'YARI FİNALLER (ROUND 1)' : 'BÜYÜK FİNAL (ROUND 2)'}
                      </h3>

                      <div className="space-y-4">
                        {roundMatches.map((m) => {
                          const isHomeWin = m.status === 'completed' && m.home_score > m.away_score;
                          const isAwayWin = m.status === 'completed' && m.home_score < m.away_score;

                          return (
                            <div
                              key={m.id}
                              onClick={() => router.push(`/matches/${m.id}`)}
                              className="bg-zinc-900 border border-white/5 hover:border-primary/20 p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 group"
                            >
                              <div className="space-y-3 font-heading font-bold text-xs text-left">
                                {/* Home Team Row */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <img src={getTeamLogo(m.home_team_id)} alt="" className="w-6 h-6 rounded-md object-cover border border-white/10" />
                                    <span className={`${isHomeWin ? 'text-white font-extrabold' : 'text-muted-foreground'}`}>{getTeamName(m.home_team_id)}</span>
                                  </div>
                                  {m.status === 'completed' ? (
                                    <span className={`text-sm ${isHomeWin ? 'text-primary font-black' : 'text-muted-foreground'}`}>{m.home_score}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/30 font-sans">-</span>
                                  )}
                                </div>

                                {/* Away Team Row */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <img src={getTeamLogo(m.away_team_id)} alt="" className="w-6 h-6 rounded-md object-cover border border-white/10" />
                                    <span className={`${isAwayWin ? 'text-white font-extrabold' : 'text-muted-foreground'}`}>{getTeamName(m.away_team_id)}</span>
                                  </div>
                                  {m.status === 'completed' ? (
                                    <span className={`text-sm ${isAwayWin ? 'text-primary font-black' : 'text-muted-foreground'}`}>{m.away_score}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/30 font-sans">-</span>
                                  )}
                                </div>
                              </div>

                              {/* Footer details */}
                              <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between text-[9px] text-muted-foreground/60">
                                <span>{new Date(m.match_date).toLocaleDateString()}</span>
                                <span className="text-primary font-bold hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Detaylar <Play size={10} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Round Robin schedule round-by-round list
              <div className="space-y-6 max-w-2xl mx-auto">
                {Object.keys(matchesByRound).map((roundStr) => {
                  const rnd = parseInt(roundStr);
                  const roundMatches = matchesByRound[rnd];
                  return (
                    <div key={rnd} className="space-y-3">
                      <h3 className="text-xs font-heading font-black text-primary tracking-widest uppercase border-b border-primary/20 pb-2">
                        {rnd}. Maç Günü (Hafta)
                      </h3>

                      <div className="grid grid-cols-1 gap-3">
                        {roundMatches.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => router.push(`/matches/${m.id}`)}
                            className="bg-zinc-900 border border-white/5 hover:border-primary/20 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:shadow transition-all text-xs"
                          >
                            <div className="flex items-center gap-6 font-heading font-bold">
                              <span className="w-20 text-right truncate text-white">{getTeamName(m.home_team_id)}</span>
                              <span className="px-3 py-1 bg-white/5 rounded-lg text-primary font-black">
                                {m.status === 'completed' ? `${m.home_score} - ${m.away_score}` : 'vs'}
                              </span>
                              <span className="w-20 text-left truncate text-white">{getTeamName(m.away_team_id)}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground/40 font-semibold uppercase">
                              {new Date(m.match_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Standings */}
        {activeTab === 'standings' && (
          <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                <thead className="bg-black/60 text-muted-foreground font-heading">
                  <tr>
                    <th className="px-4 py-3 font-bold">Sıra</th>
                    <th className="px-4 py-3 font-bold">Takım</th>
                    <th className="px-4 py-3 font-bold text-center">O</th>
                    <th className="px-4 py-3 font-bold text-center">G</th>
                    <th className="px-4 py-3 font-bold text-center">B</th>
                    <th className="px-4 py-3 font-bold text-center">M</th>
                    <th className="px-4 py-3 font-bold text-center">AG</th>
                    <th className="px-4 py-3 font-bold text-center">YG</th>
                    <th className="px-4 py-3 font-bold text-center">AV</th>
                    <th className="px-4 py-3 font-bold text-center text-primary">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-zinc-900/10">
                  {standings.map((row, idx) => (
                    <tr key={row.teamId} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 flex items-center gap-3 font-heading font-extrabold text-white">
                        <img src={row.logoUrl} alt="" className="w-6 h-6 rounded-md object-cover border border-white/10" />
                        <span>{row.teamName}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-white">{row.played}</td>
                      <td className="px-4 py-3 text-center text-white">{row.wins}</td>
                      <td className="px-4 py-3 text-center text-white">{row.draws}</td>
                      <td className="px-4 py-3 text-center text-white">{row.losses}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.goalsFor}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.goalsAgainst}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-rose-400' : 'text-white'}`}>
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="px-4 py-3 text-center font-heading font-black text-primary text-sm">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 3: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="max-w-2xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  İstatistik kaydı bulunmuyor. Gol krallığı lig karşılaşmalarının tamamlanmasıyla güncellenecektir.
                </div>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={item.profile.id}
                    onClick={() => router.push(`/players/${item.profile.id}`)}
                    className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-2xl cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-heading font-black text-muted-foreground w-6">#{idx + 1}</span>
                      <img
                        src={item.profile.avatar_url}
                        alt={item.profile.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="text-left font-heading">
                        <div className="font-extrabold text-white leading-tight uppercase">{item.profile.full_name}</div>
                        <div className="text-[10px] text-muted-foreground/60 uppercase mt-0.5">@{item.profile.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">GOLLER</div>
                        <div className="text-sm font-heading font-black text-white mt-0.5">{item.goals} Gol</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">ASİST</div>
                        <div className="text-xs font-semibold text-white mt-0.5">{item.assists} Asist</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Panel 4: Feed events */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {feedEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-white/10 transition-all text-left"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {evt.event_type}
                    </span>
                    <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider mt-2">
                      {evt.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 font-semibold tracking-wider">
                    {new Date(evt.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {evt.description}
                </p>

                {evt.media_url && (
                  evt.media_type === 'video' ? (
                    <video src={evt.media_url} controls className="w-full h-44 rounded-2xl object-cover border border-white/10 bg-black" />
                  ) : (
                    <img src={evt.media_url} alt="" className="w-full h-44 rounded-2xl object-cover border border-white/10" />
                  )
                )}
              </div>
            ))}

            {feedEvents.length === 0 && (
              <div className="text-xs text-muted-foreground py-12 text-center">
                Henüz turnuva akışı ve haberi bulunmuyor.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
