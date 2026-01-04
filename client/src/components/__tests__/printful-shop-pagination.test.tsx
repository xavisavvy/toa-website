import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PrintfulShop from '../PrintfulShop';

// Mock the analytics module
vi.mock('@/lib/analytics', () => ({
  analytics: {
    viewItem: vi.fn(),
  },
}));

// Mock ProductDetailModal
vi.mock('../ProductDetailModal', () => ({
  default: () => <div>Product Detail Modal</div>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock products for testing
const mockProducts = Array.from({ length: 50 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Test Product ${i + 1}`,
  price: `$${(10 + i).toFixed(2)}`,
  image: `https://example.com/image-${i + 1}.jpg`,
  url: `https://example.com/product-${i + 1}`,
  inStock: i % 5 !== 0,
  variants: [],
}));

describe('PrintfulShop - Pagination', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      } as Response)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display pagination controls when there are more than 12 products', async () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  it('should disable Previous button on first page', async () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /Previous/i });
      expect(prevButton).toBeDisabled();
    });
  });

  it('should navigate to next page when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    });
  });

  it('should display correct number of products per page (default 12)', async () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      const productCards = screen.getAllByTestId(/card-printful-product-/);
      expect(productCards).toHaveLength(12);
    });
  });

  it('should show correct page info text', async () => {
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Showing 1-12 of 50 products/)).toBeInTheDocument();
    });
  });

  it('should reset to page 1 when applying search filter', async () => {
    const user = userEvent.setup();
    render(<PrintfulShop enableCheckout={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });
  });

  it('should not show pagination when limit prop is provided', async () => {
    render(<PrintfulShop enableCheckout={true} limit={10} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Previous/i })).not.toBeInTheDocument();
    });
  });
});
