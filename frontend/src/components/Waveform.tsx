'use client';

interface WaveformProps {
  isPlaying: boolean;
  color?: string; // e.g., 'bg-cyan-400' or 'bg-violet-400'
}

export default function Waveform({ isPlaying, color = 'bg-cyan-400' }: WaveformProps) {
  const bars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex items-end gap-[3px] h-6 px-1.5" title={isPlaying ? 'Playing' : 'Paused'}>
      {bars.map((bar) => {
        // Randomize heights slightly for authentic lofi vibes
        const heightClasses = [
          'h-1.5', 'h-2.5', 'h-4', 'h-5', 'h-3.5', 'h-4.5', 'h-2', 'h-5.5', 'h-3', 'h-2'
        ];
        
        // CSS animations are enabled when isPlaying is true
        const animationDelay = `${(bar * 0.12).toFixed(2)}s`;
        const animationDuration = `${(0.8 + Math.random() * 0.6).toFixed(2)}s`;

        return (
          <div
            key={bar}
            style={{
              animationDelay: isPlaying ? animationDelay : '0s',
              animationDuration: isPlaying ? animationDuration : '1s',
            }}
            className={`w-[3px] rounded-full transition-all duration-500 origin-bottom ${color} ${
              isPlaying 
                ? 'animate-[equalizer_1.2s_ease-in-out_infinite]' 
                : 'h-1 scale-y-50'
            }`}
          />
        );
      })}
    </div>
  );
}
