'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { updateItem } from '@/lib/db';
import SoccerCard from '@/components/cards/SoccerCard';
import BasketballCard from '@/components/cards/BasketballCard';
import GenericCard from '@/components/cards/GenericCard';
import { ShieldCheck, ArrowRight, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, switchUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isRevealed, setIsRevealed] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Ankara');
  const [locationDetail, setLocationDetail] = useState('');
  const [primarySport, setPrimarySport] = useState('football');
  const [preferredPosition, setPreferredPosition] = useState('ST');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [footballNickname, setFootballNickname] = useState('');
  
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCity(user.city || 'Ankara');
      setLocationDetail(user.location_detail || '');
      setPrimarySport(user.primary_sport || 'football');
      setPreferredPosition(user.preferred_position || 'ST');
      setSkillLevel(user.skill_level || 'intermediate');
      setFootballNickname(user.football_nickname || '');
    }
  }, [user]);

  // Adjust default positions when sport changes
  useEffect(() => {
    if (primarySport === 'football') {
      setPreferredPosition('ST');
    } else if (primarySport === 'basketball') {
      setPreferredPosition('PG');
    } else {
      setPreferredPosition('Setter');
    }
  }, [primarySport]);

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Kullanıcı oturumu yükleniyor veya bulunamadı...</p>
          <button onClick={() => router.push('/auth/login')} className="mt-4 px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold">
            Giriş Sayfasına Git
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save data & trigger reveal
      const updated = updateItem('profiles', user.id, {
        full_name: fullName,
        city,
        location_detail: locationDetail,
        primary_sport: primarySport,
        preferred_position: preferredPosition,
        skill_level: skillLevel,
        football_nickname: footballNickname || fullName.toUpperCase(),
        social_links: { instagram, twitter, contact_email: contactEmail || `${user.username}@cityleague.com` },
        personal_sponsor_name: sponsorName,
        personal_sponsor_logo_url: sponsorLogo,
        onboarding_completed: true
      });

      // Update auth context
      switchUser(user.id);
      setIsRevealed(true);

      // Trigger Confetti fireworks!
      setTimeout(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }, 100);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderCard = () => {
    const cardData = {
      full_name: fullName,
      avatar_url: user.avatar_url,
      preferred_position: preferredPosition,
      football_nickname: footballNickname || fullName.split(' ')[0].toUpperCase(),
      skill_level: skillLevel,
      primary_sport: primarySport,
      personal_sponsor_logo_url: sponsorLogo,
      personal_sponsor_name: sponsorName
    };

    if (primarySport === 'football') return <SoccerCard player={cardData} tier="gold" />;
    if (primarySport === 'basketball') return <BasketballCard player={cardData} />;
    return <GenericCard player={cardData} />;
  };

  if (isRevealed) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-zinc-950 py-12 px-4 relative overflow-hidden">
        {/* Animated ambient light ring behind the card */}
        <div className="absolute w-[450px] h-[450px] bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />

        <div className="max-w-md w-full text-center space-y-6 z-10">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20 animate-bounce">
              <Trophy className="text-primary w-8 h-8" />
            </div>
          </div>

          <h2 className="text-2xl font-heading font-extrabold text-white uppercase tracking-wider">
            Lisansın Hazırlandı!
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            CityLeague lisanslı sporcu kimliğin oluşturuldu. İşte senin dynamic oyuncu kartın:
          </p>

          {/* Reveal Card Wrapper with zoom-in entrance */}
          <div className="flex justify-center py-6 animate-fade-in scale-105 hover:scale-110 transition-transform duration-500">
            {renderCard()}
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold bg-primary text-black hover:bg-primary/95 transition-all font-heading uppercase tracking-widest shadow-[0_0_15px_rgba(180,100,50,0.3)]"
          >
            <Sparkles size={16} />
            Sahaya Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/60 border border-white/5 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider">Profil Sihirbazı</h2>
          <div className="flex justify-center gap-2 mt-4">
            <span className={`w-12 h-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
            <span className={`w-12 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
            <span className={`w-12 h-1 rounded ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>01.</span> TEMEL BİLGİLER
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Şehir</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Ankara">Ankara</option>
                <option value="İstanbul">İstanbul</option>
                <option value="İzmir">İzmir</option>
                <option value="Antalya">Antalya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Semt / İlçe</label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="Örn: Çankaya"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Step 2: Sport Identity */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>02.</span> SPORCU KİMLİĞİ
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Spor Branşı</label>
              <select
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="football">Futbol</option>
                <option value="basketball">Basketbol</option>
                <option value="volleyball">Voleybol</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Tercih Edilen Pozisyon</label>
              {primarySport === 'football' && (
                <select
                  value={preferredPosition}
                  onChange={(e) => setPreferredPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="ST">ST (Forvet)</option>
                  <option value="LW">LW (Sol Kanat)</option>
                  <option value="RW">RW (Sağ Kanat)</option>
                  <option value="CM">CM (Orta Saha)</option>
                  <option value="CB">CB (Stoper)</option>
                  <option value="GK">GK (Kaleci)</option>
                </select>
              )}
              {primarySport === 'basketball' && (
                <select
                  value={preferredPosition}
                  onChange={(e) => setPreferredPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="PG">PG (Oyun Kurucu)</option>
                  <option value="SG">SG (Şutör Gard)</option>
                  <option value="SF">SF (Kısa Forvet)</option>
                  <option value="PF">PF (Uzun Forvet)</option>
                  <option value="C">C (Pivot)</option>
                </select>
              )}
              {primarySport === 'volleyball' && (
                <select
                  value={preferredPosition}
                  onChange={(e) => setPreferredPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="Setter">Setter (Pasör)</option>
                  <option value="Opposite">Opposite (Pasör Çaprazı)</option>
                  <option value="Libero">Libero</option>
                  <option value="Middle">Middle Blocker (Orta Oyuncu)</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Seviye</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
                <option value="semi-pro">Yarı Profesyonel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Forma Arkası İsim</label>
              <input
                type="text"
                value={footballNickname}
                onChange={(e) => setFootballNickname(e.target.value)}
                placeholder="Örn: MEHMET 9"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Step 3: Socials & Sponsors */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>03.</span> SOSYAL & SPONSOR
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Instagram Profili</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/kullanici"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">İletişim E-Posta</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e-posta@domain.com"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Kişisel Sponsor Adı</label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="Örn: Red Bull"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Kişisel Sponsor Logosunu Yükle (URL)</label>
              <input
                type="text"
                value={sponsorLogo}
                onChange={(e) => setSponsorLogo(e.target.value)}
                placeholder="https://domain.com/logo.svg"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-white transition-all"
            >
              <ArrowLeft size={14} /> Geri
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={step === 1 && !fullName.trim()}
            className="flex-grow flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-black hover:bg-primary/95 disabled:bg-white/10 disabled:text-muted-foreground rounded-xl text-xs font-bold transition-all font-heading uppercase tracking-wider"
          >
            {step === 3 ? 'Tamamla & Reveal' : 'İleri'} <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
