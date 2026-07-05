'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { getItems, updateItem } from '@/lib/db';
import { Bell, ChevronDown, Globe, LogOut, Menu, User, ShieldAlert, Award, Calendar, Compass, ShoppingBag } from 'lucide-react';

export default function Header({ locale }: { locale: string }) {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchUser } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);

  // Ref refs for clicking outside
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load all mock profiles to let admin switch
  const allProfiles = getItems('profiles');

  useEffect(() => {
    if (!user) return;
    // Load notifications for the logged-in user
    const list = getItems('notifications').filter((n: any) => n.recipient_id === user.id);
    setNotifications(list);

    // Click outside handler
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setIsLangMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLocaleChange = (nextLocale: 'tr' | 'en') => {
    setIsLangMenuOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  const handleNotifClick = (id: string, deepLink: string) => {
    updateItem('notifications', id, { read: true, read_at: new Date().toISOString() });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setIsNotifMenuOpen(false);
    router.push(deepLink);
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) updateItem('notifications', n.id, { read: true, read_at: new Date().toISOString() });
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-50 bg-black/70 border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-heading font-extrabold tracking-wider text-white flex items-center gap-2">
              CITY<span className="text-primary font-bold">LEAGUE</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 text-sm font-medium text-muted-foreground">
              <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
              <Link href="/tournaments" className="hover:text-white transition-colors">{t('tournaments')}</Link>
              <Link href="/recruitment" className="hover:text-white transition-colors">{t('recruitment')}</Link>
              <Link href="/customizer" className="hover:text-white transition-colors">Forma Tasarla</Link>
              
              {user && (
                <Link href={`/players/${user.id}`} className="hover:text-white transition-colors">Profilim</Link>
              )}

              {user?.role === 'platform_admin' && (
                <Link href="/admin" className="text-accent hover:text-accent/80 font-semibold flex items-center gap-1">
                  <ShieldAlert size={14} /> Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 text-muted-foreground hover:text-white rounded-full bg-white/5 border border-white/5 transition-all flex items-center gap-1 text-xs font-semibold"
              >
                <Globe size={16} />
                <span className="uppercase">{locale}</span>
                <ChevronDown size={12} />
              </button>
              
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => handleLocaleChange('tr')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-xs font-medium text-left transition-colors ${locale === 'tr' ? 'text-primary bg-white/5' : 'text-muted-foreground hover:text-white'}`}
                  >
                    Türkçe (TR)
                  </button>
                  <button
                    onClick={() => handleLocaleChange('en')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-xs font-medium text-left transition-colors ${locale === 'en' ? 'text-primary bg-white/5' : 'text-muted-foreground hover:text-white'}`}
                  >
                    English (EN)
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                  className="p-2 text-muted-foreground hover:text-white rounded-full bg-white/5 border border-white/5 transition-all relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                  )}
                </button>

                {isNotifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs font-heading font-semibold text-white tracking-wider">BİLDİRİMLER</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:underline">
                          Tümünü Okundu İşaretle
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                          Bildiriminiz bulunmuyor.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif.id, notif.deep_link)}
                            className={`w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 transition-colors flex flex-col gap-1 ${!notif.read ? 'bg-primary/5' : ''}`}
                          >
                            <span className="text-xs font-medium text-white">{notif.title}</span>
                            <span className="text-[11px] text-muted-foreground leading-normal">{notif.message}</span>
                            <span className="text-[9px] text-muted-foreground/40 mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile / Demo Role Switcher */}
            {user ? (
              <div className="relative flex items-center gap-2" ref={userRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs font-medium"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-6 h-6 rounded-full border border-white/20 object-cover"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-[10px] font-semibold text-primary uppercase leading-none">{user.role}</div>
                    <div className="text-white leading-tight font-medium mt-0.5">{user.full_name}</div>
                  </div>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-[110%] mt-1 w-64 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                      <div className="text-xs font-semibold text-muted-foreground">Demo Test Rol Seçimi</div>
                      <div className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">Farklı yetkileri simüle etmek için rol seçin:</div>
                    </div>

                    <div className="space-y-0.5 max-h-56 overflow-y-auto px-1">
                      {allProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            switchUser(profile.id);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors ${user.id === profile.id ? 'bg-primary/20 text-white font-bold' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                        >
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{profile.full_name}</div>
                            <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{profile.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-white/5 mt-2 pt-2 px-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-black hover:bg-primary/90 transition-all font-heading tracking-wide"
              >
                {t('login')}
              </Link>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-white rounded-lg md:hidden hover:bg-white/5"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-white/5 px-4 py-4 space-y-3 flex flex-col text-sm font-medium">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white">{t('home')}</Link>
          <Link href="/tournaments" onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-white">{t('tournaments')}</Link>
          <Link href="/recruitment" onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-white">{t('recruitment')}</Link>
          <Link href="/customizer" onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-white">Forma Tasarla</Link>
          {user && (
            <Link href={`/players/${user.id}`} onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-white">Profilim</Link>
          )}
          {user?.role === 'platform_admin' && (
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-accent flex items-center gap-1 font-semibold">
              <ShieldAlert size={14} /> Admin Paneli
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
