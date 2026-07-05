'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItem, getItems, insertItem, updateItem } from '@/lib/db';
import { canLogMatchEvents } from '@/lib/permissions';
import { advanceBracketWinner } from '@/lib/bracket-engine';
import { ShieldCheck, Clock, Play, Pause, Square, AlertCircle, Plus, Trash2, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const EVENT_LABELS: Record<string, string> = {
  goal: '⚽ GOL',
  assist: '👟 ASİST',
  yellow_card: '🟨 SARI KART',
  red_card: '🟥 KIRMIZI KART',
  substitution: '🔄 DEĞİŞİKLİK'
};

export default function OfficialScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [match, setMatch] = useState<any | null>(null);
  const [homeTeam, setHomeTeam] = useState<any | null>(null);
  const [awayTeam, setAwayTeam] = useState<any | null>(null);
  
  const [homeRoster, setHomeRoster] = useState<any[]>([]);
  const [awayRoster, setAwayRoster] = useState<any[]>([]);
  
  // Scoring states
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  // Clock states
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0); // in minutes
  
  // Event logger inputs
  const [eventType, setEventType] = useState('goal');
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [eventMinute, setEventMinute] = useState('1');
  const [eventNotes, setEventNotes] = useState('');
  const [matchEventsList, setMatchEventsList] = useState<any[]>([]);

  const loadData = () => {
    const m = getItem('matches', matchId);
    if (!m) return;
    setMatch(m);
    setHomeScore(m.home_score || 0);
    setAwayScore(m.away_score || 0);

    const h = getItem('teams', m.home_team_id);
    const a = getItem('teams', m.away_team_id);
    setHomeTeam(h);
    setAwayTeam(a);

    // Load rosters
    const profiles = getItems('profiles');
    const homeMembers = getItems('team_members').filter(mem => mem.team_id === m.home_team_id);
    const awayMembers = getItems('team_members').filter(mem => mem.team_id === m.away_team_id);
    
    const hRoster = homeMembers.map(mem => profiles.find(p => p.id === mem.profile_id)).filter(Boolean);
    const aRoster = awayMembers.map(mem => profiles.find(p => p.id === mem.profile_id)).filter(Boolean);
    
    setHomeRoster(hRoster);
    setAwayRoster(aRoster);

    if (hRoster.length > 0) setSelectedPlayer(hRoster[0].id);

    // Load events
    const evts = getItems('match_events').filter((e: any) => e.match_id === matchId);
    setMatchEventsList(evts.sort((x, y) => x.minute - y.minute));
  };

  useEffect(() => {
    loadData();
  }, [matchId, user]);

  // Game clock timer ticker
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const nextTime = prevTime + 1;
          setEventMinute(nextTime.toString());
          return nextTime;
        });
      }, 5000); // 1 minute in-game simulated every 5 seconds for easy testing!
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Auth gate check
  if (!user || !match || !canLogMatchEvents(user, match)) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-sm text-center space-y-4">
          <AlertCircle className="text-rose-500 w-12 h-12 mx-auto" />
          <h2 className="text-lg font-heading font-extrabold uppercase tracking-wider">Yetkisiz Erişim</h2>
          <p className="text-xs text-muted-foreground">
            Bu karşılaşmanın hakem giriş paneline yalnızca atanan stadyum hakemleri ve yöneticiler erişebilir.
          </p>
          <div className="text-[10px] text-primary bg-primary/5 border border-primary/20 p-2 rounded-xl">
            Tavsiye: Sağ üstteki profil menüsünden Cüneyt Çakır (Hakem) rolüne geçerek bu sayfayı deneyebilirsiniz.
          </div>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-bold font-heading uppercase">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const handleScoreChange = (team: 'home' | 'away', delta: number) => {
    if (team === 'home') {
      setHomeScore(Math.max(0, homeScore + delta));
    } else {
      setAwayScore(Math.max(0, awayScore + delta));
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    const teamId = selectedTeam === 'home' ? match.home_team_id : match.away_team_id;

    // Save event to database
    const created = insertItem('match_events', {
      match_id: matchId,
      player_id: selectedPlayer,
      team_id: teamId,
      event_type: eventType,
      minute: parseInt(eventMinute) || 0,
      notes: eventNotes.trim()
    });

    // Auto-update match score in state if Goal is logged
    if (eventType === 'goal') {
      handleScoreChange(selectedTeam as any, 1);
    }

    setEventNotes('');
    loadData();
    confetti({ particleCount: 30, spread: 40 });
  };

  const handleRemoveEvent = (id: string, type: string) => {
    // If it was a goal, deduct score
    if (type === 'goal') {
      const evt = matchEventsList.find(e => e.id === id);
      const teamSelector = evt.team_id === match.home_team_id ? 'home' : 'away';
      handleScoreChange(teamSelector, -1);
    }
    
    const db = getItems('match_events');
    const filtered = db.filter((e: any) => e.id !== id);
    // Write back to DB directly via storage key
    localStorage.setItem('city_league_db', JSON.stringify({
      ...JSON.parse(localStorage.getItem('city_league_db') || '{}'),
      match_events: filtered
    }));

    loadData();
  };

  const handleEndMatch = () => {
    if (!window.confirm('Karşılaşmayı tamamlamak ve nihai skorları kaydetmek istediğinize emin misiniz?')) return;

    // Update match status
    const updatedMatch = updateItem('matches', matchId, {
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed'
    });

    // Determine winner ID
    let winnerId = "";
    if (homeScore > awayScore) {
      winnerId = match.home_team_id;
    } else if (awayScore > homeScore) {
      winnerId = match.away_team_id;
    }

    // Update player match stats for MVP & totals
    const goalsCountMap: { [pId: string]: number } = {};
    const assistsCountMap: { [pId: string]: number } = {};

    matchEventsList.forEach(e => {
      if (e.event_type === 'goal') {
        goalsCountMap[e.player_id] = (goalsCountMap[e.player_id] || 0) + 1;
      }
      if (e.event_type === 'assist') {
        assistsCountMap[e.player_id] = (assistsCountMap[e.player_id] || 0) + 1;
      }
    });

    // Combine rosters to update aggregated stats in DB
    const allRosterPlayers = [...homeRoster, ...awayRoster];
    allRosterPlayers.forEach(p => {
      const pGoals = goalsCountMap[p.id] || 0;
      const pAssists = assistsCountMap[p.id] || 0;
      const isWinner = winnerTeamIdMatches(p.id);
      
      // Save stats record for this match
      insertItem('player_match_stats', {
        match_id: matchId,
        player_id: p.id,
        sport: 'football',
        stats_values: {
          goals: pGoals,
          assists: pAssists,
          distance_km: (8.5 + Math.random() * 4).toFixed(1),
          top_speed_kmh: (24 + Math.random() * 9).toFixed(1),
          mvp: pGoals >= 2 ? true : false
        }
      });

      // Update global profile aggregate
      const currentStats = p.aggregated_stats || {};
      updateItem('profiles', p.id, {
        aggregated_stats: {
          matches_played: (currentStats.matches_played || 0) + 1,
          wins: isWinner ? (currentStats.wins || 0) + 1 : (currentStats.wins || 0),
          goals: (currentStats.goals || 0) + pGoals,
          assists: (currentStats.assists || 0) + pAssists,
          mvps: (currentStats.mvps || 0) + (pGoals >= 2 ? 1 : 0)
        }
      });
    });

    function winnerTeamIdMatches(pId: string) {
      if (winnerId === "") return false;
      const mems = getItems('team_members').filter(m => m.team_id === winnerId);
      return mems.some(m => m.profile_id === pId);
    }

    // Advance winner in bracket
    if (winnerId !== "") {
      advanceBracketWinner(updatedMatch, winnerId);
    }

    // Create Feed event story
    const winnerName = getTeamName(winnerId);
    const loserName = getTeamName(winnerId === match.home_team_id ? match.away_team_id : match.home_team_id);
    
    insertItem('feed_events', {
      event_type: 'match_completed',
      tournament_id: match.tournament_id,
      match_id: matchId,
      title: `${winnerName ? `${winnerName} Kazandı!` : 'Berabere Sonuçlandı!'}`,
      description: `${homeTeam.name} ve ${awayTeam.name} arasındaki çekişmeli maç sona erdi. Skor: ${homeScore} - ${awayScore}. Hakem Cüneyt Çakır maçı tamamladı.`,
      media_url: '',
      media_type: 'photo',
      metadata: { homeScore, awayScore, winnerId }
    });

    setIsActive(false);
    confetti({ particleCount: 150, spread: 80 });
    alert('Maç başarıyla tamamlandı, veriler kilitlendi ve turnuva fikstürü güncellendi.');
    router.push(`/tournaments/${match.tournament_id}`);
  };

  const getTeamName = (teamId: string) => {
    const t = getItem('teams', teamId);
    return t ? t.name : '';
  };

  const activeRosterOptions = selectedTeam === 'home' ? homeRoster : awayRoster;

  return (
    <div className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
            Hakem Skor Paneli
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            CANLI karşılaşma detaylarını, kartları ve golleri anlık kaydedin.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-2xl">
          <Clock size={16} className="text-primary animate-pulse" />
          <span className="text-lg font-heading font-black text-white tracking-widest">
            {time.toString().padStart(2, '0')}:00
          </span>
          <button
            onClick={() => setIsActive(!isActive)}
            className="p-1 text-primary hover:bg-white/5 rounded"
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Col 1 & 2: Score Display and Event Logger */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main scoreboard display card */}
          <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl text-center relative overflow-hidden flex items-center justify-around gap-6">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-primary to-accent" />

            {/* Home Team */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <img src={homeTeam.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
              <span className="text-sm font-heading font-black text-white uppercase truncate max-w-[120px]">{homeTeam.name}</span>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleScoreChange('home', -1)} className="w-8 h-8 rounded-full bg-zinc-800 text-white font-bold text-sm">-</button>
                <span className="text-4xl font-heading font-black text-white w-12">{homeScore}</span>
                <button onClick={() => handleScoreChange('home', 1)} className="w-8 h-8 rounded-full bg-primary text-black font-bold text-sm">+</button>
              </div>
            </div>

            <div className="text-2xl font-heading font-black text-muted-foreground/30">VS</div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <img src={awayTeam.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
              <span className="text-sm font-heading font-black text-white uppercase truncate max-w-[120px]">{awayTeam.name}</span>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleScoreChange('away', -1)} className="w-8 h-8 rounded-full bg-zinc-800 text-white font-bold text-sm">-</button>
                <span className="text-4xl font-heading font-black text-white w-12">{awayScore}</span>
                <button onClick={() => handleScoreChange('away', 1)} className="w-8 h-8 rounded-full bg-primary text-black font-bold text-sm">+</button>
              </div>
            </div>
          </div>

          {/* Event Logger Form */}
          <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Olay Kayıt Formu</h3>
            
            <form onSubmit={handleAddEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Olay Tipi</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  <option value="goal">Gol (Sayı)</option>
                  <option value="assist">Asist</option>
                  <option value="yellow_card">Sarı Kart</option>
                  <option value="red_card">Kırmızı Kart</option>
                  <option value="substitution">Oyuncu Değişikliği</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Takım</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    const roster = e.target.value === 'home' ? homeRoster : awayRoster;
                    if (roster.length > 0) setSelectedPlayer(roster[0].id);
                  }}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  <option value="home">{homeTeam.name} (Ev Sahibi)</option>
                  <option value="away">{awayTeam.name} (Deplasman)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Oyuncu</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  {activeRosterOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.preferred_position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Maç Dakikası</label>
                <input
                  type="number"
                  value={eventMinute}
                  onChange={(e) => setEventMinute(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Notlar / Açıklama</label>
                <input
                  type="text"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Örn: Ceza sahası dışından aşırtma şut..."
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-black font-bold rounded-xl transition-all font-heading uppercase tracking-wider"
                >
                  <Plus size={14} /> Olay Ekle
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Col 3: Match Events List & Finalize controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Match Events Timeline Logger */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Olay Günlüğü</h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {matchEventsList.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">
                  Henüz olay kaydedilmedi.
                </div>
              ) : (
                matchEventsList.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl text-xs gap-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 font-bold text-white leading-none">
                        <span className="text-primary">{evt.minute}'</span>
                        <span className="uppercase">
                          {EVENT_LABELS[evt.event_type] || evt.event_type}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {homeRoster.concat(awayRoster).find(p => p.id === evt.player_id)?.full_name || 'Bilinmeyen'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveEvent(evt.id, evt.event_type)}
                      className="p-1 text-muted-foreground hover:text-rose-500 rounded bg-white/5 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* End Match triggers */}
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={16} className="text-primary" /> Karşılaşmayı Sonlandır
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Maçı bitirdiğinizde istatistikler işlenir ve kilitlenir. Bu işlem geri alınamaz.
              </p>
            </div>

            <button
              onClick={handleEndMatch}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs font-heading uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Square size={14} fill="black" /> Maçı Bitir & Kaydet
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
