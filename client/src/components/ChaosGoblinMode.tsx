import { useEffect, useState } from 'react';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function useKonamiCode(callback: () => void) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      setKeys((prevKeys) => {
        const newKeys = [...prevKeys, e.key].slice(-KONAMI_CODE.length);
        
        // Check if the sequence matches
        const matches = KONAMI_CODE.every((key, index) => key === newKeys[index]);
        
        if (matches) {
          callback();
          return []; // Reset after successful activation
        }
        
        return newKeys;
      });
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    return () => globalThis.window.removeEventListener('keydown', handleKeyDown);
  }, [callback]);

  return keys;
}

interface ChaosGoblinModeProps {
  active: boolean;
  onComplete: () => void;
}

export function ChaosGoblinMode({ active, onComplete }: ChaosGoblinModeProps) {
  const [color, setColor] = useState('#ff0000');
  const [timeLeft, setTimeLeft] = useState(60);
  const [audio] = useState(() => {
    // Check if Audio is available (mock or real)
    if (typeof globalThis.Audio === 'undefined') {
      return null;
    }
    // YouTube video ID: tB-opEiK16o = "Goblin Mode" song
    // Using direct MP3 from a CDN or local file
    const audioElement = new globalThis.Audio('/goblin-mode.mp3');
    audioElement.volume = 0.5; // 50% volume
    audioElement.loop = false;
    return audioElement;
  });

  useEffect(() => {
    if (!active) {
      setTimeLeft(60);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }

    // Play music
    if (audio) {
      audio.play().catch((err) => {
        console.warn('Failed to play Chaos Goblin audio:', err);
      });
    }

    // Safe rainbow colors (slower transition, less intense)
    const colors = [
      '#FF6B6B', // Soft red
      '#FFA06B', // Soft orange
      '#FFD96B', // Soft yellow
      '#6BFF8F', // Soft green
      '#6BCDFF', // Soft blue
      '#A06BFF', // Soft purple
      '#FF6BCD', // Soft pink
    ];

    let colorIndex = 0;
    
    // Change color every 500ms (safe, non-seizure inducing)
    const interval = globalThis.setInterval(() => {
      setColor(colors[colorIndex] || '#FF6B6B');
      colorIndex = (colorIndex + 1) % colors.length;
    }, 500);

    // Countdown timer
    const countdownInterval = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-stop after 60 seconds
    const timeout = globalThis.setTimeout(() => {
      globalThis.clearInterval(interval);
      globalThis.clearInterval(countdownInterval);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      onComplete();
    }, 60000);

    return () => {
      globalThis.clearInterval(interval);
      globalThis.clearInterval(countdownInterval);
      globalThis.clearTimeout(timeout);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [active, onComplete, audio]);

  if (!active) {return null;}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        backgroundColor: color,
        transition: 'background-color 0.5s ease-in-out', // Smooth transition
      }}
    >
      <div className="flex flex-col items-center animate-bounce">
        {/* Dancing Goblin Image */}
        <img
          src="/chaos-goblin.svg"
          alt="Dancing Chaos Goblin"
          className="w-64 h-64"
          style={{
            animation: 'goblin-dance 0.5s ease-in-out infinite alternate, goblin-spin 2s linear infinite',
          }}
        />
        
        {/* Text */}
        <h1 
          className="text-6xl font-bold mt-8 animate-pulse"
          style={{
            color: '#fff',
            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6)',
            fontFamily: 'Impact, Arial Black, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          CHAOS GOBLIN MODE
        </h1>

        {/* Countdown */}
        <p className="text-2xl text-white mt-4 font-bold drop-shadow-lg">
          Ending in {timeLeft}s
        </p>
      </div>

      {/* Additional safe animations */}
      <style>{`
        @keyframes goblin-spin {
          from { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.1); }
          to { transform: rotate(-15deg) scale(1); }
        }
        @keyframes goblin-dance {
          0% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(-10px); }
          50% { transform: translateY(0) translateX(10px); }
          75% { transform: translateY(-20px) translateX(-10px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
    </div>
  );
}
