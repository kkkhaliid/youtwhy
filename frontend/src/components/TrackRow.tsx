'use client';

import { Play, Pause, Heart, Trash2, Plus, Clock, Download } from 'lucide-react';
import usePlayerStore, { Track } from '../store/usePlayerStore';
import useAuthStore from '../store/useAuthStore';
import { useState, useEffect } from 'react';

interface TrackRowProps {
  track: Track;
  index: number;
  showRemove?: boolean;
}

export default function TrackRow({ track, index, showRemove = false }: TrackRowProps) {
  const {
    currentTrack,
    isPlaying,
    setTrack,
    togglePlay,
    likedTracks,
    toggleLike,
    removeFromQueue,
    setDownloadingTrack,
  } = usePlayerStore() as any;

  const { isAuthenticated } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isLiked = likedTracks.some((t: any) => t.id === track.id);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please sign in to like tracks!');
      return;
    }
    toggleLike(track);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromQueue(track.id);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlayClick}
      className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group cursor-pointer border ${
        isCurrent
          ? 'bg-zinc-900 border-zinc-700 shadow-sm'
          : 'bg-zinc-950/40 border-transparent hover:bg-zinc-900/60 hover:border-zinc-850'
      }`}
    >
      {/* Left items: Number / Play, Thumbnail, Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Index/Play button */}
        <div className="w-6 flex items-center justify-center text-xs font-semibold text-zinc-500">
          {isHovered ? (
            <button className="cursor-pointer text-white hover:scale-110 transition-transform">
              {isCurrent && isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          ) : isCurrent && isPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] h-3 bg-white rounded-full animate-[equalizer_0.8s_infinite] origin-bottom eq-bar-1" />
              <div className="w-[2px] h-2 bg-white rounded-full animate-[equalizer_0.8s_infinite] origin-bottom eq-bar-2" />
              <div className="w-[2px] h-3.5 bg-white rounded-full animate-[equalizer_0.8s_infinite] origin-bottom eq-bar-3" />
            </div>
          ) : (
            <span className={isCurrent ? 'text-white font-bold' : 'text-zinc-550'}>{index + 1}</span>
          )}
        </div>
 
        {/* Thumbnail */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-850 shadow">
          <img
            src={track.thumbnail}
            alt={track.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
 
        {/* Text details */}
        <div className="flex flex-col min-w-0 pr-4">
          <span
            className={`text-xs font-semibold truncate ${
              isCurrent ? 'text-white' : 'text-zinc-200'
            }`}
          >
            {track.title}
          </span>
          <span className="text-[10px] text-zinc-400 truncate mt-0.5">{track.artist}</span>
        </div>
      </div>

      {/* Right items: Liked Heart, Download, Duration, Action Button */}
      <div className="flex items-center gap-3 text-xs font-semibold">
        {/* Heart icon */}
        <button
          onClick={handleLikeClick}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 p-1.5 rounded-lg border ${
            isLiked
              ? 'text-white bg-zinc-900 border-zinc-800'
              : 'text-zinc-500 border-transparent hover:text-white hover:bg-zinc-900 opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
          title={isLiked ? 'Remove from Liked Songs' : 'Like this song'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Download icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDownloadingTrack(track);
          }}
          className="cursor-pointer transition-all duration-200 hover:scale-105 p-1.5 rounded-lg border border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Download track"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Duration */}
        <span className="text-zinc-400 w-10 text-right tabular-nums">
          {formatDuration(track.duration)}
        </span>

        {/* Delete option for Queue views */}
        {showRemove ? (
          <button
            onClick={handleRemoveClick}
            className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/20 transition-all cursor-pointer"
            title="Remove from Queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-6" /> // spacer
        )}
      </div>
    </div>
  );
}
