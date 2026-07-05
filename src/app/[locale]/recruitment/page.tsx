'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, getItem, insertItem, updateItem } from '@/lib/db';
import { ShieldCheck, Plus, Send, AlertCircle, Search, Compass, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RecruitmentBoardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [listings, setListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('football');
  const [position, setPosition] = useState('ST');
  const [city, setCity] = useState('Ankara');

  // Request Modal states
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [reqMessage, setReqMessage] = useState('');

  const loadData = () => {
    const list = getItems('recruitment_listings').filter(l => l.active);
    setListings(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Detect listing type based on role
    const isCaptain = user.role === 'captain';
    const myTeams = getItems('teams');
    const myTeam = myTeams.find(t => t.captain_id === user.id);

    insertItem('recruitment_listings', {
      type: isCaptain ? 'team_seeking_player' : 'player_seeking_team',
      creator_id: user.id,
      team_id: isCaptain && myTeam ? myTeam.id : null,
      sport,
      title: title.trim(),
      description: description.trim(),
      city,
      preferred_position: position,
      active: true
    });

    setIsModalOpen(false);
    confetti({ particleCount: 50, spread: 60 });
    loadData();
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedListing) return;

    // Determine receiver
    const receiverId = selectedListing.creator_id;

    // Insert request
    insertItem('recruitment_requests', {
      listing_id: selectedListing.id,
      sender_id: user.id,
      receiver_id: receiverId,
      team_id: selectedListing.team_id || null,
      message: reqMessage.trim(),
      status: 'pending'
    });

    // Notify receiver
    insertItem('notifications', {
      recipient_id: receiverId,
      type: 'recruitment_request',
      title: 'Yeni Transfer Talebi Aldınız',
      message: `${user.full_name} oluşturduğunuz '${selectedListing.title}' ilanı için talep gönderdi.`,
      deep_link: `/recruitment`, // dashboard link
      read: false
    });

    setIsReqModalOpen(false);
    setReqMessage('');
    confetti({ particleCount: 60, spread: 50 });
    alert('Talebiniz başarıyla iletildi! Karşı taraf onayladığında bildirim alacaksınız.');
  };

  const getCreatorName = (creatorId: string) => {
    const p = getItem('profiles', creatorId);
    return p ? p.full_name : 'Unknown';
  };

  const getCreatorAvatar = (creatorId: string) => {
    const p = getItem('profiles', creatorId);
    return p ? p.avatar_url : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=64&h=64&q=80';
  };

  const getTeamName = (teamId: string) => {
    const t = getItem('teams', teamId);
    return t ? t.name : '';
  };

  const filteredListings = listings.filter(l => 
    activeTab === 'players' ? l.type === 'player_seeking_team' : l.type === 'team_seeking_player'
  );

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Transfer Pazarı</h1>
          <p className="text-sm text-muted-foreground mt-1">Serbest oyuncuları takımınıza katın veya eksik kadrosu olan takımlara başvurun.</p>
        </div>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-primary text-black font-bold text-xs rounded-xl hover:bg-primary/90 transition-all font-heading uppercase tracking-wider"
          >
            <Plus size={16} /> İlan Yayınla
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-white/5 flex gap-6 text-sm font-heading font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('players')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'players' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Serbest Oyuncular
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
          Oyuncu Arayan Takımlar
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-zinc-900/60 border border-white/5 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:border-white/10 transition-all"
          >
            {/* Header info card */}
            <div className="flex items-start gap-4">
              <img
                src={getCreatorAvatar(listing.creator_id)}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-white/10"
              />
              <div className="text-left">
                <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider leading-tight">
                  {listing.title}
                </h3>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1 block">
                  {getCreatorName(listing.creator_id)} {listing.team_id && `• ${getTeamName(listing.team_id)}`}
                </span>
              </div>
            </div>

            {/* Description content */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {listing.description}
            </p>

            {/* Bottom details badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-[10px] text-white">
                <span className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-primary uppercase font-bold tracking-wider">{listing.sport}</span>
                <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{listing.preferred_position}</span>
                <span className="bg-zinc-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{listing.city}</span>
              </div>

              {user && user.id !== listing.creator_id && (
                <button
                  onClick={() => {
                    setSelectedListing(listing);
                    setIsReqModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black font-bold text-[10px] rounded-xl hover:bg-primary/95 transition-all font-heading uppercase tracking-wider"
                >
                  <Send size={12} /> {activeTab === 'players' ? 'Takıma Davet Et' : 'Talebi İlet'}
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredListings.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs text-muted-foreground bg-zinc-900/10 border border-dashed border-white/5 rounded-3xl">
            <Compass className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30 animate-spin" />
            Aktif arama ilanı bulunmamaktadır. Kendi ilanınızı oluşturabilirsiniz.
          </div>
        )}
      </div>

      {/* Modal: Create Listing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-md text-left space-y-6 shadow-2xl">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="text-primary" /> Transfer İlanı Oluştur
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.role === 'captain' ? 'Takımınız için aradığınız oyuncu kriterlerini belirtin.' : 'Kendinizi yerel takımlara tanıtacak ilan ayrıntılarını yazın.'}
              </p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">İlan Başlığı</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Ankara Lions için Stoper Arayışı"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Detaylı Açıklama</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aradığınız özellikleri, maç saatlerinizi ve takım hedeflerinizi detaylandırın..."
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Pozisyon</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Örn: CB veya ST"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">Şehir</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Örn: Ankara"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-white transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-black font-bold rounded-xl transition-all font-heading uppercase"
                >
                  Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send Request */}
      {isReqModalOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-md text-left space-y-6 shadow-2xl">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="text-primary" /> Talep Gönder
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                İlan sahibi {getCreatorName(selectedListing.creator_id)} kişisine hızlı bir mesaj ekleyerek talebi gönderin.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">Kişisel Mesaj</label>
                <textarea
                  rows={4}
                  required
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="Merhaba, stoper arayışınızla ilgileniyorum. Boyum 1.89 ve stoper olarak Ankara'da amatör düzeyde oynadım..."
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsReqModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-white transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-black font-bold rounded-xl transition-all font-heading uppercase"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
