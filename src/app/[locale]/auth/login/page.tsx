'use client';

import React, { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems } from '@/lib/db';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchUser } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Pre-seeded users for quick testing
  const allProfiles = getItems('profiles');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Kullanıcı adı boş bırakılamaz.');
      return;
    }
    const success = await login(username.trim());
    if (success) {
      router.push('/');
    } else {
      setError('Kullanıcı adı bulunamadı. Lütfen kayıt olun veya aşağıdan bir demo hesabı seçin.');
    }
  };

  const handleDemoLogin = (userId: string) => {
    switchUser(userId);
    router.push('/');
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
            Platforma Giriş Yap
          </h2>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Yerel turnuvalara, forma tasarım stüdyosuna ve transfer pazarına katılın.
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
              placeholder="Örn: ahmet_yilmaz"
              className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-primary text-black hover:bg-primary/95 transition-all font-heading uppercase tracking-wider"
          >
            <LogIn size={16} />
            Giriş Yap
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-3 text-muted-foreground/60 font-semibold tracking-wider">Veya Hızlı Test Hesapları</span>
          </div>
        </div>

        {/* Quick Demo Switcher Layout */}
        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
          {allProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleDemoLogin(profile.id)}
              className="flex items-center justify-between p-3 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-8 h-8 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{profile.full_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">@{profile.username}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {profile.role}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/auth/register')}
            className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1 mx-auto"
          >
            Yeni oyuncu hesabı oluştur <ArrowRight size={12} className="text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}
