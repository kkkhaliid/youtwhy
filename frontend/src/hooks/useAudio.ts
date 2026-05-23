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
  const ytPlayerRef = useRef<any>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isYoutubeTrack, setIsYoutubeTrack] = useState(false);
  const [ytReady, setYtReady] = useState(false);

  // Initialize YouTube Player IFrame API and HTML5 Audio
  useEffect(() => {
    // 1. Setup HTML5 Audio element
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isYoutubeTrack) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (!isYoutubeTrack) {
        setDuration(audio.duration || currentTrack?.duration || 0);
        setIsBuffering(false);
      }
    };

    const onPlay = () => {
      if (!isYoutubeTrack) {
        setPlaying(true);
        setIsBuffering(false);
      }
    };

    const onPause = () => {
      if (!isYoutubeTrack) {
        setPlaying(false);
      }
    };

    const onWaiting = () => {
      if (!isYoutubeTrack) {
        setIsBuffering(true);
      }
    };

    const onPlaying = () => {
      if (!isYoutubeTrack) {
        setIsBuffering(false);
      }
    };

    const onEnded = () => {
      if (!isYoutubeTrack) {
        if (repeat === 'one') {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          next();
        }
      }
    };

    const onError = (e: any) => {
      if (!isYoutubeTrack) {
        console.error('[AUDIO HOOK] HTML5 Playback error:', e);
        setIsBuffering(false);
        setError('Playback failed. Skipping track...');
        
        setTimeout(() => {
          setError(null);
          next();
        }, 3000);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.volume = volume;

    // 2. Setup YouTube Player container and load IFrame script
    const initPlayer = () => {
      const win = window as any;
      if (win.YT && win.YT.Player && !ytPlayerRef.current) {
        // Create hidden element in body to mount iframe
        let container = document.getElementById('youtube-player-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'youtube-player-container';
          container.style.position = 'absolute';
          container.style.width = '1px';
          container.style.height = '1px';
          container.style.opacity = '0';
          container.style.pointerEvents = 'none';
          document.body.appendChild(container);
        }

        ytPlayerRef.current = new win.YT.Player('youtube-player-container', {
          height: '1',
          width: '1',
          videoId: '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1
          },
          events: {
            onReady: (event: any) => {
              console.log('[AUDIO HOOK] YouTube IFrame Player Initialized.');
              event.target.setVolume(volume * 100);
              setYtReady(true);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
              if (event.data === 1) {
                setPlaying(true);
                setIsBuffering(false);
                const dur = event.target.getDuration();
                if (dur) setDuration(dur);
              } else if (event.data === 2) {
                setPlaying(false);
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                setIsBuffering(false);
                if (repeat === 'one') {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else {
                  next();
                }
              }
            },
            onError: (event: any) => {
              console.error('[AUDIO HOOK] YouTube playback failed. Code:', event.data);
              setIsBuffering(false);
              setError('Playback unavailable on client. Skipping...');
              setTimeout(() => {
                setError(null);
                next();
              }, 3000);
            }
          }
        });
      }
    };

    if (!(window as any).YT) {
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      
      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    } else {
      initPlayer();
    }

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
    if (ytPlayerRef.current && ytReady) {
      try {
        ytPlayerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }
  }, [volume, ytReady]);

  // Sync song changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentTrack) {
      // YouTube IDs are 11 characters long with no slashes or dots
      const isYoutube = currentTrack.id.length === 11 && !currentTrack.id.includes('/') && !currentTrack.id.includes('.');
      setIsYoutubeTrack(isYoutube);

      if (isYoutube) {
        // Pause HTML5
        audioRef.current.pause();
        audioRef.current.src = '';

        // Load YouTube video
        if (ytPlayerRef.current && ytReady) {
          console.log(`[AUDIO HOOK] Playback routed to YT Client Player: ${currentTrack.title}`);
          try {
            ytPlayerRef.current.loadVideoById({
              videoId: currentTrack.id,
              startSeconds: 0
            });
            if (isPlaying) {
              ytPlayerRef.current.playVideo();
            } else {
              ytPlayerRef.current.pauseVideo();
            }
          } catch (e) {}
        }
      } else {
        // Stop YouTube Player
        if (ytPlayerRef.current && ytReady) {
          try { ytPlayerRef.current.stopVideo(); } catch (e) {}
        }

        // Load HTML5
        const streamUrl = `${API_BASE_URL}/stream/${currentTrack.id}`;
        console.log(`[AUDIO HOOK] Playback routed to HTML5 stream: ${currentTrack.title}`);
        audioRef.current.src = streamUrl;
        audioRef.current.load();
        if (isPlaying) {
          setIsBuffering(true);
          audioRef.current.play().catch(() => setPlaying(false));
        }
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = '';
      if (ytPlayerRef.current && ytReady) {
        try { ytPlayerRef.current.stopVideo(); } catch (e) {}
      }
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack, ytReady]);

  // Sync play/pause commands
  useEffect(() => {
    if (!currentTrack) return;

    if (isYoutubeTrack) {
      if (ytPlayerRef.current && ytReady) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.playVideo();
          } else {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (e) {}
      }
    } else {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.play().catch(() => setPlaying(false));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, isYoutubeTrack, ytReady]);

  // Poll YouTube play time when active
  useEffect(() => {
    let interval: any;
    if (isPlaying && isYoutubeTrack && ytPlayerRef.current && ytReady) {
      interval = setInterval(() => {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          setCurrentTime(time || 0);
          
          const dur = ytPlayerRef.current.getDuration();
          if (dur && dur !== duration) {
            setDuration(dur);
          }
        } catch (e) {}
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isYoutubeTrack, ytReady, duration]);

  // Seek helper function
  const seek = (time: number) => {
    if (isYoutubeTrack) {
      if (ytPlayerRef.current && ytReady) {
        try {
          ytPlayerRef.current.seekTo(time, true);
          setCurrentTime(time);
        } catch (e) {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
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
