'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, getItem, insertItem, updateItem } from '@/lib/db';
import JerseyEditor from '@/components/jersey/JerseyEditor';
import { ShoppingCart, Check, CreditCard, Clock, UserCheck, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';

const ORDER_STATUS_LABELS: Record<string, string> = {
  collecting_details: 'Bedenler Toplanıyor',
  awaiting_payment: 'Ödeme Bekleniyor',
  all_paid: 'Hepsi Ödedi',
  processing: 'Üretimde',
  shipped: 'Kargoya Verildi'
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = useState<any | null>(null);
  const [team, setTeam] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  
  // Input fields for current user
  const [size, setSize] = useState('M');
  const [squadNumber, setSquadNumber] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [myOrderItem, setMyOrderItem] = useState<any | null>(null);

  const [error, setError] = useState('');

  const loadData = () => {
    const o = getItem('jersey_orders', orderId);
    if (!o) return;
    setOrder(o);

    const t = getItem('teams', o.team_id);
    setTeam(t);

    const orderItems = getItems('jersey_order_items').filter((item: any) => item.order_id === orderId);
    setItems(orderItems);

    // Get team members details
    const members = getItems('team_members').filter((m: any) => m.team_id === o.team_id);
    const profiles = getItems('profiles');
    const rosterList = members.map((m: any) => {
      const p = profiles.find((prof: any) => prof.id === m.profile_id);
      const item = orderItems.find((oi: any) => oi.profile_id === m.profile_id);
      return {
        profile: p,
        item: item || null,
        joined_at: m.joined_at
      };
    });
    setRoster(rosterList);

    if (user) {
      const isTeamMember = members.some((m: any) => m.profile_id === user.id);
      setIsMember(isTeamMember);

      const userItem = orderItems.find((oi: any) => oi.profile_id === user.id);
      setMyOrderItem(userItem || null);

      if (userItem) {
        setSize(userItem.size);
        setSquadNumber(userItem.squad_number.toString());
        setPlayerName(userItem.player_name);
      } else if (user) {
        setPlayerName(user.football_nickname || user.full_name.split(' ')[0].toUpperCase());
        setSquadNumber('10');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId, user]);

  if (!order || !team) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <ShieldAlert className="text-destructive w-12 h-12 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Sipariş kampanyası bulunamadı.</p>
        </div>
      </div>
    );
  }

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isMember) return;

    if (!squadNumber.trim() || !playerName.trim()) {
      setError('Forma arkası isim ve numara boş bırakılamaz.');
      return;
    }

    if (myOrderItem) {
      // Update details
      const updated = updateItem('jersey_order_items', myOrderItem.id, {
        size,
        squad_number: parseInt(squadNumber),
        player_name: playerName.toUpperCase()
      });
      setMyOrderItem(updated);
    } else {
      // Insert new details
      const created = insertItem('jersey_order_items', {
        order_id: orderId,
        profile_id: user.id,
        size,
        squad_number: parseInt(squadNumber),
        player_name: playerName.toUpperCase(),
        paid: false
      });
      setMyOrderItem(created);
    }

    setError('');
    loadData();
  };

  const handlePay = () => {
    if (!myOrderItem) return;

    const updated = updateItem('jersey_order_items', myOrderItem.id, {
      paid: true,
      paid_at: new Date().toISOString()
    });

    setMyOrderItem(updated);
    
    // Confetti pop on payment!
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    // Insert notification to captain
    insertItem('notifications', {
      recipient_id: team.captain_id,
      type: 'jersey_order_update',
      title: 'Forma Ödemesi Alındı',
      message: `${user.full_name} forma sipariş bedelini ödedi.`,
      deep_link: `/orders/${orderId}`,
      read: false
    });

    loadData();
  };

  const handleSendToProduction = () => {
    // Check if captain
    if (user.id !== team.captain_id) return;

    updateItem('jersey_orders', orderId, {
      status: 'processing'
    });

    // Create notifications for all paid members
    items.forEach((item: any) => {
      if (item.profile_id !== user.id) {
        insertItem('notifications', {
          recipient_id: item.profile_id,
          type: 'jersey_order_update',
          title: 'Forma Siparişiniz Üretime Gönderildi!',
          message: `${team.name} formaları üretime aktarılmıştır. Kargo takip kodunu buradan izleyebilirsiniz.`,
          deep_link: `/orders/${orderId}`,
          read: false
        });
      }
    });

    // Notify admin
    insertItem('notifications', {
      recipient_id: 'player-admin', // admin
      type: 'jersey_order_update',
      title: 'Yeni Forma Sipariş Talebi',
      message: `${team.name} takımı forma sipariş detaylarını üretime gönderdi.`,
      deep_link: `/admin`,
      read: false
    });

    loadData();
  };

  // Check if all roster has paid
  const isAllPaid = roster.length > 0 && roster.every(member => member.item && member.item.paid);
  const isCaptain = user?.id === team.captain_id;

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="text-left">
          <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Forma Sipariş Grubu</h1>
          <p className="text-sm text-muted-foreground mt-1">{team.name} takımı için ortak forma organizasyonu.</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          <div className="text-xs font-semibold text-white uppercase tracking-wider">
            DURUM: {ORDER_STATUS_LABELS[order.status] || order.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Col: Jersey ReadOnly Vector Preview */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">Kilitlenen Tasarım</h2>
          <JerseyEditor
            initialDesign={order.jersey_design_snapshot}
            sport={team.sport}
            isReadOnly={true}
          />
        </div>

        {/* Right Col: Sizes Collection table & User details form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Customizer form */}
          {user && isMember && order.status === 'collecting_details' && (
            <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Benim Forma Detaylarım</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Formaya basılacak beden, numara ve isminizi kaydedin.</p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-lg text-xs text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveDetails} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Forma Bedeni</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Numara</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={squadNumber}
                    onChange={(e) => setSquadNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white text-center focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Forma Adı</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white uppercase focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-between gap-4 mt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Detayları Kaydet
                  </button>

                  {myOrderItem && !myOrderItem.paid && (
                    <button
                      type="button"
                      onClick={handlePay}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-black hover:bg-primary/95 rounded-xl text-xs font-bold transition-all font-heading uppercase tracking-wider"
                    >
                      <CreditCard size={14} /> Payımı Öde ($45.00)
                    </button>
                  )}
                </div>
              </form>

              {myOrderItem && myOrderItem.paid && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <Check size={16} />
                  <span>Forma bilgileriniz kilitlendi ve payınızın ödemesi tamamlandı!</span>
                </div>
              )}
            </div>
          )}

          {/* Group order roster list */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">Grup Roster Detayları</h3>
            
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                <thead className="bg-black/60 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Oyuncu</th>
                    <th className="px-4 py-3 font-semibold">Beden</th>
                    <th className="px-4 py-3 font-semibold">No / İsim</th>
                    <th className="px-4 py-3 font-semibold">Ödeme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-zinc-900/10">
                  {roster.map((member) => (
                    <tr key={member.profile.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img
                          src={member.profile.avatar_url}
                          alt={member.profile.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white leading-tight">{member.profile.full_name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{member.profile.role}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {member.item ? member.item.size : <span className="text-muted-foreground/40">-</span>}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {member.item ? (
                          <span className="text-white">
                            #{member.item.squad_number} <span className="text-[10px] text-muted-foreground font-sans">({member.item.player_name})</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">Girilmedi</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {member.item ? (
                          member.item.paid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Check size={10} /> Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                              <Clock size={10} /> Bekliyor
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30">Detay Yok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Captain Controls Panel */}
          {isCaptain && order.status === 'collecting_details' && (
            <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl text-left space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={16} className="text-primary" /> Kaptan Yönetim Araçları
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Roster tamamlanıp tüm oyuncular ödeme yaptığında siparişi üretime aktarabilirsiniz.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Toplanan Ödemeler</div>
                  <div className="text-lg font-heading font-black text-white mt-1">
                    {items.filter(i => i.paid).length} / {roster.length} Oyuncu
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Toplam Sipariş Tutarı</div>
                  <div className="text-lg font-heading font-black text-primary mt-1">
                    ${(items.length * order.price_per_unit).toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSendToProduction}
                disabled={!isAllPaid}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black disabled:bg-white/10 disabled:text-muted-foreground rounded-xl text-xs font-bold font-heading uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] disabled:shadow-none"
              >
                <FileSpreadsheet size={16} />
                Siparişi Üretime Gönder
              </button>

              {!isAllPaid && (
                <div className="text-[10px] text-amber-500/80 leading-normal text-center">
                  * Üretime göndermek için tüm takım üyelerinin (roster) detayları doldurup payını ödemiş olması gereklidir.
                </div>
              )}
            </div>
          )}

          {/* Locked / Processing states info */}
          {order.status === 'processing' && (
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl text-left space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={16} className="text-primary animate-spin" /> Siparişiniz Üretimde!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tasarım kilitlendi ve basım tesislerimize aktarıldı. Baskı boyası kurgusu ve kumaş kesimi devam etmektedir. Takım kaptanına kargo takip kodu iletilecektir.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
