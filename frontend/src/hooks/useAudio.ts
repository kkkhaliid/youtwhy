import { useEffect, useRef, useState } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { API_BASE_URL } from '../utils/api';

export const useAudio = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    repeat,
    setPlaying,
    next,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Attach event listeners
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
      setIsBuffering(false);
    };

    const onPlay = () => {
      setPlaying(true);
      setIsBuffering(false);
    };

    const onPause = () => {
      setPlaying(false);
    };

    const onWaiting = () => {
      setIsBuffering(true);
    };

    const onPlaying = () => {
      setIsBuffering(false);
    };

    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        next();
      }
    };

    const onError = (e: any) => {
      console.error('[AUDIO HOOK] Playback error:', e);
      setIsBuffering(false);
      
      // If we encounter a streaming network error, it might be due to an expired CDN URL.
      // We attempt to recover by advancing or prompting a reload.
      setError('Playback failed. Recovering stream...');
      
      setTimeout(() => {
        setError(null);
        next(); // Fallback: Skip to next track
      }, 3000);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Initial volume
    audio.volume = volume;

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, []);

  // Sync volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync song changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentTrack) {
      const streamUrl = `${API_BASE_URL}/stream/${currentTrack.id}`;
      console.log(`[AUDIO HOOK] Loading new stream track: ${currentTrack.title} at url: ${streamUrl}`);
      
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      
      if (isPlaying) {
        setIsBuffering(true);
        audioRef.current.play().catch((err) => {
          console.warn('[AUDIO HOOK] Autoplay prevented or error:', err.message);
          setPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = '';
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack]);

  // Sync play/pause commands
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('[AUDIO HOOK] Play error:', err.message);
        setPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Seek helper function
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return {
    currentTime,
    duration,
    isBuffering,
    error,
    seek,
  };
};

export default useAudio;
