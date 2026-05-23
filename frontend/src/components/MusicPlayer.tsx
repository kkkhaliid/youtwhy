'use client';

import { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ListMusic, Sparkles, Loader2, Download, ChevronDown
} from 'lucide-react';
import usePlayerStore from '../store/usePlayerStore';
import useAuthStore from '../store/useAuthStore';
import useAudio from '../hooks/useAudio';
import Waveform from './Waveform';
import TrackRow from './TrackRow';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    prev,
    volume,
    setVolume,
    shuffle,
    toggleShuffle,
    repeat,
    setRepeat,
    likedTracks,
    toggleLike,
    queue,
    clearQueue,
    setDownloadingTrack,
  } = usePlayerStore() as any;

  const { isAuthenticated } = useAuthStore();
  const { currentTime, duration, isBuffering, error, seek } = useAudio();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Local state to manage smooth seeking and avoid stuttering during slider drags
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Sync seekValue with currentTime when not seeking
  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (e: any) => {
    const value = parseFloat(e.target.value);
    seek(value);
    setIsSeeking(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleRepeatToggle = () => {
    if (repeat === 'none') setRepeat('all');
    else if (repeat === 'all') setRepeat('one');
    else setRepeat('none');
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please sign in to save liked tracks!');
      return;
    }
    toggleLike(currentTrack);
  };

  return (
    <>
      {/* 1. COMPACT FIXED BOTTOM BAR (Always visible, expandable on mobile tap) */}
      <div 
        onClick={() => {
          if (window.innerWidth < 768) {
            setIsExpanded(true);
          }
        }}
        className="fixed bottom-16 md:bottom-0 left-0 right-0 h-20 glassmorphism-player flex items-center justify-between px-4 sm:px-6 z-40 select-none cursor-pointer md:cursor-default"
      >
        {/* Left Side: Track Info, Likes & Mini spinning CD */}
        <div className="flex items-center gap-3 w-2/3 md:w-1/3 min-w-0">
          {/* Mini Spinning CD Record Cover */}
          <div className="relative w-12 h-12 rounded-full flex-shrink-0 bg-zinc-950 border border-zinc-800 shadow flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 cd-grooves rounded-full pointer-events-none" />
            <div className={`w-[92%] h-[92%] rounded-full overflow-hidden animate-spin-cd ${
              isPlaying && !isBuffering ? 'spin-running' : 'spin-paused'
            }`}>
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="object-cover w-full h-full rounded-full" />
            </div>
            {/* Center Hole of CD */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-black border border-zinc-800/80" />
            {isBuffering && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate block">
                {currentTrack.title}
              </span>
              {isPlaying && !isBuffering && (
                <div className="flex-shrink-0">
                  <Waveform isPlaying={true} color="bg-white" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 truncate block mt-0.5">{currentTrack.artist}</span>
          </div>
          
          <button
            onClick={handleLikeClick}
            className={`hidden md:block cursor-pointer p-1.5 rounded-lg transition hover:scale-105 ${
              isLiked ? 'text-white bg-zinc-900 border border-zinc-800' : 'text-zinc-500 hover:text-white'
            }`}
            title={isLiked ? 'Remove from Liked Songs' : 'Like song'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDownloadingTrack(currentTrack);
            }}
            className="hidden md:block cursor-pointer p-1.5 rounded-lg text-zinc-500 hover:text-white transition hover:scale-105"
            title="Download track"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle Side: Playback Controls & Progress Seek (Desktop only) */}
        <div className="hidden md:flex flex-col items-center w-1/3 max-w-xl">
          {/* Controls cluster */}
          <div className="flex items-center gap-5 mb-1.5">
            <button
              onClick={toggleShuffle}
              className={`p-1 rounded-lg transition cursor-pointer relative ${
                shuffle ? 'text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {shuffle && <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
            </button>
            
            <button
              onClick={prev}
              className="p-1 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition hover:scale-105 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
              )}
            </button>

            <button
              onClick={next}
              className="p-1 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleRepeatToggle}
              className={`p-1 rounded-lg transition cursor-pointer relative ${
                repeat !== 'none' ? 'text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
              title={`Repeat: ${repeat}`}
            >
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeat !== 'none' && <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
            </button>
          </div>

          {/* Time seeker progress */}
          <div className="flex items-center gap-2.5 w-full text-[10px] text-zinc-500 font-semibold select-none">
            <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group" onClick={(e) => e.stopPropagation()}>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={seekValue}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer outline-none focus:outline-none accent-white"
              />
              <div 
                style={{ width: `${(seekValue / (duration || 100)) * 100}%` }}
                className="absolute left-0 h-1 bg-white rounded-l-lg pointer-events-none"
              ></div>
            </div>
            <span className="w-8 text-left tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Play/Pause (Mobile) & Volume + Queue Drawer (Desktop) */}
        <div className="flex items-center justify-end gap-3.5 w-1/3" onClick={(e) => e.stopPropagation()}>
          {/* Direct Play/Pause Button on mobile compact player */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="md:hidden w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition active:scale-95 mr-2"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
            )}
          </button>

          {error && (
            <span className="text-[9px] font-bold uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded animate-pulse hidden xl:inline-block">
              {error}
            </span>
          )}

          {/* Queue sync button */}
          <button
            onClick={() => setShowQueuePanel(!showQueuePanel)}
            className={`hidden md:block p-1.5 rounded-lg transition cursor-pointer relative ${
              showQueuePanel 
                ? 'text-white bg-zinc-900 border border-zinc-800' 
                : 'text-zinc-500 hover:text-white border border-transparent'
            }`}
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] font-extrabold bg-white text-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black">
                {queue.length}
              </span>
            )}
          </button>

          {/* Volume node (Desktop only) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="text-zinc-500 hover:text-white p-1 transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-20 relative flex items-center group">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer outline-none accent-white group-hover:bg-zinc-800 transition"
              />
              <div 
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                className="absolute left-0 h-1 bg-white rounded-l-lg pointer-events-none"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FULL-SCREEN MOBILE EXPANDED PLAYER SHEET */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between px-6 pt-4 pb-8 md:hidden select-none animate-[fadeIn_0.25s_ease-out]">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between h-12 border-b border-zinc-900 pb-2">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 text-zinc-500 hover:text-white transition cursor-pointer active:scale-95"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">Now Playing</span>
            <button 
              onClick={() => {
                setIsExpanded(false);
                setShowQueuePanel(true);
              }}
              className="p-2 text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Centered CD record spinning visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center my-6">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#0a0a0a] border border-zinc-800 shadow-[0_0_35px_rgba(255,255,255,0.03)] flex items-center justify-center overflow-hidden">
              {/* Grooves overlay */}
              <div className="absolute inset-0 cd-grooves rounded-full pointer-events-none" />
              
              {/* CD Label printed album thumbnail */}
              <div className={`w-[95%] h-[95%] rounded-full overflow-hidden animate-spin-cd ${
                isPlaying && !isBuffering ? 'spin-running' : 'spin-paused'
              }`}>
                <img 
                  src={currentTrack.thumbnail} 
                  alt={currentTrack.title} 
                  className="object-cover w-full h-full rounded-full" 
                />
              </div>

              {/* Center hole structure */}
              <div className="absolute w-12 h-12 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center shadow-inner">
                <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700/50" />
              </div>
            </div>
            {isBuffering && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 mt-4 animate-pulse">Buffering track flow...</span>
            )}
          </div>

          {/* Details & Playback utilities */}
          <div className="space-y-6">
            
            {/* Title / Artist info block */}
            <div className="text-center px-4">
              <h2 className="text-lg font-black text-white truncate leading-tight select-text">{currentTrack.title}</h2>
              <p className="text-xs text-zinc-500 font-medium truncate mt-1 select-text">{currentTrack.artist}</p>
            </div>

            {/* Slider Seeker */}
            <div className="space-y-1 px-2">
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={seekValue}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer outline-none accent-white"
                />
                <div 
                  style={{ width: `${(seekValue / (duration || 100)) * 100}%` }}
                  className="absolute left-0 h-1 bg-white rounded-l-lg pointer-events-none"
                ></div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-550 font-semibold font-mono pt-1">
                <span>{formatTime(seekValue)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Oversized Tactical Controls */}
            <div className="flex items-center justify-between px-4">
              {/* Shuffle */}
              <button 
                onClick={toggleShuffle} 
                className={`p-2 transition active:scale-90 ${shuffle ? 'text-white' : 'text-zinc-600'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Back */}
              <button 
                onClick={prev} 
                className="p-2 text-zinc-400 active:text-white transition active:scale-90"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              {/* Play Pause */}
              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition active:scale-95 shadow-lg shadow-white/5"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-[2px]" />
                )}
              </button>

              {/* Forward */}
              <button 
                onClick={next} 
                className="p-2 text-zinc-400 active:text-white transition active:scale-90"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              {/* Repeat */}
              <button 
                onClick={handleRepeatToggle} 
                className={`p-2 transition active:scale-90 ${repeat !== 'none' ? 'text-white' : 'text-zinc-600'}`}
              >
                {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Like & Download Actions */}
            <div className="flex items-center justify-around border-t border-zinc-900 pt-6">
              <button 
                onClick={handleLikeClick} 
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-800 transition active:scale-95 ${
                  isLiked ? 'text-white bg-zinc-900 border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloadingTrack(currentTrack);
                }} 
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UP NEXT QUEUE SIDE PANEL DRAWER (Desktop fixed drawer / Mobile bottom slide) */}
      {showQueuePanel && (
        <div className="fixed top-16 bottom-16 md:bottom-20 right-0 w-full sm:w-80 bg-black border-l border-zinc-900 shadow-2xl backdrop-blur-md z-30 p-6 flex flex-col transition-all duration-300">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-white animate-pulse" />
                Play Queue
              </h3>
              <span className="text-[10px] text-zinc-500 font-medium">Syncs automatically to cloud</span>
            </div>
            <div className="flex items-center gap-3">
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => setShowQueuePanel(false)}
                className="text-[10px] font-bold text-zinc-500 hover:text-white md:hidden"
              >
                Close
              </button>
            </div>
          </div>

          {/* Currently playing focus */}
          <div className="mb-4">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider block mb-2">Now Playing</span>
            <div className="flex items-center gap-3 p-2 bg-zinc-900/40 border border-zinc-850 rounded-xl">
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-8 h-8 rounded-full object-cover" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white truncate block">{currentTrack.title}</span>
                <span className="text-[10px] text-zinc-550 truncate block mt-0.5">{currentTrack.artist}</span>
              </div>
            </div>
          </div>

          {/* Remaining Queue Scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider block mb-2">Next Up ({queue.length})</span>
            {queue.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-6 h-6 text-zinc-800 mb-2" />
                <p className="text-[11px] text-zinc-500 font-semibold">Queue is empty</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">Add songs from search page to keep the flow alive.</p>
              </div>
            ) : (
              queue.map((track, idx) => (
                <TrackRow key={`${track.id}-${idx}`} track={track} index={idx} showRemove={true} />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
