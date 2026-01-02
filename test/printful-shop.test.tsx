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

  it('should render without crashing', () => {
    render(<PrintfulShop />, { wrapper: createWrapper() });
    expect(screen.getByText(/official merchandise/i)).toBeInTheDocument();
  });

  it('should render with enableCheckout prop', () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });
    expect(screen.getByText(/official merchandise/i)).toBeInTheDocument();
  });
});
