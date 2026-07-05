'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('Nav');

  return (
    <footer className="bg-black/95 border-t border-white/5 py-8 mt-auto backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Slogan */}
          <div className="md:col-span-2">
            <span className="text-xl font-heading font-extrabold tracking-wider text-white flex items-center gap-2">
              CITY<span className="text-primary font-bold">LEAGUE</span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Yerel spor topluluklarını dijitalleştiren, takım ve turnuva yönetimini profesyonel analizlerle birleştiren yeni nesil spor platformu.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-heading font-bold text-white tracking-widest uppercase mb-4">Navigasyon</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-primary transition-colors">{t('tournaments')}</Link>
              </li>
              <li>
                <Link href="/recruitment" className="hover:text-primary transition-colors">{t('recruitment')}</Link>
              </li>
              <li>
                <Link href="/customizer" className="hover:text-primary transition-colors">Forma Stüdyosu</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Social */}
          <div>
            <h3 className="text-xs font-heading font-bold text-white tracking-widest uppercase mb-4">Sosyal Medya</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://instagram.com" className="hover:text-primary transition-colors">Instagram</a>
              </li>
              <li>
                <a href="https://twitter.com" className="hover:text-primary transition-colors">Twitter (X)</a>
              </li>
              <li>
                <a href="https://youtube.com" className="hover:text-primary transition-colors">YouTube</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} CityLeague. Tüm Hakları Saklıdır.</span>
          <span className="mt-2 sm:mt-0 flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-white transition-colors">Kullanım Şartları</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
