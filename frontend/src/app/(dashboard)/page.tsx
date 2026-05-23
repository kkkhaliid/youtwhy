'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Music, Loader2 } from 'lucide-react';
import usePlayerStore from '@/store/usePlayerStore';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';

export default function HomePage() {
  const { setTrack, history, fetchHistory } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Warming streaming grid...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* History Section */}
      <section className="space-y-6">
        <div className="border-b border-zinc-900 pb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-white" />
            Recently Played
          </h2>
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Your flow history log</p>
        </div>

        {!mounted ? (
          <div className="space-y-2">
            <div className="w-full h-12 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            <div className="w-full h-12 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            <div className="w-full h-12 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
          </div>
        ) : !isAuthenticated ? (
          <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center justify-center h-48 animate-[fadeIn_0.3s_ease-out]">
            <Music className="w-8 h-8 text-zinc-800 mb-3" />
            <h3 className="text-xs font-bold text-zinc-300">Log In to Sync History</h3>
            <p className="text-[10px] text-zinc-500 max-w-[200px] mt-1.5 leading-relaxed">
              Connect your account to save recently played tracks across the grid.
            </p>
            <Link
              href="/login"
              className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Connect account
            </Link>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center justify-center h-48 animate-[fadeIn_0.3s_ease-out]">
            <Music className="w-8 h-8 text-zinc-800 mb-3" />
            <h3 className="text-xs font-bold text-zinc-400">Grid is quiet</h3>
            <p className="text-[10px] text-zinc-550 mt-1 text-zinc-500 max-w-[180px]">
              Your played music logs will record automatically. Search and play!
            </p>
            <Link
              href="/search"
              className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer inline-block"
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
                className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 cursor-pointer hover:bg-zinc-900 transition-all select-none"
              >
                <img src={track.thumbnail} alt={track.title} className="w-9 h-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-zinc-200 truncate block">{track.title}</span>
                  <span className="text-[9px] text-zinc-500 truncate block mt-0.5">{track.artist}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
