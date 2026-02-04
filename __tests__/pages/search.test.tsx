/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '@/app/search/page';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render search input and suggestions', () => {
    render(<SearchPage />);
    expect(screen.getByPlaceholderText('Search by artist, title, keyword...')).toBeInTheDocument();
    expect(screen.getByText('Try searching for:')).toBeInTheDocument();
    expect(screen.getByText('Monet')).toBeInTheDocument();
    expect(screen.getByText('Van Gogh')).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Picasso' } });
    expect(input.value).toBe('Picasso');
  });

  it('should disable search button when input is empty', () => {
    render(<SearchPage />);
    const searchButton = screen.getByText('Go');
    expect(searchButton).toBeDisabled();
  });

  it('should enable search button when input has text', () => {
    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    expect(searchButton).not.toBeDisabled();
  });

  it('should trigger search when Enter key is pressed', async () => {
    const mockSearchResponse = {
      objectIDs: [123],
    };

    const mockObjectResponse = {
      objectID: 123,
      title: 'Water Lilies',
      artistDisplayName: 'Claude Monet',
      objectDate: '1919',
      primaryImageSmall: 'https://example.com/monet.jpg',
      department: 'European Paintings',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObjectResponse,
      });

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search?hasImages=true&q=Monet'),
        expect.any(Object)
      );
    });
  });

  it('should display search results', async () => {
    const mockSearchResponse = {
      objectIDs: [123, 456],
    };

    const mockObject1 = {
      objectID: 123,
      title: 'Water Lilies',
      artistDisplayName: 'Claude Monet',
      objectDate: '1919',
      primaryImageSmall: 'https://example.com/monet.jpg',
      department: 'European Paintings',
    };

    const mockObject2 = {
      objectID: 456,
      title: 'Impression, Sunrise',
      artistDisplayName: 'Claude Monet',
      objectDate: '1872',
      primaryImageSmall: 'https://example.com/sunrise.jpg',
      department: 'European Paintings',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObject1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObject2,
      });

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Water Lilies')).toBeInTheDocument();
      expect(screen.getByText('Impression, Sunrise')).toBeInTheDocument();
    });
  });

  it('should show no results message when search returns empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ objectIDs: [] }),
    });

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'NonexistentArtist' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try different keywords or a broader search term.')).toBeInTheDocument();
    });
  });

  it('should show error message when search fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    // Check for loading skeletons
    await waitFor(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('should navigate to artwork when result is clicked', async () => {
    const mockSearchResponse = {
      objectIDs: [123],
    };

    const mockObjectResponse = {
      objectID: 123,
      title: 'Water Lilies',
      artistDisplayName: 'Claude Monet',
      objectDate: '1919',
      primaryImageSmall: 'https://example.com/monet.jpg',
      department: 'European Paintings',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObjectResponse,
      });

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    await waitFor(() => {
      const artwork = screen.getByText('Water Lilies');
      fireEvent.click(artwork.closest('button')!);
      expect(mockPush).toHaveBeenCalledWith('/objects/123');
    });
  });

  it('should call back when back button is clicked', () => {
    render(<SearchPage />);
    const backButton = screen.getByLabelText('Go back');
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should set query when suggestion is clicked', () => {
    render(<SearchPage />);
    const suggestion = screen.getByText('Van Gogh');
    fireEvent.click(suggestion);

    const input = screen.getByPlaceholderText('Search by artist, title, keyword...') as HTMLInputElement;
    expect(input.value).toBe('Van Gogh');
  });

  it('should handle multiple rapid searches gracefully', async () => {
    const mockSearchResponse = {
      objectIDs: [123],
    };

    const mockObjectResponse = {
      objectID: 123,
      title: 'Water Lilies',
      artistDisplayName: 'Claude Monet',
      objectDate: '1919',
      primaryImageSmall: 'https://example.com/monet.jpg',
      department: 'European Paintings',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValue({
        ok: true,
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObjectResponse,
      });

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('Search by artist, title, keyword...');

    // First search
    fireEvent.change(input, { target: { value: 'Monet' } });
    const searchButton = screen.getByText('Go');
    fireEvent.click(searchButton);

    // Second search immediately after
    fireEvent.change(input, { target: { value: 'Van Gogh' } });
    fireEvent.click(searchButton);

    // Should handle this gracefully without errors
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
