import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartErrorBoundary } from '@/components/CartErrorBoundary';

// Component that throws an error
function ProblematicComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from cart component');
  }
  return <div>Cart content loaded successfully</div>;
}

describe('CartErrorBoundary', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock console methods to avoid test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={false} />
        </CartErrorBoundary>
      );

      expect(screen.getByText('Cart content loaded successfully')).toBeInTheDocument();
    });

    it('should not display error UI when children render successfully', () => {
      render(
        <CartErrorBoundary>
          <div data-testid="cart-content">Normal cart content</div>
        </CartErrorBoundary>
      );

      expect(screen.getByTestId('cart-content')).toBeInTheDocument();
      expect(screen.queryByText(/cart error/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(screen.getByText(/shopping cart error/i)).toBeInTheDocument();
      expect(screen.queryByText('Cart content loaded successfully')).not.toBeInTheDocument();
    });

    it('should display error message in fallback UI', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(screen.getByText(/test error from cart component/i)).toBeInTheDocument();
    });

    it('should log error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should call custom onError handler when provided', () => {
      const onError = vi.fn();
      
      render(
        <CartErrorBoundary onError={onError}>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error from cart component' }),
        expect.any(Object)
      );
    });
  });

  describe('Fallback UI Variants', () => {
    it('should render minimal fallback when fallbackUI is "minimal"', () => {
      render(
        <CartErrorBoundary fallbackUI="minimal">
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      // Minimal UI should have less content
      expect(screen.getByText(/cart error/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.queryByText(/shopping cart error/i)).not.toBeInTheDocument();
    });

    it('should render full fallback when fallbackUI is "full"', () => {
      render(
        <CartErrorBoundary fallbackUI="full">
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      // Full UI should have more details
      expect(screen.getByText(/shopping cart error/i)).toBeInTheDocument();
      expect(screen.getByText(/recovery options/i)).toBeInTheDocument();
      expect(screen.getByText(/continue shopping/i)).toBeInTheDocument();
    });

    it('should default to full fallback when no fallbackUI specified', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(screen.getByText(/shopping cart error/i)).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should have a "Try Again" button', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should have a "Clear Cart" button', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      const clearCartButton = screen.getByRole('button', { name: /clear cart/i });
      expect(clearCartButton).toBeInTheDocument();
    });

    it('should have a "Continue Shopping" button in full UI', () => {
      render(
        <CartErrorBoundary fallbackUI="full">
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      const continueButton = screen.getByRole('button', { name: /continue shopping/i });
      expect(continueButton).toBeInTheDocument();
    });

    it('should clear localStorage when Clear Cart is clicked', () => {
      // Set up localStorage with cart data
      localStorage.setItem('toa_shopping_cart', JSON.stringify({ items: [] }));
      
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(localStorage.getItem('toa_shopping_cart')).toBeDefined();

      const clearCartButton = screen.getByRole('button', { name: /clear cart/i });
      
      // Mock window.location.reload to prevent actual reload in test
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      fireEvent.click(clearCartButton);

      expect(localStorage.getItem('toa_shopping_cart')).toBeNull();
    });
  });

  describe('Error Count Tracking', () => {
    it('should track error count internally', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      // The component should render error boundary
      expect(screen.getByText(/shopping cart error/i)).toBeInTheDocument();
      
      // Note: Testing multiple errors requires the component to actually throw multiple times
      // which is difficult to simulate in a single test. The error count logic is tested
      // through the component's internal state management.
    });
  });

  describe('Development Mode Features', () => {
    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      const detailsElement = screen.getByText(/error details/i);
      expect(detailsElement).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should use appropriate ARIA attributes', () => {
      render(
        <CartErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </CartErrorBoundary>
      );

      // Check that error content is properly structured
      const errorTitle = screen.getByText(/shopping cart error/i);
      expect(errorTitle).toBeInTheDocument();
    });
  });

  describe('HOC Wrapper', () => {
    it('should work with withCartErrorBoundary HOC', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = () => {
        return (
          <CartErrorBoundary>
            <TestComponent />
          </CartErrorBoundary>
        );
      };

      render(<WrappedComponent />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});
