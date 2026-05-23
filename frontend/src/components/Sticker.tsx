'use client';

import React from 'react';

interface StickerProps {
  text: string;
  color?: string;
  bg?: string;
  size?: string;
  icon?: React.ComponentType<{ className?: string }>;
  id: string; // Unique ID for the SVG text path to avoid layout clashes
}

export default function Sticker({
  text,
  color = 'text-neon-green',
  bg = 'bg-zinc-950',
  size = 'w-16 h-16',
  icon: Icon,
  id
}: StickerProps) {
  return (
    <div className={`relative ${size} rounded-full ${bg} border border-zinc-800 shadow-md flex items-center justify-center flex-shrink-0 select-none overflow-hidden group`}>
      {/* Grooves overlay to match cyberpunk vinyl details */}
      <div className="absolute inset-0 cd-grooves rounded-full pointer-events-none opacity-20" />
      
      {/* Circular Text Path rotating slowly */}
      <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow text-zinc-500 absolute inset-0 pointer-events-none group-hover:scale-105 transition-transform duration-500">
        <path 
          id={`circlePathSticker-${id}`} 
          d="M 50, 50 m -34, 0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" 
          fill="none" 
        />
        <text className="font-mono text-[8.5px] font-extrabold uppercase tracking-widest" fill="currentColor">
          <textPath href={`#circlePathSticker-${id}`} spacing="auto" startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>
      
      {/* Bouncing Center Icon */}
      {Icon && (
        <Icon className={`w-[32%] h-[32%] ${color} relative z-10 animate-[bounce_3s_infinite] drop-shadow-[0_0_10px_currentColor]`} />
      )}
    </div>
  );
}
