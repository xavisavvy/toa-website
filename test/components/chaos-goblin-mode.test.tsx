import { render, screen, fireEvent } from '@testing-library/react';
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

    it('should not block user interaction', () => {
      const onComplete = vi.fn();
      const { container } = render(<ChaosGoblinMode active={true} onComplete={onComplete} />);
      
      const overlay = container.querySelector('.pointer-events-none');
      expect(overlay).toBeInTheDocument();
    });
  });
});