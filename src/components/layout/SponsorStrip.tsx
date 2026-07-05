'use client';

import React from 'react';

export default function SponsorStrip() {
  const sponsors = [
    { name: 'Red Bull', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Red_Bull_Energy_Drink_logo.svg' },
    { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { name: 'Puma', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Puma_complete_logo.svg' },
    { name: 'Gatorade', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Gatorade_logo.svg' }
  ];

  return (
    <div className="bg-black/90 border-y border-white/5 py-4 overflow-hidden backdrop-blur-md w-full">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] text-muted-foreground/60 mb-2 font-heading tracking-widest font-semibold uppercase">
        <span>CityLeague Partners & Official Sponsors</span>
      </div>
      <div className="flex overflow-hidden select-none relative w-full">
        {/* Shadow overlays for smooth fading edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/90 to-transparent z-10 pointer-events-none" />

        <div className="flex gap-20 animate-marquee whitespace-nowrap">
          {[...sponsors, ...sponsors, ...sponsors].map((sponsor, idx) => (
            <div key={idx} className="flex items-center gap-4 opacity-35 hover:opacity-85 transition-opacity duration-300">
              <img 
                src={sponsor.logo} 
                alt={sponsor.name} 
                className="h-6 w-auto object-contain filter invert brightness-200" 
              />
              <span className="text-xs font-heading font-semibold tracking-wider text-white uppercase">{sponsor.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
