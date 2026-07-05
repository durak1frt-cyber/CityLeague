'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, insertItem } from '@/lib/db';
import { canProposeTournament } from '@/lib/permissions';
import { Trophy, Calendar, Plus, ShieldCheck, MapPin, Users, Award, ShieldAlert, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  pending_approval: 'Onay Bekliyor',
  pending_activation: 'Başlaması Bekleniyor',
  active: 'Aktif',
  completed: 'Tamamlandı'
};

export default function TournamentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [registeredRelations, setRegisteredRelations] = useState<any[]>([]);
  
  // Wizard Modal Toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState('football');
  const [format, setFormat] = useState('single_elimination');
  const [maxTeams, setMaxTeams] = useState('4');
  const [minTeams, setMinTeams] = useState('2');
  const [requiredRosterSize, setRequiredRosterSize] = useState('3');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [entryFee, setEntryFee] = useState('0');
  
  // Conditions
  const [ageRestriction, setAgeRestriction] = useState('Open');
  const [skillRestriction, setSkillRestriction] = useState('Open');
  const [geographicRestriction, setGeographicRestriction] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');

  // Sponsor
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');

  const loadData = () => {
    setTournaments(getItems('tournaments'));
    setTeams(getItems('teams'));
    setRegisteredRelations(getItems('tournament_teams'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canProposeTournament(user)) return;

    if (!name.trim()) return;

    // Propose new tournament
    const proposed = insertItem('tournaments', {
      name: name.trim(),
      sport,
      format,
      start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      max_teams: parseInt(maxTeams) || 4,
      min_teams: parseInt(minTeams) || 2,
      required_roster_size: parseInt(requiredRosterSize) || 3,
      status: 'pending_approval', // waits for admin
      rules: { match_duration_minutes: sport === 'football' ? 90 : 40, periods: 2, points_per_win: 3, points_per_draw: 1 },
      custom_conditions: { age_restriction: ageRestriction, skill_restriction: skillRestriction, geographic_restriction: geographicRestriction || 'Genel' },
      custom_requirements_text: customRequirements,
      registration_deadline: registrationDeadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      entry_fee: parseFloat(entryFee) || 0,
      title_sponsor_name: sponsorName,
      title_sponsor_logo_url: sponsorLogo,
      created_by: user.id
    });

    // Notify admins
    insertItem('notifications', {
      recipient_id: 'player-admin', // admin ID
      type: 'tournament_approved',
      title: 'Yeni Turnuva Teklifi Aldınız',
      message: `${user.full_name} yeni bir turnuva önerdi: ${name}. Onaylanmayı bekliyor.`,
      deep_link: `/admin/tournaments`,
      read: false
    });

    setIsModalOpen(false);
    confetti({ particleCount: 80, spread: 80 });
    loadData();
  };

  const getRegisteredTeamsCount = (tournamentId: string) => {
    return registeredRelations.filter(r => r.tournament_id === tournamentId && r.status === 'approved').length;
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Turnuvalar & Ligler</h1>
          <p className="text-sm text-muted-foreground mt-1">Katılabileceğiniz aktif ligleri inceleyin veya kendi turnuvanızı kurun.</p>
        </div>

        {user && canProposeTournament(user) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/90 transition-all font-heading uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            <Plus size={16} /> Turnuva Öner
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => {
          const registeredCount = getRegisteredTeamsCount(t.id);
          const isPendingAdmin = t.status === 'pending_approval';

          return (
            <div
              key={t.id}
              onClick={() => !isPendingAdmin && router.push(`/tournaments/${t.id}`)}
              className={`bg-zinc-900/60 border rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 ${isPendingAdmin ? 'border-dashed border-white/10 opacity-70 cursor-not-allowed' : 'border-white/5 hover:border-primary/20 hover:shadow-[0_10px_35px_rgba(0,0,0,0.5)] cursor-pointer group hover:-translate-y-0.5'}`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      t.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' :
                      t.status === 'pending_activation' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      t.status === 'pending_approval' ? 'bg-zinc-500/10 border-zinc-500/20 text-muted-foreground' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {TOURNAMENT_STATUS_LABELS[t.status] || t.status}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase">{t.format === 'single_elimination' ? 'Knockout' : 'Lig Formatı'}</span>
                  </div>
                  <h3 className="text-base font-heading font-extrabold text-white uppercase tracking-wider mt-2 group-hover:text-primary transition-colors leading-tight">
                    {t.name}
                  </h3>
                </div>

                <div className="p-2.5 bg-white/5 rounded-2xl">
                  <Trophy size={18} className="text-primary" />
                </div>
              </div>

              {/* Requirements & Conditions Details */}
              <div className="space-y-2 text-xs border-y border-white/5 py-4 my-1">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Kayıt Limit:</span>
                  <span className="font-bold text-white">{registeredCount} / {t.max_teams} Takım</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Branş / Kadro:</span>
                  <span className="font-bold text-white capitalize">{t.sport} ({t.required_roster_size}v{t.required_roster_size})</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Konum Şartı:</span>
                  <span className="font-bold text-white flex items-center gap-1"><MapPin size={12} className="text-primary" /> {t.custom_conditions?.geographic_restriction}</span>
                </div>
              </div>

              {/* Title Sponsor Footer badge */}
              <div className="flex items-center justify-between text-[10px]">
                {t.title_sponsor_logo_url ? (
                  <div className="flex items-center gap-1.5 opacity-65">
                    <span className="text-muted-foreground/60 font-semibold uppercase">SPONSOR</span>
                    <img src={t.title_sponsor_logo_url} alt={t.title_sponsor_name} className="h-4 w-auto object-contain filter invert brightness-200" />
                  </div>
                ) : (
                  <div />
                )}

                {!isPendingAdmin ? (
                  <span className="text-primary font-bold hover:underline flex items-center gap-0.5">
                    Detayları İncele <ArrowRight size={12} />
                  </span>
                ) : (
                  <span className="text-muted-foreground/40 font-semibold flex items-center gap-1">
                    <ShieldAlert size={12} /> Onay Bekleniyor
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Propose Tournament Modal wizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-xl text-left space-y-6 shadow-2xl my-8">
            <div>
              <h2 className="text-xl font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="text-primary" /> Yeni Turnuva Başvurusu
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Kurmak istediğiniz yerel turnuva detaylarını yönetici onayına gönderin.</p>
            </div>

            <form onSubmit={handlePropose} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Turnuva Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Çankaya Halı Saha Bahar Kupası"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Spor Branşı</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  <option value="football">Futbol</option>
                  <option value="basketball">Basketbol</option>
                  <option value="volleyball">Voleybol</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Eşleşme Tipi</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  <option value="single_elimination">Tek Maçlı Eleme (Knockout)</option>
                  <option value="round_robin">Lig Standardı (Puan Tablolu)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Minimum Takım</label>
                <input
                  type="number"
                  value={minTeams}
                  onChange={(e) => setMinTeams(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Maksimum Takım</label>
                <input
                  type="number"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Min. Roster Kadro Boyutu</label>
                <input
                  type="number"
                  value={requiredRosterSize}
                  onChange={(e) => setRequiredRosterSize(e.target.value)}
                  placeholder="Örn: 5v5 için 5"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Son Kayıt Tarihi</label>
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Yaş Sınırı</label>
                <input
                  type="text"
                  value={ageRestriction}
                  onChange={(e) => setAgeRestriction(e.target.value)}
                  placeholder="Örn: 18+ veya Açık"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Seviye Sınırı</label>
                <input
                  type="text"
                  value={skillRestriction}
                  onChange={(e) => setSkillRestriction(e.target.value)}
                  placeholder="Örn: Advanced veya Açık"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Geografik Kısıtlama / Bölge</label>
                <input
                  type="text"
                  value={geographicRestriction}
                  onChange={(e) => setGeographicRestriction(e.target.value)}
                  placeholder="Örn: Çankaya, Ankara veya İstanbul geneli"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Diğer Özel Kurallar & Açıklama</label>
                <textarea
                  rows={2}
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  placeholder="Örn: okul veya kurum çalışanlarına özel koşullar..."
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Ana Başlık Sponsoru</label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Örn: Red Bull"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Sponsor Logo URL</label>
                <input
                  type="text"
                  value={sponsorLogo}
                  onChange={(e) => setSponsorLogo(e.target.value)}
                  placeholder="https://domain.com/logo.svg"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-white transition-all"
                >
                  İptal Et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-black font-bold rounded-xl transition-all font-heading uppercase"
                >
                  Onaya Gönder
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
