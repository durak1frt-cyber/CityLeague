'use client';

import React, { use, useEffect, useState, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import { getItem, getItems } from '@/lib/db';
import FieldHeatmap from '@/components/telemetry/FieldHeatmap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Play, Pause, Trash2, Video, Trophy, Calendar, MapPin, Eye, Edit } from 'lucide-react';

export default function MatchCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<any | null>(null);
  const [homeTeam, setHomeTeam] = useState<any | null>(null);
  const [awayTeam, setAwayTeam] = useState<any | null>(null);
  
  const [events, setEvents] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('player-ahmet'); // default active telemetry

  // Video drawing states
  const [isPaused, setIsPaused] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#eab308'); // default yellow gold

  const loadData = () => {
    const m = getItem('matches', matchId);
    if (!m) return;
    setMatch(m);

    const h = getItem('teams', m.home_team_id);
    const a = getItem('teams', m.away_team_id);
    setHomeTeam(h);
    setAwayTeam(a);

    // Load events
    const evts = getItems('match_events').filter((e: any) => e.match_id === matchId);
    setEvents(evts.sort((x, y) => x.minute - y.minute));

    // Load roster details
    const profiles = getItems('profiles');
    const homeMems = getItems('team_members').filter(mem => mem.team_id === m.home_team_id);
    const awayMems = getItems('team_members').filter(mem => mem.team_id === m.away_team_id);
    
    const combinedRoster = [
      ...homeMems.map(mem => profiles.find(p => p.id === mem.profile_id)),
      ...awayMems.map(mem => profiles.find(p => p.id === mem.profile_id))
    ].filter(Boolean);

    setRoster(combinedRoster);
    if (combinedRoster.length > 0) setSelectedPlayer(combinedRoster[0].id);
  };

  useEffect(() => {
    loadData();
  }, [matchId]);

  // Handle Canvas Drawing overlays on video pause
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPaused) return; // drawing allowed only when paused
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath(); // reset path
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isPaused || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get mouse coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
      clearCanvas(); // clear annotations on play
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  if (!match || !homeTeam || !awayTeam) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Karşılaşma analiz kayıtları bulunamadı.</p>
        </div>
      </div>
    );
  }

  // Telemetry mappings
  const telemetry = match.telemetry_data || {};
  const heatmapData = telemetry.heatmaps?.[selectedPlayer] || [
    { x: 50, y: 50, value: 10 } // default center fallback
  ];
  const speedChartData = telemetry.speed_run_speed_kmh || [
    { min: 0, speed: 0 }, { min: 90, speed: 0 }
  ];
  const accuracyData = telemetry.accuracies || [
    { label: "Accuracy", value: 80 }
  ];

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Scoreboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="text-left">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            <Trophy size={12} className="text-primary" /> Analiz Merkezi
          </div>
          <h1 className="text-2xl font-heading font-black text-white mt-1 uppercase tracking-wider">
            {homeTeam.name} vs {awayTeam.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-heading font-black text-white">
            {match.home_score} - {match.away_score}
          </span>
          <span className="text-xs bg-white/5 border border-white/15 px-3 py-1 rounded-xl text-muted-foreground">
            {match.status === 'completed' ? 'TAMAMLANDI' : 'CANLI'}
          </span>
        </div>
      </div>

      {/* Main Analysis grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Video Annotation whiteboards & heatmaps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom drawing video card */}
          {match.video_url ? (
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Video size={14} className="text-primary" /> Taktik Analiz Ekranı
                </span>
                
                {isPaused && (
                  <div className="flex items-center gap-3">
                    {/* Color selectors */}
                    <div className="flex gap-1.5">
                      {['#eab308', '#06b6d4', '#ef4444'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-4 h-4 rounded-full border ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={clearCanvas}
                      className="p-1.5 text-muted-foreground hover:text-white rounded bg-white/5 hover:bg-white/10 transition-all text-[10px] flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Temizle
                    </button>
                  </div>
                )}
              </div>

              {/* Video and drawing canvas wrapper */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 select-none">
                <video
                  ref={videoRef}
                  src={match.video_url}
                  className="w-full h-full object-cover"
                  onClick={togglePlay}
                />
                
                {/* HTML5 Canvas overlay for drawings */}
                <canvas
                  ref={canvasRef}
                  width="600"
                  height="340"
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onMouseMove={draw}
                  className={`absolute inset-0 w-full h-full z-20 ${isPaused ? 'cursor-crosshair' : 'pointer-events-none'}`}
                />

                {/* Paused state tactical drawing helper overlay */}
                {isPaused && (
                  <div className="absolute top-4 right-4 bg-black/85 border border-primary/20 px-3 py-1.5 rounded-xl z-30 text-[10px] text-primary font-bold flex items-center gap-1.5 animate-pulse">
                    <Edit size={12} /> ÇİZİM MODU AKTİF (VİDEO DURDURULDU)
                  </div>
                )}

                {/* Floating Play/Pause Controls */}
                <button
                  onClick={togglePlay}
                  className="absolute bottom-4 left-4 p-3 rounded-full bg-primary text-black hover:bg-primary/95 transition-all z-30 shadow-2xl"
                >
                  {isPaused ? <Play size={18} fill="black" /> : <Pause size={18} fill="black" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-white/5 p-12 rounded-3xl text-center text-xs text-muted-foreground">
              Karşılaşma video kaydı henüz sisteme aktarılmamıştır.
            </div>
          )}

          {/* Telemetry Heatmap Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Isı Haritası Analizi</h3>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              >
                {roster.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.preferred_position})</option>
                ))}
              </select>
            </div>

            <FieldHeatmap coordinates={heatmapData} sport="football" />
          </div>

        </div>

        {/* Right Side: Speed chart, accuracies, and events log */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Speed Chart */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">Hız Koşu Profil (km/h)</h3>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="min" stroke="#888" fontSize={9} />
                  <YAxis stroke="#888" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: 10 }} />
                  <Line type="monotone" dataKey="speed" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracies Radar Chart */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider self-start">İsabet Analizi</h3>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={accuracyData}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="label" stroke="#888" fontSize={9} />
                  <Radar name="İsabet" dataKey="value" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Match Events timeline log */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">Önemli Dakikalar</h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 text-xs text-left"
                >
                  <span className="text-primary font-bold">{evt.minute}'</span>
                  <div>
                    <div className="text-white font-semibold">
                      {evt.event_type === 'goal' ? '⚽ GOL' : evt.event_type === 'yellow_card' ? '🟨 Sarı Kart' : evt.event_type === 'red_card' ? '🟥 Kırmızı Kart' : '🔄 Değişiklik'}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {roster.find(p => p.id === evt.player_id)?.full_name || 'Bilinmeyen'} {evt.notes && `(${evt.notes})`}
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Kaydedilmiş maç olayı bulunmuyor.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
