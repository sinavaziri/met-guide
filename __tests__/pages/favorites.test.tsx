/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FavoritesPage from '@/app/favorites/page';
import { getFavorites, getRecentlyViewed, toggleFavorite } from '@/lib/favorites';

// Mock the favorites library
jest.mock('@/lib/favorites', () => ({
  getFavorites: jest.fn(),
  getRecentlyViewed: jest.fn(),
  toggleFavorite: jest.fn(),
}));

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

describe('FavoritesPage', () => {
  const mockFavorites = [
    {
      objectID: 1,
      title: 'Artwork 1',
      artistDisplayName: 'Artist 1',
      primaryImageSmall: 'https://example.com/1.jpg',
      objectDate: '2020',
      department: 'European Paintings',
    },
    {
      objectID: 2,
      title: 'Artwork 2',
      artistDisplayName: 'Artist 2',
      primaryImageSmall: 'https://example.com/2.jpg',
      objectDate: '2021',
      department: 'Modern Art',
    },
  ];

  const mockRecent = [
    {
      objectID: 3,
      title: 'Recent Artwork',
      artistDisplayName: 'Recent Artist',
      primaryImageSmall: 'https://example.com/3.jpg',
      objectDate: '2022',
      department: 'Contemporary',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getFavorites as jest.Mock).mockReturnValue(mockFavorites);
    (getRecentlyViewed as jest.Mock).mockReturnValue(mockRecent);
  });

  it('should render favorites tab by default', () => {
    render(<FavoritesPage />);
    expect(screen.getByText('My Collection')).toBeInTheDocument();
    expect(screen.getByText('Artwork 1')).toBeInTheDocument();
    expect(screen.getByText('Artwork 2')).toBeInTheDocument();
  });

  it('should display correct favorite count', () => {
    render(<FavoritesPage />);
    expect(screen.getByText(/Favorites \(2\)/)).toBeInTheDocument();
  });

  it('should display correct recent count', () => {
    render(<FavoritesPage />);
    expect(screen.getByText(/Recent \(1\)/)).toBeInTheDocument();
  });

  it('should switch to recent tab when clicked', () => {
    render(<FavoritesPage />);
    const recentTab = screen.getByText(/Recent \(1\)/);
    fireEvent.click(recentTab);
    expect(screen.getByText('Recent Artwork')).toBeInTheDocument();
    expect(screen.queryByText('Artwork 1')).not.toBeInTheDocument();
  });

  it('should show empty state when no favorites', () => {
    (getFavorites as jest.Mock).mockReturnValue([]);
    render(<FavoritesPage />);
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    expect(screen.getByText('Start building your personal collection by tapping the heart icon on any artwork you love.')).toBeInTheDocument();
  });

  it('should show empty state when no recent items', () => {
    (getRecentlyViewed as jest.Mock).mockReturnValue([]);
    render(<FavoritesPage />);
    const recentTab = screen.getByText(/Recent \(0\)/);
    fireEvent.click(recentTab);
    expect(screen.getByText('No recently viewed')).toBeInTheDocument();
    expect(screen.getByText('Artworks you explore will automatically appear here for quick access.')).toBeInTheDocument();
  });

  it('should navigate to artwork when clicked', () => {
    render(<FavoritesPage />);
    const artwork = screen.getByText('Artwork 1');
    fireEvent.click(artwork.closest('button')!);
    expect(mockPush).toHaveBeenCalledWith('/objects/1');
  });

  it('should call back when back button is clicked', () => {
    render(<FavoritesPage />);
    const backButton = screen.getByLabelText('Go back');
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should remove favorite when remove button is clicked', async () => {
    (getFavorites as jest.Mock)
      .mockReturnValueOnce(mockFavorites)
      .mockReturnValueOnce([mockFavorites[1]]);

    render(<FavoritesPage />);

    // Find the first artwork's container
    const artworkContainers = screen.getAllByRole('button');
    const removeButton = artworkContainers.find(btn =>
      btn.getAttribute('aria-label') === 'Remove from favorites'
    );

    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton!);

    expect(toggleFavorite).toHaveBeenCalledWith(mockFavorites[0]);

    await waitFor(() => {
      expect(getFavorites).toHaveBeenCalledTimes(2);
    });
  });

  it('should not show remove button on recent tab', () => {
    render(<FavoritesPage />);
    const recentTab = screen.getByText(/Recent \(1\)/);
    fireEvent.click(recentTab);

    const removeButton = screen.queryByLabelText('Remove from favorites');
    expect(removeButton).not.toBeInTheDocument();
  });

  it('should display artist name when available', () => {
    render(<FavoritesPage />);
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 2')).toBeInTheDocument();
  });

  it('should render images with correct src', () => {
    render(<FavoritesPage />);
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'https://example.com/1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/2.jpg');
  });
});
