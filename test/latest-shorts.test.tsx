import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders, screen, mockFetch, TestFactory } from './helpers/test-utils';

import LatestShorts from '@/components/LatestShorts';

describe('LatestShorts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.success([]);
  });

  it('should display section title', () => {
    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    expect(screen.getByText(/latest shorts/i)).toBeInTheDocument();
  });

  it('should show configuration message when no channel ID provided', () => {
    renderWithProviders(<LatestShorts />);
    expect(screen.getByText(/configure your youtube channel id/i)).toBeInTheDocument();
  });

  it('should render without crashing with channel ID', () => {
    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    expect(screen.getByTestId('text-shorts-title')).toBeInTheDocument();
  });

  it('should display shorts when API returns data', async () => {
    const mockShorts = [
      TestFactory.short({ id: 'short-1', title: 'Amazing Short 1' }),
      TestFactory.short({ id: 'short-2', title: 'Amazing Short 2' }),
    ];
    mockFetch.success(mockShorts);

    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    
    const title = await screen.findByText('Amazing Short 1');
    expect(title).toBeInTheDocument();
  });

  it('should handle API errors gracefully', () => {
    mockFetch.error(500, 'API Error');

    renderWithProviders(<LatestShorts channelId="UCtest123" />);
    
    expect(screen.getByText(/latest shorts/i)).toBeInTheDocument();
  });
});

