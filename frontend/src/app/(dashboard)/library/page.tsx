'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart, History, Music, Lock, Play, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import usePlayerStore from '@/store/usePlayerStore';
import useAuthStore from '@/store/useAuthStore';
import TrackRow from '@/components/TrackRow';

function LibraryTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'likes';
  
  const { isAuthenticated } = useAuthStore();
  const { likedTracks, history, setQueue, setTrack } = usePlayerStore();

  const handlePlayAll = () => {
    const list = activeTab === 'likes' ? likedTracks : history;
    if (list.length > 0) {
      setQueue(list);
      setTrack(list[0]);
    }
  };

  const handleTabChange = (tab: 'likes' | 'history') => {
    router.push(`/library?tab=${tab}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 rounded-2xl bg-[#0a0a0a] border border-zinc-850 shadow-sm relative overflow-hidden select-none animate-[fadeIn_0.3s_ease-out]">
        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-base font-bold text-white uppercase tracking-wide">Unlock Your Space</h2>
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          Sign in to save your favorite songs, view your listening history logs, and access customized cloud-synced playlists.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-wider uppercase transition active:scale-95 shadow-sm"
          >
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-350 font-bold text-xs tracking-wider uppercase transition active:scale-95"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'likes' ? likedTracks : history;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-white" />
            Your Library
          </h1>
          <p className="text-[9px] text-zinc-505 font-mono uppercase tracking-wider mt-0.5 text-zinc-500">
            Manage your synchronized songs and audio streams
          </p>
        </div>

        {currentList.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" /> Play Flow
          </button>
        )}
      </div>

      {/* Tabs list selector */}
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-px select-none">
        <button
          onClick={() => handleTabChange('likes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'likes'
              ? 'border-white text-white bg-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-zinc-400" />
          Likes ({likedTracks.length})
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-white text-white bg-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-zinc-400" />
          History ({history.length})
        </button>
      </div>

      {/* List Container */}
      <div className="space-y-4 select-none">
        {currentList.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900 rounded-xl p-8 animate-[fadeIn_0.3s_ease-out]">
            <Music className="w-8 h-8 text-zinc-800 mb-3" />
            <h3 className="text-xs font-bold text-zinc-300">
              {activeTab === 'likes' ? 'No Liked Songs Yet' : 'Log is Empty'}
            </h3>
            <p className="text-[10px] text-zinc-550 mt-1 max-w-[240px] leading-relaxed">
              {activeTab === 'likes'
                ? 'Toggle the heart icon on any tracks to populate your favorites collection.'
                : 'Play tracks from recommendations or search results to log recently played audio.'}
            </p>
            <Link
              href="/search"
              className="mt-6 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Search music
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map((track, idx) => (
              <TrackRow key={`${track.id}-${idx}`} track={track} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-widest">
            Loading library subsystems...
          </p>
        </div>
      }
    >
      <LibraryTabs />
    </Suspense>
  );
}
