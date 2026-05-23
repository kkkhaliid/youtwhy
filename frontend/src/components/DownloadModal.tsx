'use client';

import { useState } from 'react';
import { X, Copy, ExternalLink, ShieldAlert, Sparkles, Check } from 'lucide-react';
import usePlayerStore from '../store/usePlayerStore';

export default function DownloadModal() {
  const { downloadingTrack, setDownloadingTrack } = usePlayerStore() as any;
  const [copied, setCopied] = useState(false);

  if (!downloadingTrack) return null;

  const ytUrl = `https://www.youtube.com/watch?v=${downloadingTrack.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ytUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.03)] select-none animate-[scaleIn_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Grid */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Bypass Security Protocol</span>
          </div>
          <button 
            onClick={() => setDownloadingTrack(null)}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Explanatory Banner */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white leading-snug">YouTube Cloud IP Restrained</h3>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              YouTube blocks cloud host networks (Hugging Face / AWS) from processing media file downloads. To bypass this restriction securely, use your residential IP address to download the track in 3 quick steps:
            </p>
          </div>

          {/* Focused Track Row */}
          <div className="flex items-center gap-3.5 p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl">
            <img 
              src={downloadingTrack.thumbnail} 
              alt={downloadingTrack.title} 
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-zinc-950 border border-zinc-800"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate block">{downloadingTrack.title}</span>
              <span className="text-[10px] text-zinc-500 truncate block mt-0.5">{downloadingTrack.artist}</span>
            </div>
          </div>

          {/* Step Sequence */}
          <div className="space-y-4 text-xs font-medium">
            {/* Step 1: Copy Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Step 1: Copy Original Stream URL</span>
                {copied && (
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 font-mono uppercase">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 p-1 bg-black border border-zinc-900 rounded-xl">
                <input 
                  type="text" 
                  readOnly 
                  value={ytUrl}
                  className="flex-1 bg-transparent px-3 py-2 text-zinc-400 text-xs font-mono select-all outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-950/30 border border-emerald-800 text-emerald-400' 
                      : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
            </div>

            {/* Step 2 & 3 */}
            <div className="space-y-3 pt-1 text-[11px] leading-relaxed text-zinc-400">
              <div className="flex gap-2">
                <span className="text-zinc-500 font-mono font-bold">02.</span>
                <span>Open **cobalt.tools** (the absolute cleanest, 100% free, open-source, ad-free download portal).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 font-mono font-bold">03.</span>
                <span>Paste the copied link and click download to fetch your track instantly!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-zinc-900 bg-zinc-900/10 flex items-center justify-end gap-3">
          <button 
            onClick={() => setDownloadingTrack(null)}
            className="px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <a
            href="https://cobalt.tools"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDownloadingTrack(null)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-white/5"
          >
            Go to Cobalt
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
