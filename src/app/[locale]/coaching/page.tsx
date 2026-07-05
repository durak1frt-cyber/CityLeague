'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems } from '@/lib/db';
import { Award, Play, ShieldAlert, Sparkles, UserCheck, Video } from 'lucide-react';

export default function CoachingHubPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [drills, setDrills] = useState<any[]>([]);
  const [playerDrills, setPlayerDrills] = useState<any[]>([]);

  useEffect(() => {
    setDrills(getItems('coaching_drills'));
    setPlayerDrills(getItems('player_drills'));
  }, []);

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Koçluk Portalı</h1>
        <p className="text-sm text-muted-foreground mt-1">Profesyonel antrenörlerin atadığı pratik drilleri tamamlayın ve taktik becerilerinizi artırın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Col: Available Drills listing */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Atanan Driller & Antrenmanlar</h2>

          <div className="grid grid-cols-1 gap-4">
            {drills.map((drill) => (
              <div
                key={drill.id}
                className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-white/10 transition-all text-left"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20">
                      <Video size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider leading-tight">
                        {drill.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">Hakan Terim tarafından eklendi</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Aktif Antrenman
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {drill.description}
                </p>

                {/* Benchmarks grid */}
                <div className="grid grid-cols-2 gap-4 bg-black/40 border border-white/5 p-3 rounded-2xl text-[10px] text-muted-foreground">
                  <div>
                    <span className="font-semibold block uppercase">Hedef Hız Koşusu</span>
                    <span className="font-bold text-white mt-1 block">{drill.telemetry_benchmarks?.speed_target}</span>
                  </div>
                  <div>
                    <span className="font-semibold block uppercase">Hedef İsabet Oranı</span>
                    <span className="font-bold text-white mt-1 block">{drill.telemetry_benchmarks?.accuracy_target}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => alert('Antrenman videosu açılıyor... Katılım verileri telemetrinize işlenecektir.')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black font-bold text-[10px] rounded-xl hover:bg-primary/95 transition-all font-heading uppercase tracking-wider"
                  >
                    <Play size={12} fill="black" /> Drilli İzle & Başla
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Completed drill records and feedbacks */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Tamamlanan Performanslar</h2>

          <div className="space-y-4">
            {playerDrills.map((pd) => (
              <div
                key={pd.id}
                className="bg-zinc-900/30 border border-white/5 p-5 rounded-3xl text-left space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Award size={12} /> {pd.performance_score}% Skor
                  </span>
                  <span className="text-[9px] text-muted-foreground/40 font-semibold">
                    {new Date(pd.completed_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                  {drills.find(d => d.id === pd.drill_id)?.title || 'Bitiricilik Drilli'}
                </div>

                {/* Coach review box */}
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-muted-foreground leading-normal">
                  <div className="font-semibold uppercase text-primary mb-1 flex items-center gap-1">
                    <UserCheck size={10} /> Koç Geri Bildirimi:
                  </div>
                  "{pd.coach_feedback}"
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
