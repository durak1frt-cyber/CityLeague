'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, insertItem, updateItem } from '@/lib/db';
import JerseyEditor from '@/components/jersey/JerseyEditor';
import { ShieldCheck, Calendar, ArrowRight, ShoppingBag, ShieldAlert } from 'lucide-react';

export default function CustomizerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [captainTeam, setCaptainTeam] = useState<any | null>(null);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Find if user is captain of any team
    const teams = getItems('teams');
    const myTeam = teams.find(t => t.captain_id === user.id);
    setCaptainTeam(myTeam || null);

    if (myTeam) {
      // Find if there is an active order for this team
      const orders = getItems('jersey_orders');
      const myOrder = orders.find(o => o.team_id === myTeam.id && ['collecting_details', 'awaiting_payment'].includes(o.status));
      setActiveOrder(myOrder || null);
    }
  }, [user]);

  const handleSaveJersey = (design: any) => {
    if (!captainTeam) return;

    // Update team design in database
    updateItem('teams', captainTeam.id, {
      jersey_design: design,
      primary_color: design.primaryColor,
      secondary_color: design.secondaryColor
    });

    // If no order exists, create a new Group Order campaign!
    if (!activeOrder) {
      const newOrder = insertItem('jersey_orders', {
        team_id: captainTeam.id,
        status: 'collecting_details',
        jersey_design_snapshot: design,
        price_per_unit: 45.0,
        total_items: 1 // Start with captain item
      });

      // Insert Captain's order item automatically
      insertItem('jersey_order_items', {
        order_id: newOrder.id,
        profile_id: user.id,
        size: 'M', // default size, captain can change on order page
        squad_number: parseInt(design.number) || 10,
        player_name: design.text || user.full_name.split(' ')[0].toUpperCase(),
        paid: true, // Captain starts order
        paid_at: new Date().toISOString()
      });

      router.push(`/orders/${newOrder.id}`);
    } else {
      // Update snapshot of existing order
      updateItem('jersey_orders', activeOrder.id, {
        jersey_design_snapshot: design
      });
      router.push(`/orders/${activeOrder.id}`);
    }
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white uppercase tracking-wider">Tasarım Stüdyosu</h1>
          <p className="text-sm text-muted-foreground mt-1">Takımınızın resmi renklerini ve forma şablonunu belirleyin.</p>
        </div>

        {captainTeam ? (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl">
            <img
              src={captainTeam.logo_url}
              alt={captainTeam.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="text-left">
              <div className="text-[10px] font-bold text-primary uppercase leading-none">AKTİF YÖNETİM</div>
              <div className="text-xs font-semibold text-white leading-tight mt-0.5">{captainTeam.name} Forması</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-2xl max-w-sm">
            <ShieldAlert className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground leading-normal">
              Tasarımları kaydetmek ve oyuncularınızla grup siparişi başlatmak için takım kurup Kaptan olmalısınız.
            </span>
          </div>
        )}
      </div>

      {/* Main Customizer Canvas Panel */}
      <div className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <JerseyEditor
          initialDesign={captainTeam?.jersey_design}
          sport={captainTeam?.sport || 'football'}
          onSave={captainTeam ? handleSaveJersey : undefined}
        />
      </div>

      {/* Group Order Info Banner */}
      {captainTeam && activeOrder && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-3xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <ShoppingBag className="text-primary w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aktif Forma Siparişi Devam Ediyor</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Takımınız için başlattığınız siparişte oyuncularınız beden ve ödeme bilgilerini girmektedir.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/orders/${activeOrder.id}`)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl transition-all font-heading uppercase tracking-wider"
          >
            Siparişi Yönet <ArrowRight size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
