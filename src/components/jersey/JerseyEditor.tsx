'use client';

import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Check, Lock } from 'lucide-react';

interface JerseyDesign {
  templateId: 'solid' | 'striped' | 'hooped' | 'gradient';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  text: string;
  number: string;
  sponsorLogoUrl?: string;
}

interface JerseyEditorProps {
  initialDesign?: JerseyDesign;
  sport?: 'football' | 'basketball' | 'volleyball';
  onSave?: (design: JerseyDesign) => void;
  isReadOnly?: boolean;
}

export default function JerseyEditor({
  initialDesign,
  sport = 'football',
  onSave,
  isReadOnly = false
}: JerseyEditorProps) {
  const [design, setDesign] = useState<JerseyDesign>({
    templateId: initialDesign?.templateId || 'solid',
    primaryColor: initialDesign?.primaryColor || '#1e3a8a',
    secondaryColor: initialDesign?.secondaryColor || '#eab308',
    accentColor: initialDesign?.accentColor || '#ffffff',
    text: initialDesign?.text || 'CITY',
    number: initialDesign?.number || '10',
    sponsorLogoUrl: initialDesign?.sponsorLogoUrl || ''
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave(design);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const templates = [
    { id: 'solid', name: 'Düz Renk' },
    { id: 'striped', name: 'Çubuklu' },
    { id: 'hooped', name: 'Enine Çizgili' },
    { id: 'gradient', name: 'Degrade' }
  ];

  const presets = [
    { primary: '#1e3a8a', secondary: '#eab308', name: 'Sarı Lacivert' },
    { primary: '#990f0f', secondary: '#eab308', name: 'Sarı Kırmızı' },
    { primary: '#111827', secondary: '#f3f4f6', name: 'Siyah Beyaz' },
    { primary: '#0369a1', secondary: '#dc2626', name: 'Mavi Kırmızı' },
    { primary: '#166534', secondary: '#ffffff', name: 'Yeşil Beyaz' }
  ];

  const renderJerseySVG = () => {
    const { templateId, primaryColor, secondaryColor, accentColor, text, number, sponsorLogoUrl } = design;

    // SVG shapes based on sport type
    const isBasketball = sport === 'basketball';

    const fillSource = {
      solid: primaryColor,
      striped: 'url(#stripes)',
      hooped: 'url(#hoops)',
      gradient: 'url(#jerseyGrad)'
    }[templateId];

    return (
      <svg
        viewBox="0 0 400 450"
        className="w-full h-[380px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter transition-all duration-300"
      >
        <defs>
          {/* Vertical Stripes pattern */}
          <pattern id="stripes" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="20" height="40" fill={primaryColor} />
            <rect x="20" width="20" height="40" fill={secondaryColor} />
          </pattern>

          {/* Horizontal Hoops pattern */}
          <pattern id="hoops" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="20" fill={primaryColor} />
            <rect y="20" width="40" height="20" fill={secondaryColor} />
          </pattern>

          {/* Gradient definitions */}
          <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Fabric mesh texture pattern overlays */}
          <filter id="fabric-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2" result="light">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feBlend mode="multiply" in="SourceGraphic" in2="light" />
          </filter>
        </defs>

        {isBasketball ? (
          // Basketball Tank Top layout
          <g filter="url(#fabric-texture)">
            {/* Body */}
            <path
              d="M 120 70 C 140 90 260 90 280 70 L 290 120 C 275 130 270 150 280 180 L 270 410 L 130 410 L 120 180 C 130 150 125 130 110 120 Z"
              fill={fillSource}
              stroke={accentColor}
              strokeWidth="4"
            />
            {/* Collar & Armhole Trims */}
            <path d="M 120 70 C 150 85 250 85 280 70" fill="none" stroke={accentColor} strokeWidth="8" />
            <path d="M 110 120 C 125 130 130 150 120 180" fill="none" stroke={accentColor} strokeWidth="6" />
            <path d="M 290 120 C 275 130 270 150 280 180" fill="none" stroke={accentColor} strokeWidth="6" />
          </g>
        ) : (
          // Soccer/Volleyball layout with sleeves
          <g filter="url(#fabric-texture)">
            {/* Left Sleeve */}
            <path
              d="M 130 90 L 70 140 L 95 180 L 135 150 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Left Sleeve Cuff Trim */}
            <path d="M 70 140 L 95 180" fill="none" stroke={accentColor} strokeWidth="8" />

            {/* Right Sleeve */}
            <path
              d="M 270 90 L 330 140 L 305 180 L 265 150 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Right Sleeve Cuff Trim */}
            <path d="M 330 140 L 305 180" fill="none" stroke={accentColor} strokeWidth="8" />

            {/* Main Torso */}
            <path
              d="M 130 90 C 150 110 250 110 270 90 L 275 150 L 265 410 L 135 410 L 125 150 Z"
              fill={fillSource}
              stroke={accentColor}
              strokeWidth="3"
            />
            {/* Collar Trim */}
            <path d="M 130 90 C 150 110 250 110 270 90" fill="none" stroke={accentColor} strokeWidth="10" />
          </g>
        )}

        {/* Squad Number on Chest */}
        <text
          x="200"
          y="260"
          textAnchor="middle"
          fill={accentColor}
          fontFamily="Outfit, sans-serif"
          fontSize="80"
          fontWeight="900"
          className="select-none tracking-tighter"
        >
          {number}
        </text>

        {/* Lettering Text on Upper Chest */}
        <text
          x="200"
          y="160"
          textAnchor="middle"
          fill={accentColor}
          fontFamily="Outfit, sans-serif"
          fontSize="24"
          fontWeight="800"
          className="select-none tracking-widest uppercase"
        >
          {text}
        </text>

        {/* Sponsor Brand Image */}
        {sponsorLogoUrl && (
          <image
            href={sponsorLogoUrl}
            x="145"
            y="300"
            width="110"
            height="45"
            className="filter invert brightness-200 opacity-80"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Visual Canvas Display */}
      <div className="flex flex-col items-center bg-zinc-950 border border-white/5 p-8 rounded-3xl relative">
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{sport} 3D MOCKUP</span>
        </div>
        
        {renderJerseySVG()}
        
        <div className="mt-4 text-center">
          <span className="text-xs text-muted-foreground">Tasarım koordinatları ve Hex kodları üretime hazırdır.</span>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-white uppercase tracking-wider">Forma Özelleştirici</h2>
          <p className="text-xs text-muted-foreground mt-1">Takım renklerini ve taslak görsellerini canlı düzenleyin.</p>
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Tasarım Şablonu</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                disabled={isReadOnly}
                onClick={() => setDesign({ ...design, templateId: tpl.id as any })}
                className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all ${design.templateId === tpl.id ? 'border-primary bg-primary/10 text-white font-bold' : 'border-white/5 text-muted-foreground hover:bg-white/5'}`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color pickers */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Ana Renk</label>
            <input
              type="color"
              disabled={isReadOnly}
              value={design.primaryColor}
              onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
              className="w-full h-10 bg-black border border-white/10 rounded-xl cursor-pointer p-0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">2. Renk</label>
            <input
              type="color"
              disabled={isReadOnly}
              value={design.secondaryColor}
              onChange={(e) => setDesign({ ...design, secondaryColor: e.target.value })}
              className="w-full h-10 bg-black border border-white/10 rounded-xl cursor-pointer p-0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Detaylar</label>
            <input
              type="color"
              disabled={isReadOnly}
              value={design.accentColor}
              onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
              className="w-full h-10 bg-black border border-white/10 rounded-xl cursor-pointer p-0"
            />
          </div>
        </div>

        {/* Presets */}
        {!isReadOnly && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Renk Kombinasyonları</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setDesign({
                    ...design,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black rounded-lg border border-white/5 hover:border-white/10 text-[10px] text-white"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <span className="w-2.5 h-2.5 rounded-full -ml-1" style={{ backgroundColor: preset.secondary }} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Text Inputs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Göğüs Yazısı</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={design.text}
              maxLength={12}
              onChange={(e) => setDesign({ ...design, text: e.target.value })}
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Numara</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={design.number}
              maxLength={2}
              onChange={(e) => setDesign({ ...design, number: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sponsor Logo upload */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Sponsor Logo URL</label>
          <input
            type="text"
            disabled={isReadOnly}
            value={design.sponsorLogoUrl}
            onChange={(e) => setDesign({ ...design, sponsorLogoUrl: e.target.value })}
            placeholder="https://logo.png (Şeffaf zemin önerilir)"
            className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Submit Save Button */}
        {!isReadOnly && onSave && (
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black hover:bg-primary/95 transition-all rounded-xl text-xs font-bold font-heading uppercase tracking-wider"
          >
            {isSaved ? <Check size={14} /> : <ShoppingBag size={14} />}
            {isSaved ? 'KİLİTLENDİ!' : 'Tasarımı Kilitle & Sipariş Başlat'}
          </button>
        )}

        {isReadOnly && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} className="text-primary" />
            <span>Bu forma tasarımı kilitlenmiştir ve sipariş aşamasındadır.</span>
          </div>
        )}
      </div>
    </div>
  );
}
