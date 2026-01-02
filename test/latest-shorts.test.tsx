import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LatestShorts from '@/components/LatestShorts';

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

describe('LatestShorts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }) as Promise<globalThis.Response>
    );
  });

  it('should display section title', () => {
    render(<LatestShorts channelId="UCtest123" />, { wrapper: createWrapper() });
    expect(screen.getByText(/latest shorts/i)).toBeInTheDocument();
  });

  it('should show configuration message when no channel ID provided', () => {
    render(<LatestShorts />, { wrapper: createWrapper() });
    expect(screen.getByText(/configure your youtube channel id/i)).toBeInTheDocument();
  });

  it('should render without crashing with channel ID', () => {
    render(<LatestShorts channelId="UCtest123" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('text-shorts-title')).toBeInTheDocument();
  });
});

