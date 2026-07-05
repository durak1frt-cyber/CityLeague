'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, getItem, updateItem, insertItem, deleteItem } from '@/lib/db';
import { generateKnockoutBracket } from '@/lib/bracket-engine';
import { generateRoundRobinFixtures } from '@/lib/round-robin-engine';
import { ShieldAlert, Check, X, MapPin, User, FileText, ChevronRight, Award, Plus, Trash2, Truck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, switchUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'proposals' | 'venues' | 'users' | 'orders'>('proposals');
  
  // Data lists
  const [proposals, setProposals] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [officials, setOfficials] = useState<any[]>([]);

  // Venue form states
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCity, setVenueCity] = useState('Ankara');
  const [assignedOfficial, setAssignedOfficial] = useState('');

  const loadData = () => {
    // Propose tournaments queue
    const tourneys = getItems('tournaments');
    setProposals(tourneys.filter((t: any) => t.status === 'pending_approval'));

    setVenues(getItems('venues'));
    setUsers(getItems('profiles'));
    setOrders(getItems('jersey_orders'));
    setTeams(getItems('teams'));
    
    const allOfficials = getItems('profiles').filter((p: any) => p.role === 'stadium_official');
    setOfficials(allOfficials);
    if (allOfficials.length > 0) setAssignedOfficial(allOfficials[0].id);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Auth gate check
  if (!user || user.role !== 'platform_admin') {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-sm text-center space-y-4">
          <ShieldAlert className="text-rose-500 w-12 h-12 mx-auto" />
          <h2 className="text-lg font-heading font-extrabold uppercase tracking-wider">Yetkisiz Erişim</h2>
          <p className="text-xs text-muted-foreground">
            Sistem Yönetim Paneline yalnızca platform yöneticileri erişebilir.
          </p>
          <div className="text-[10px] text-primary bg-primary/5 border border-primary/20 p-2 rounded-xl">
            Tavsiye: Sağ üstteki profil menüsünden Fırat Durak (Admin) rolüne geçerek bu sayfayı deneyebilirsiniz.
          </div>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-bold font-heading uppercase">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const handleApproveTournament = (id: string) => {
    const updated = updateItem('tournaments', id, {
      status: 'pending_activation' // Now teams can register
    });

    // Notify proposed user
    const tourney = proposals.find(t => t.id === id);
    if (tourney) {
      insertItem('notifications', {
        recipient_id: tourney.created_by,
        type: 'tournament_approved',
        title: 'Turnuva Başvurunuz Onaylandı!',
        message: `'${tourney.name}' teklifiniz onaylanmıştır. Takım kayıtları ve kadro doğrulaması başlamıştır.`,
        deep_link: `/tournaments/${id}`,
        read: false
      });
    }

    confetti({ particleCount: 100, spread: 70 });
    loadData();
  };

  const handleRejectTournament = (id: string) => {
    const tourney = proposals.find(t => t.id === id);
    if (tourney) {
      insertItem('notifications', {
        recipient_id: tourney.created_by,
        type: 'tournament_approved',
        title: 'Turnuva Başvurusu Reddedildi',
        message: `'${tourney.name}' turnuva başvurunuz platform şartlarını sağlamadığı için reddedilmiştir.`,
        deep_link: `/tournaments`,
        read: false
      });
    }

    deleteItem('tournaments', id);
    loadData();
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim() || !venueAddress.trim()) return;

    insertItem('venues', {
      name: venueName.trim(),
      address: venueAddress.trim(),
      city: venueCity,
      capacity: 1000,
      photo_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&h=400&q=80",
      assigned_official_id: assignedOfficial
    });

    setVenueName('');
    setVenueAddress('');
    loadData();
    confetti({ particleCount: 40, spread: 40 });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateItem('profiles', userId, { role: newRole });
    loadData();
    if (user.id === userId) {
      switchUser(userId); // reload auth state if changing self
    }
  };

  const handleShipOrder = (orderId: string) => {
    updateItem('jersey_orders', orderId, { status: 'shipped' });
    
    const ord = orders.find(o => o.id === orderId);
    const tm = teams.find(t => t.id === ord.team_id);
    
    // Notify captain
    if (tm) {
      insertItem('notifications', {
        recipient_id: tm.captain_id,
        type: 'jersey_order_update',
        title: 'Forma Siparişiniz Kargolandı!',
        message: `${tm.name} formaları üretilerek kargoya verilmiştir. Detaylar ve kargo takibi için tıklayın.`,
        deep_link: `/orders/${orderId}`,
        read: false
      });
    }

    loadData();
    confetti({ particleCount: 70, spread: 60 });
  };

  const handleDownloadTechPack = (order: any) => {
    const orderItems = getItems('jersey_order_items').filter(oi => oi.order_id === order.id);
    const tm = teams.find(t => t.id === order.team_id);
    
    // Compile JSON pack file
    const techPack = {
      teamName: tm?.name,
      design: order.jersey_design_snapshot,
      items: orderItems.map(oi => ({
        playerName: oi.player_name,
        number: oi.squad_number,
        size: oi.size,
        paid: oi.paid
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(techPack, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `techpack-${tm?.name.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
          Yönetim Konsolu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Platform organizasyonlarını, sahaları ve kullanıcı rollerini denetleyin.</p>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-white/5 flex gap-6 text-sm font-heading font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'proposals' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Turnuva Talepleri ({proposals.length})
        </button>

        <button
          onClick={() => setActiveTab('venues')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'venues' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Saha Yönetimi
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Rol & Kullanıcı Yetkileri
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Forma Siparişleri
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Panel 1: Proposals approval */}
        {activeTab === 'proposals' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {proposals.length === 0 ? (
              <div className="text-xs text-muted-foreground py-12 text-center bg-zinc-900/10 border border-dashed border-white/5 rounded-3xl">
                Onay bekleyen turnuva başvurusu bulunmamaktadır.
              </div>
            ) : (
              proposals.map((t) => (
                <div
                  key={t.id}
                  className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-white/10 transition-all"
                >
                  <div className="text-left space-y-2">
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{t.sport}</span>
                    <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider leading-tight">{t.name}</h3>
                    <p className="text-[11px] text-muted-foreground">Kadro: {t.required_roster_size}v{t.required_roster_size} • Katılım: {t.max_teams} Takım Max • Koşul: {t.custom_conditions?.geographic_restriction}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectTournament(t.id)}
                      className="p-2 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleApproveTournament(t.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/95 transition-all font-heading uppercase tracking-wider"
                    >
                      <Check size={14} /> Onayla
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Panel 2: Venue control */}
        {activeTab === 'venues' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Kayıtlı Sahalar</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="bg-zinc-900/60 border border-white/5 p-5 rounded-3xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img src={v.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      <div className="text-left">
                        <h4 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider">{v.name}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1">
                          <MapPin size={10} /> {v.address}, {v.city}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        Hakem: {users.find(p => p.id === v.assigned_official_id)?.full_name || 'Yok'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create form */}
            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yeni Saha Ekle</h3>

              <form onSubmit={handleAddVenue} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Saha Adı</label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Örn: Balgat Olimpiyat Çim Saha"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Saha Adresi</label>
                  <input
                    type="text"
                    required
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Sorumlu Hakem</label>
                  <select
                    value={assignedOfficial}
                    onChange={(e) => setAssignedOfficial(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  >
                    {officials.map(o => (
                      <option key={o.id} value={o.id}>{o.full_name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 py-2.5 bg-primary text-black font-bold rounded-xl transition-all font-heading uppercase"
                >
                  <Plus size={14} /> Saha Ekle
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Panel 3: User Role controls */}
        {activeTab === 'users' && (
          <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                <thead className="bg-black/60 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                    <th className="px-4 py-3 font-semibold">Mevcut Rol</th>
                    <th className="px-4 py-3 font-semibold">Rol Değiştir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-zinc-900/10">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                        <div>
                          <div className="font-bold text-white leading-tight">{u.full_name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">@{u.username}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white uppercase font-semibold font-heading tracking-wide text-[10px]">
                        {u.role}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                        >
                          <option value="player">Player</option>
                          <option value="captain">Captain</option>
                          <option value="coach">Coach</option>
                          <option value="stadium_official">Official</option>
                          <option value="platform_admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 4: Jersey orders control */}
        {activeTab === 'orders' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {orders.length === 0 ? (
              <div className="text-xs text-muted-foreground py-12 text-center bg-zinc-900/10 border border-dashed border-white/5 rounded-3xl">
                Kayıtlı forma sipariş kampanyası bulunmamaktadır.
              </div>
            ) : (
              orders.map((ord) => {
                const tm = teams.find(t => t.id === ord.team_id);
                return (
                  <div
                    key={ord.id}
                    className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-white/10 transition-all text-xs"
                  >
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider">{tm?.name} Forması</h4>
                      <p className="text-muted-foreground leading-normal">Tutar: ${ (ord.total_items * ord.price_per_unit).toFixed(2) } • Adet: {ord.total_items} Forma • Durum: <span className="font-semibold uppercase text-primary">{ord.status}</span></p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadTechPack(ord)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center gap-1"
                      >
                        <FileText size={14} /> Tech Pack İndir
                      </button>

                      {ord.status === 'processing' && (
                        <button
                          onClick={() => handleShipOrder(ord.id)}
                          className="px-4 py-2 bg-primary text-black font-bold rounded-xl font-heading uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Truck size={14} /> Kargoya Ver
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
}
