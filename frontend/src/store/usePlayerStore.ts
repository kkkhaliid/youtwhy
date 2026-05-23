import { create } from 'zustand';
import api from '../utils/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  shuffledQueue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  
  likedTracks: Track[];
  history: Track[];
  
  downloadingTrack: Track | null;
  setDownloadingTrack: (track: Track | null) => void;
  
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  setRepeat: (mode: 'none' | 'one' | 'all') => void;
  
  fetchLikes: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  fetchHistory: () => Promise<void>;
  addHistory: (track: Track) => Promise<void>;
  syncQueue: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Helpers
  const getNextIndex = (index: number, queueLength: number, repeat: string) => {
    if (queueLength === 0) return -1;
    if (index >= queueLength - 1) {
      return repeat === 'all' ? 0 : -1;
    }
    return index + 1;
  };

  const getPrevIndex = (index: number, queueLength: number, repeat: string) => {
    if (queueLength === 0) return -1;
    if (index <= 0) {
      return repeat === 'all' ? queueLength - 1 : -1;
    }
    return index - 1;
  };

  const shuffleArray = (array: Track[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  return {
    currentTrack: null,
    queue: [],
    shuffledQueue: [],
    currentIndex: -1,
    isPlaying: false,
    volume: 0.8, // 80% default
    shuffle: false,
    repeat: 'none',
    likedTracks: [],
    history: [],
    downloadingTrack: null,
    setDownloadingTrack: (track) => set({ downloadingTrack: track }),

    setTrack: (track) => {
      const state = get();
      const currentQueue = state.shuffle ? state.shuffledQueue : state.queue;
      
      // Check if track is already in the queue, find its index
      let index = currentQueue.findIndex((t) => t.id === track.id);
      
      if (index === -1) {
        // If not in queue, insert it after the current index and play it
        const newQueue = [...state.queue];
        const insertPos = state.currentIndex + 1;
        newQueue.splice(insertPos, 0, track);
        
        const newShuffled = state.shuffle ? shuffleArray(newQueue) : [];
        const finalQueue = state.shuffle ? newShuffled : newQueue;
        const newIdx = finalQueue.findIndex((t) => t.id === track.id);
        
        set({
          queue: newQueue,
          shuffledQueue: newShuffled,
          currentTrack: track,
          currentIndex: newIdx,
          isPlaying: true,
        });
      } else {
        // If already in queue, just jump to that index
        set({
          currentTrack: track,
          currentIndex: index,
          isPlaying: true,
        });
      }

      // Add to history asynchronously
      state.addHistory(track);
    },

    setQueue: (tracks) => {
      const state = get();
      const shuffled = state.shuffle ? shuffleArray(tracks) : [];
      set({
        queue: tracks,
        shuffledQueue: shuffled,
        currentIndex: tracks.length > 0 ? 0 : -1,
        currentTrack: tracks.length > 0 ? tracks[0] : null,
      });
      // Synchronize with backend
      state.syncQueue();
    },

    addToQueue: (track) => {
      const state = get();
      // Avoid duplicate track additions in direct sequence
      if (state.queue.some((t) => t.id === track.id)) return;
      
      const newQueue = [...state.queue, track];
      const newShuffled = state.shuffle ? [...state.shuffledQueue, track] : [];
      
      set({
        queue: newQueue,
        shuffledQueue: newShuffled,
      });

      state.syncQueue();
    },

    removeFromQueue: (id) => {
      const state = get();
      const newQueue = state.queue.filter((t) => t.id !== id);
      const newShuffled = state.shuffledQueue.filter((t) => t.id !== id);
      
      let newIdx = state.currentIndex;
      if (state.currentTrack?.id === id) {
        newIdx = newQueue.length > 0 ? Math.min(state.currentIndex, newQueue.length - 1) : -1;
      } else {
        const currentActiveQueue = state.shuffle ? state.shuffledQueue : state.queue;
        const oldTrack = state.currentTrack;
        newIdx = oldTrack ? newQueue.findIndex((t) => t.id === oldTrack.id) : -1;
      }

      set({
        queue: newQueue,
        shuffledQueue: newShuffled,
        currentIndex: newIdx,
        currentTrack: newIdx !== -1 ? (state.shuffle ? newShuffled : newQueue)[newIdx] : null,
      });

      state.syncQueue();
    },

    clearQueue: () => {
      set({
        queue: [],
        shuffledQueue: [],
        currentIndex: -1,
        currentTrack: null,
        isPlaying: false,
      });
      get().syncQueue();
    },

    togglePlay: () => {
      const state = get();
      if (!state.currentTrack) return;
      set({ isPlaying: !state.isPlaying });
    },

    setPlaying: (isPlaying) => {
      set({ isPlaying });
    },

    next: () => {
      const state = get();
      const activeQueue = state.shuffle ? state.shuffledQueue : state.queue;
      
      if (activeQueue.length === 0) return;
      
      // Handle repeat = 'one'
      if (state.repeat === 'one' && state.currentTrack) {
        // Force state update to trigger seek to 0 in audio element
        set({ isPlaying: false });
        setTimeout(() => set({ isPlaying: true }), 50);
        return;
      }

      const nextIdx = getNextIndex(state.currentIndex, activeQueue.length, state.repeat);
      if (nextIdx !== -1) {
        set({
          currentIndex: nextIdx,
          currentTrack: activeQueue[nextIdx],
          isPlaying: true,
        });
        state.addHistory(activeQueue[nextIdx]);
      } else {
        // End of queue
        set({ isPlaying: false });
      }
    },

    prev: () => {
      const state = get();
      const activeQueue = state.shuffle ? state.shuffledQueue : state.queue;
      
      if (activeQueue.length === 0) return;

      const prevIdx = getPrevIndex(state.currentIndex, activeQueue.length, state.repeat);
      if (prevIdx !== -1) {
        set({
          currentIndex: prevIdx,
          currentTrack: activeQueue[prevIdx],
          isPlaying: true,
        });
        state.addHistory(activeQueue[prevIdx]);
      }
    },

    setVolume: (volume) => {
      set({ volume: Math.max(0, Math.min(1, volume)) });
    },

    toggleShuffle: () => {
      const state = get();
      const currentTrack = state.currentTrack;
      const newShuffle = !state.shuffle;

      if (newShuffle) {
        const shuffled = shuffleArray(state.queue);
        let newIdx = -1;
        if (currentTrack) {
          // Keep current playing track as active, place it first in the shuffled queue or find its index
          newIdx = shuffled.findIndex((t) => t.id === currentTrack.id);
        }
        set({
          shuffle: newShuffle,
          shuffledQueue: shuffled,
          currentIndex: newIdx,
        });
      } else {
        let newIdx = -1;
        if (currentTrack) {
          newIdx = state.queue.findIndex((t) => t.id === currentTrack.id);
        }
        set({
          shuffle: newShuffle,
          currentIndex: newIdx,
        });
      }
    },

    setRepeat: (mode) => {
      set({ repeat: mode });
    },

    // ==========================================
    // BACKEND SYNC OPERATIONS (Likes & History)
    // ==========================================
    
    fetchLikes: async () => {
      try {
        const response = await api.get('/music/likes');
        set({ likedTracks: response.data });
      } catch (err) {
        // Fail silently or handle
      }
    },

    toggleLike: async (track) => {
      const state = get();
      const isAlreadyLiked = state.likedTracks.some((t) => t.id === track.id);
      
      // Optimistic UI updates
      let updatedLikes: Track[];
      if (isAlreadyLiked) {
        updatedLikes = state.likedTracks.filter((t) => t.id !== track.id);
      } else {
        updatedLikes = [track, ...state.likedTracks];
      }
      
      set({ likedTracks: updatedLikes });

      try {
        await api.post('/music/likes/toggle', {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          duration: track.duration,
        });
      } catch (err) {
        // Rollback on error
        set({ likedTracks: state.likedTracks });
      }
    },

    fetchHistory: async () => {
      try {
        const response = await api.get('/music/history');
        set({ history: response.data });
      } catch (err) {
        // Fail silently
      }
    },

    addHistory: async (track) => {
      // Optimistic state
      const state = get();
      const updatedHistory = [track, ...state.history.filter((t) => t.id !== track.id)].slice(0, 50);
      set({ history: updatedHistory });

      try {
        await api.post('/music/history', {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          duration: track.duration,
        });
      } catch (err) {
        // Fail silently as logging history failure shouldn't disrupt UX
      }
    },

    syncQueue: async () => {
      const state = get();
      try {
        await api.post('/music/queue', {
          tracks: state.queue,
        });
      } catch (err) {
        // Fail silently
      }
    },
  };
});

export default usePlayerStore;
