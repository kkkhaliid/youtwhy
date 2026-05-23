'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Music, Loader2, Sparkles, Star, TrendingUp, Play, Plus, Compass } from 'lucide-react';
import usePlayerStore from '@/store/usePlayerStore';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import Sticker from '@/components/Sticker';

const TRENDING_MOCK_ARTWORKS = [
  {
    id: 'f3kG_zVnSgM',
    title: 'Resonance',
    artist: 'HOME',
    author: 'Maca Roni',
    handle: '@lay.designer',
    value: '3.2 eth',
    thumbnail: 'https://i.ytimg.com/vi/f3kG_zVnSgM/hqdefault.jpg',
    duration: 212
  },
  {
    id: 'U7JleMh8HkY',
    title: 'Midnight City',
    artist: 'M83',
    author: 'Two Shon',
    handle: '@lay.designer',
    value: '1.8 eth',
    thumbnail: 'https://i.ytimg.com/vi/U7JleMh8HkY/hqdefault.jpg',
    duration: 243
  }
];

export default function HomePage() {
  const { setTrack, history, fetchHistory, setQueue } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Music');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      try {
        await api.get('/music/recommendations');
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initPage();
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, fetchHistory]);

  const handlePlayArtwork = (track: any) => {
    const t = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail
    };
    setTrack(t);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest font-mono">Warming streaming grid...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8 select-none">
      
      {/* 1. BOLD CYBERPUNK DISPLAY BANNER (Trade Collect Discover) */}
      <div className="bg-black border border-zinc-900 rounded-[2.2rem] p-8 md:p-10 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.02)]">
        <div className="absolute inset-0 cd-grooves rounded-full pointer-events-none opacity-5" />
        
        {/* Floating Rotated Sticker Badge */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 transition-transform duration-350 hover:scale-105">
          <Sticker 
            text="• TRADE • COLLECT • DISCOVER • PREMIUM " 
            id="home-banner-sticker" 
            icon={Star} 
            color="text-neon-green" 
            size="w-20 h-20 md:w-24 md:h-24"
            bg="bg-zinc-950"
          />
        </div>

        <div className="space-y-4 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-neon-green">
              Waveflow Engine Active
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none uppercase select-text">
            Trade <br />
            collect <br />
            discover
          </h1>
          
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-xs pt-1 select-text">
            Explore high fidelity audio assets, compile modern play queues, and vibe directly on the monochrome grid.
          </p>
        </div>
      </div>

      {/* 2. TRENDING ARTWORKS & FILTER SECTIONS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              Trending
            </h2>
            <p className="text-[9px] font-mono font-extrabold text-zinc-550 uppercase tracking-wider mt-0.5">Top-ranked audio collectibles</p>
          </div>

          {/* Graphical Tabs (mimicking mockup: Graphic | Music | Video) */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-900 rounded-xl max-w-max self-start font-mono text-[9px] font-bold uppercase tracking-wider">
            {['Graphic', 'Music', 'Video'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-zinc-900 border border-zinc-800 text-white font-extrabold' 
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Mockup Artwork Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRENDING_MOCK_ARTWORKS.map((art) => (
            <div 
              key={art.id} 
              className="bg-black border border-zinc-900 rounded-[2.2rem] overflow-hidden group hover:border-zinc-850 transition-all duration-300 flex flex-col shadow-sm"
            >
              {/* Image Preview Block with curved corners inside */}
              <div className="p-3">
                <div className="relative aspect-square rounded-[1.6rem] overflow-hidden bg-zinc-950 border border-zinc-900/60 shadow flex items-center justify-center">
                  <img 
                    src={art.thumbnail} 
                    alt={art.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handlePlayArtwork(art)}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition active:scale-95 shadow-md shadow-white/5 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current translate-x-[1.5px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer detail grid */}
              <div className="p-5 pt-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate block">{art.title}</h3>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{art.artist}</p>
                  </div>
                  <span className="text-[10px] font-mono font-black text-neon-green uppercase tracking-wide bg-neon-green/5 border border-neon-green/10 px-2 py-0.5 rounded">
                    {art.value}
                  </span>
                </div>

                {/* Author Info row */}
                <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 text-[10px] font-medium">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3 h-3 text-neon-green" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-zinc-350 font-semibold block truncate">{art.author}</span>
                      <span className="text-[8.5px] font-mono text-zinc-550 block -mt-0.5">{art.handle}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handlePlayArtwork(art)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider transition hover:bg-zinc-900 hover:border-zinc-800 cursor-pointer"
                  >
                    Vibe Flow
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. RECENTLY PLAYED HISTORY SECTION */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-zinc-900 pb-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <History className="w-5 h-5 text-neon-green" />
            Recently Played
          </h2>
          <p className="text-[9px] font-mono font-extrabold text-zinc-550 uppercase tracking-wider mt-0.5">Your played history logs</p>
        </div>

        {!mounted ? (
          <div className="space-y-2">
            <div className="w-full h-12 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            <div className="w-full h-12 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
          </div>
        ) : !isAuthenticated ? (
          <div className="p-6 rounded-[2.2rem] bg-black border border-zinc-900 text-center flex flex-col items-center justify-center h-48 shadow-sm">
            <Music className="w-6 h-6 text-zinc-800 mb-3" />
            <h3 className="text-xs font-bold text-zinc-300">Sync Flow History</h3>
            <p className="text-[9.5px] text-zinc-500 max-w-[220px] mt-1 leading-relaxed">
              Connect your account to synchronize recently played tracks across the grid.
            </p>
            <Link
              href="/login"
              className="mt-4 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer active:scale-95 shadow"
            >
              Connect Account
            </Link>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 rounded-[2.2rem] bg-black border border-zinc-900 text-center flex flex-col items-center justify-center h-48 shadow-sm">
            <Compass className="w-6 h-6 text-zinc-850 mb-3 animate-[spin_6s_linear_infinite]" />
            <h3 className="text-xs font-bold text-zinc-400">Grid is Quiet</h3>
            <p className="text-[9.5px] text-zinc-550 mt-1 max-w-[200px] leading-relaxed">
              Your played music logs will record automatically here. Search and play tracks!
            </p>
            <Link
              href="/search"
              className="mt-4 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer inline-block active:scale-95 shadow"
            >
              Search & Play
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {history.slice(0, 15).map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => setTrack(track)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-transparent hover:border-zinc-900 hover:bg-zinc-950/80 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img src={track.thumbnail} alt={track.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-zinc-900 border border-zinc-850" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate block">{track.title}</span>
                    <span className="text-[9px] text-zinc-500 truncate block mt-0.5">{track.artist}</span>
                  </div>
                </div>
                
                <button className="p-2 rounded-lg border border-transparent text-zinc-500 hover:text-white group-hover:border-zinc-900 hover:bg-zinc-900 active:scale-95 transition-all">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
