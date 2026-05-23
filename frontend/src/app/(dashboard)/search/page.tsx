'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search, Play, Plus, Sparkles, Music, AlertTriangle, Key } from 'lucide-react';
import api from '@/utils/api';
import usePlayerStore, { Track } from '@/store/usePlayerStore';
import TrackRow from '@/components/TrackRow';

const DEMO_TRACKS: Track[] = [
  {
    id: 'f3kG_zVnSgM',
    title: 'Resonance',
    artist: 'HOME',
    duration: 212,
    thumbnail: 'https://i.ytimg.com/vi/f3kG_zVnSgM/hqdefault.jpg',
  },
  {
    id: 'U7JleMh8HkY',
    title: 'Midnight City',
    artist: 'M83',
    duration: 243,
    thumbnail: 'https://i.ytimg.com/vi/U7JleMh8HkY/hqdefault.jpg',
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill synth beats to game/relax',
    artist: 'Lofi Girl Synthwave',
    duration: 0,
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
  },
  {
    id: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    duration: 0,
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
  },
  {
    id: 'tNefFayutWw',
    title: 'Cyberpunk Ambient Music - Neon Rain & Chill Synths',
    artist: 'Cyber Vibes',
    duration: 3600,
    thumbnail: 'https://i.ytimg.com/vi/tNefFayutWw/hqdefault.jpg',
  }
];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { setQueue, setTrack, addToQueue } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Sync internal state with URL query change
  useEffect(() => {
    setSearchQuery(query);
    if (query.trim()) {
      executeSearch(query);
    } else {
      setResults([]);
      setSearched(false);
      setShowKeyGuide(false);
    }
  }, [query]);

  const executeSearch = async (q: string) => {
    setLoading(true);
    setShowKeyGuide(false);
    setSearched(true);
    try {
      // 1. Try querying our Hugging Face backend first
      const response = await api.get(`/music/search?q=${encodeURIComponent(q)}`);
      if (response.data && response.data.length > 0) {
        setResults(response.data);
        return;
      }
      throw new Error("No backend tracks returned");
    } catch (err: any) {
      console.warn('Backend search grid blocked. Activating client demo mode & setup guide...', err.message);
      
      // Load premium demo tracks so they can test playback immediately!
      setResults(DEMO_TRACKS);
      setShowKeyGuide(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePlayAll = () => {
    if (results.length > 0) {
      setQueue(results);
      setTrack(results[0]);
    }
  };

  const handleAddAllToQueue = () => {
    results.forEach((track) => addToQueue(track));
  };

  const trendingTags = [
    { name: 'Synthwave', tag: 'synthwave retro' },
    { name: 'Lo-Fi Chill', tag: 'lofi study relax' },
    { name: 'Future Funk', tag: 'future funk' },
    { name: 'Ambient Space', tag: 'ambient space deep focus' },
    { name: 'Phonk', tag: 'drift phonk' },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-white" />
            Database Search
          </h1>
          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
            Query the global database for high fidelity tracks
          </p>
        </div>

        {/* Search bar inside the page as fallback / main control */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 select-none">
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-500 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all shadow-sm"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550 pointer-events-none" />
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-widest">
            Searching network grid...
          </p>
        </div>
      ) : showKeyGuide ? (
        <div className="space-y-6">
          {/* Key Activation Guide Panel */}
          <div className="p-5 rounded-xl bg-zinc-950/60 border border-red-950/40 text-left max-w-xl mx-auto space-y-4">
            <div className="flex items-center gap-2.5 text-red-500/90">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Cloud Network Access Offline</h3>
            </div>
            
            <p className="text-[10px] text-zinc-450 leading-relaxed font-sans">
              Google blocks standard cloud hosting IPs from scraping search results directly. To unlock unlimited, instant search with zero restrictions, configure a **free Google YouTube API Key** in your Hugging Face Space:
            </p>

            <div className="bg-black/40 rounded-lg p-3.5 border border-zinc-900 font-mono text-[9px] text-zinc-400 space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="text-zinc-500">1.</span>
                <span>Go to <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" className="text-white hover:underline font-bold">Google Cloud Console</a> and enable **YouTube Data API v3** (100% Free).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-zinc-500">2.</span>
                <span>Go to the **Credentials** page, click **Create Credentials**, and select **API Key**.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-zinc-500">3.</span>
                <span>Open your <a href="https://huggingface.co/spaces/makhalidsh/youtwhy/settings" target="_blank" rel="noreferrer" className="text-white hover:underline font-bold">Hugging Face Space Settings</a>, scroll to **Variables and secrets**, and add a secret named `YOUTUBE_API_KEY` with your key value.</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 text-[9px] font-mono uppercase pt-1">
              <Key className="w-3.5 h-3.5" />
              <span>Loaded Premium Local Beats below for instant playback testing:</span>
            </div>
          </div>

          {/* Render Demo Tracks */}
          {results.length > 0 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                  Test Songs ({results.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAll}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black text-[9px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Play
                  </button>
                  <button
                    onClick={handleAddAllToQueue}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-350 text-[9px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" /> Queue
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 select-none">
                {results.map((track, idx) => (
                  <TrackRow key={track.id} track={track} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {/* Action Header bar for results */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-550 font-mono uppercase tracking-wider">
              Search Results ({results.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" /> Play All
              </button>
              <button
                onClick={handleAddAllToQueue}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Queue All
              </button>
            </div>
          </div>

          {/* List of track components */}
          <div className="space-y-2 select-none">
            {results.map((track, idx) => (
              <TrackRow key={track.id} track={track} index={idx} />
            ))}
          </div>
        </div>
      ) : searched ? (
        <div className="py-16 text-center max-w-md mx-auto flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900/60 rounded-xl p-8">
          <Music className="w-8 h-8 text-zinc-800 mb-3" />
          <h3 className="text-xs font-bold text-zinc-300">No Tracks Found</h3>
          <p className="text-[10px] text-zinc-555 mt-1 max-w-[250px] leading-relaxed">
            We couldn&apos;t find any tracks matching &quot;{query}&quot;. Try adjusting your keywords.
          </p>
        </div>
      ) : (
        /* Blank/Start state: show suggestions and cyber vibes */
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-[#0a0a0a] border border-zinc-850 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white" />
              What are we flowing to today?
            </h3>
            <p className="text-[10px] text-zinc-400 leading-relaxed max-w-lg">
              Type keywords in the search bar above to query audio files dynamically. We stream, cache, and index with native M4A download support.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block">
              Trending Vibe Searches
            </span>
            <div className="flex flex-wrap gap-2.5">
              {trendingTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(tag.tag)}`)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-xs text-zinc-400 hover:text-white cursor-pointer transition-all duration-200 shadow-sm active:scale-95"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-widest">
            Loading search subsystems...
          </p>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
