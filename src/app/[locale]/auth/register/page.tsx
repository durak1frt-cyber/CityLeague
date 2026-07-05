'use client';

import React, { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { insertItem, getItems } from '@/lib/db';
import { ShieldAlert, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { switchUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check if username already exists
    const profiles = getItems('profiles');
    if (profiles.some(p => p.username === cleanUsername)) {
      setError('Bu kullanıcı adı zaten alınmış. Farklı bir kullanıcı adı deneyin.');
      return;
    }

    // Insert new profile
    const newProfile = insertItem('profiles', {
      username: cleanUsername,
      full_name: fullName.trim(),
      avatar_url: `https://images.unsplash.com/photo-${['1500648767791-00dcc994a43e', '1539571696357-5a69c17a67c6', '1507003211169-0a1dd7228f2d', '1517841905240-472988babdf9'][Math.floor(Math.random() * 4)]}?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
      role: 'player', // default role
      bio: 'CityLeague platformuna yeni katıldı.',
      city: 'Ankara',
      location_detail: 'Çankaya',
      skill_level: 'beginner',
      primary_sport: 'football',
      preferred_position: 'ST',
      football_nickname: fullName.trim().toUpperCase(),
      social_links: {},
      aggregated_stats: { wins: 0, matches_played: 0, goals: 0, assists: 0, mvps: 0 },
      personal_sponsor_name: '',
      personal_sponsor_logo_url: '',
      onboarding_completed: false,
      preferred_locale: 'tr'
    });

    // Login as the new user
    switchUser(newProfile.id);

    // Redirect to onboarding
    router.push('/auth/onboarding');
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-foreground),transparent)] opacity-10 pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-zinc-900/60 border border-white/5 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
        <div>
          <span className="text-2xl font-heading font-extrabold tracking-wider text-white flex justify-center gap-2">
            CITY<span className="text-primary font-bold">LEAGUE</span>
          </span>
          <h2 className="mt-4 text-center text-xl font-heading font-bold text-white uppercase tracking-wide">
            Yeni Oyuncu Kaydı
          </h2>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Kendi sporcu lisansınızı oluşturun ve platforma katılın.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Ad Soyad
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              placeholder="Örn: Mehmet Öz"
              className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Örn: mehmet_oz"
              className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-primary text-black hover:bg-primary/95 transition-all font-heading uppercase tracking-wider"
          >
            <UserPlus size={16} />
            Kayıt Ol & Başla
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1 mx-auto"
          >
            <ArrowLeft size={12} className="text-primary" /> Zaten üye misiniz? Giriş Yapın
          </button>
        </div>
      </div>
    </div>
  );
}
