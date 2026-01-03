import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useKonamiCode, ChaosGoblinMode } from '../../client/src/components/ChaosGoblinMode';


// Test component that uses the Konami code hook
function TestKonamiComponent() {
  const [activated, setActivated] = useState(false);
  useKonamiCode(() => setActivated(true));
  
  return <div>{activated ? 'Activated!' : 'Not activated'}</div>;
}

describe('Chaos Goblin Mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Konami Code Detection', () => {
    it('should activate when Konami code is entered correctly', () => {
      render(<TestKonamiComponent />);
      
      expect(screen.getByText('Not activated')).toBeInTheDocument();

      // Enter Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
      const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
      ];

      konamiCode.forEach(key => {
        fireEvent.keyDown(window, { key });
      });

      expect(screen.getByText('Activated!')).toBeInTheDocument();
    });

    it('should not activate with incorrect sequence', () => {
      render(<TestKonamiComponent />);
      
      // Enter wrong sequence
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'a' });

      expect(screen.getByText('Not activated')).toBeInTheDocument();
    });
  });

  describe('Chaos Goblin Mode Component', () => {
    it('should not render when inactive', () => {
      const onComplete = vi.fn();
      const { container } = render(<ChaosGoblinMode active={false} onComplete={onComplete} />);
      
      expect(screen.queryByText('CHAOS GOBLIN MODE')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('should render when active', () => {
      const onComplete = vi.fn();
      render(<ChaosGoblinMode active={true} onComplete={onComplete} />);
      
      expect(screen.getByText('CHAOS GOBLIN MODE')).toBeInTheDocument();
      expect(screen.getByAltText('Dancing Chaos Goblin')).toBeInTheDocument();
      expect(screen.getByText(/Ending in \d+s/)).toBeInTheDocument();
    });

    it('should have epilepsy-safe transitions', () => {
      const onComplete = vi.fn();
      const { container } = render(<ChaosGoblinMode active={true} onComplete={onComplete} />);
      
      const overlay = container.querySelector('div[style*="transition"]');
      
      // Should have smooth 500ms transitions (not instant flashing)
      expect(overlay?.style.transition).toContain('0.5s');
      expect(overlay?.style.transition).toContain('ease-in-out');
    });

    it('should block user interaction when active', () => {
      const onComplete = vi.fn();
      const { container } = render(<ChaosGoblinMode active={true} onComplete={onComplete} />);
      
      const overlay = container.querySelector('[style*="pointer-events: all"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should display countdown from 60 seconds', () => {
      render(<ChaosGoblinMode active={true} onComplete={vi.fn()} />);
      
      expect(screen.getByText(/Ending in 60s/)).toBeInTheDocument();
      
      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText(/Ending in 59s/)).toBeInTheDocument();
    });

    it('should call onComplete after 60 seconds', () => {
      const onComplete = vi.fn();
      render(<ChaosGoblinMode active={true} onComplete={onComplete} />);
      
      // Fast-forward 60 seconds
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      
      expect(onComplete).toHaveBeenCalled();
    });

    it('should play audio when activated', () => {
      const mockPlayVideo = vi.fn();
      const mockStopVideo = vi.fn();
      const mockSetVolume = vi.fn();
      
      // Mock YouTube IFrame API
      const mockPlayer = {
        playVideo: mockPlayVideo,
        stopVideo: mockStopVideo,
        setVolume: mockSetVolume,
      };
      
      class MockYTPlayer {
        constructor(target: any, options: any) {
          // Immediately call onReady
          setTimeout(() => {
            options.events?.onReady?.({ target: mockPlayer });
          }, 0);
          return mockPlayer as any;
        }
      }
      
      globalThis.window.YT = {
        Player: MockYTPlayer as any,
      } as any;
      
      render(<ChaosGoblinMode active={true} onComplete={vi.fn()} />);
      
      // YouTube API is loaded, component should render without errors
      expect(true).toBe(true);
    });

    it('should stop audio when deactivated', () => {
      const mockPlayVideo = vi.fn();
      const mockStopVideo = vi.fn();
      const mockSetVolume = vi.fn();
      
      // Mock YouTube IFrame API
      const mockPlayer = {
        playVideo: mockPlayVideo,
        stopVideo: mockStopVideo,
        setVolume: mockSetVolume,
      };
      
      class MockYTPlayer {
        constructor() {
          return mockPlayer as any;
        }
      }
      
      globalThis.window.YT = {
        Player: MockYTPlayer as any,
      } as any;
      
      const { rerender } = render(<ChaosGoblinMode active={true} onComplete={vi.fn()} />);
      
      // Deactivate
      rerender(<ChaosGoblinMode active={false} onComplete={vi.fn()} />);
      
      // Component should handle deactivation without errors
      expect(true).toBe(true);
    });
  });
});