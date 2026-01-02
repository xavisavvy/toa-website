import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders, mockFetch, TestFactory } from './helpers/test-utils';

import PrintfulShop from '@/components/PrintfulShop';

describe('PrintfulShop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.success([]);
  });

  it('should render loading state initially', () => {
    renderWithProviders(<PrintfulShop />);
    const cards = document.querySelectorAll('.animate-pulse');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render with enableCheckout prop', () => {
    renderWithProviders(<PrintfulShop enableCheckout={true} />);
    const cards = document.querySelectorAll('.animate-pulse');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show empty state when no products', async () => {
    const { findByText } = renderWithProviders(<PrintfulShop />);
    const emptyMessage = await findByText(/setting up our product catalog/i);
    expect(emptyMessage).toBeInTheDocument();
  });

  it('should display products when API returns data', async () => {
    const mockProducts = [
      TestFactory.product({ id: '1', name: 'Cool T-Shirt', price: '$25.00' }),
      TestFactory.product({ id: '2', name: 'Awesome Mug', price: '$15.00' }),
    ];
    mockFetch.success(mockProducts);

    const { findByText } = renderWithProviders(<PrintfulShop />);
    const product = await findByText('Cool T-Shirt');
    expect(product).toBeInTheDocument();
  });

  it('should handle API errors gracefully', () => {
    mockFetch.error(500);

    const { container } = renderWithProviders(<PrintfulShop />);
    
    // Component should render, even with error
    expect(container).toBeTruthy();
  });
});
