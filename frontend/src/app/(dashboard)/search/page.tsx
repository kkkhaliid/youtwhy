'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search, Play, Plus, Sparkles, Music } from 'lucide-react';
import api from '@/utils/api';
import usePlayerStore, { Track } from '@/store/usePlayerStore';
import TrackRow from '@/components/TrackRow';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { setQueue, setTrack, addToQueue } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal state with URL query change
  useEffect(() => {
    setSearchQuery(query);
    if (query.trim()) {
      executeSearch(query);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  const executeSearch = async (q: string) => {
    setLoading(true);
    setError(null);
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
      console.warn('Backend search grid blocked or empty. Launching client-side failover search...', err.message);
      
      // 2. Client-side Invidious failover (executes from the user's browser, bypassing HF block!)
      const instances = [
        'yewtu.be',
        'invidious.io',
        'inv.snopyta.org',
        'inv.tux.im',
        'invidious.flokinet.to'
      ];
      
      for (const instance of instances) {
        try {
          console.log(`[FAILOVER-SEARCH] Querying client-side grid via instance: ${instance}`);
          const res = await fetch(`https://${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video&limit=20`, {
            signal: AbortSignal.timeout(6000) // 6 seconds timeout per instance
          });
          if (!res.ok) continue;
          
          const body = await res.json();
          if (Array.isArray(body) && body.length > 0) {
            const mappedTracks: Track[] = body.slice(0, 20).map((item: any) => ({
              id: item.videoId,
              title: item.title || 'Unknown Title',
              artist: item.author || 'Unknown Artist',
              duration: item.lengthSeconds || 180,
              thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            }));
            
            console.log(`[FAILOVER-SEARCH] Client-side fallback search succeeded on instance: ${instance}`);
            setResults(mappedTracks);
            return;
          }
        } catch (e: any) {
          console.warn(`[FAILOVER-SEARCH] Instance ${instance} failed:`, e.message);
        }
      }
      
      setError('Failed to fetch search results. Please try again or specify keywords.');
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
      ) : error ? (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-900 text-center max-w-md mx-auto">
          <p className="text-xs text-zinc-400 font-semibold">{error}</p>
          <button
            onClick={() => executeSearch(query)}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Retry Search
          </button>
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
          <p className="text-[10px] text-zinc-550 mt-1 max-w-[250px] leading-relaxed">
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
