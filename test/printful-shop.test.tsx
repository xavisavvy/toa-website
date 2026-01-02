import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PrintfulShop from '@/components/PrintfulShop';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('PrintfulShop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch by default
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }) as Promise<globalThis.Response>
    );
  });

  it('should render loading state initially', () => {
    render(<PrintfulShop />, { wrapper: createWrapper() });
    // Component should render loading skeletons
    const cards = document.querySelectorAll('.animate-pulse');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render with enableCheckout prop', () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });
    // Component should render loading skeletons
    const cards = document.querySelectorAll('.animate-pulse');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show empty state when no products', async () => {
    render(<PrintfulShop />, { wrapper: createWrapper() });
    // Wait for loading to finish and empty state to show
    const emptyMessage = await screen.findByText(/setting up our product catalog/i);
    expect(emptyMessage).toBeInTheDocument();
  });
});
