/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from '@/components/AudioPlayer';
import { useAudio } from '@/lib/audio-context';

// Mock the audio context hook
jest.mock('@/lib/audio-context', () => ({
  useAudio: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('AudioPlayer', () => {
  const mockUseAudio = useAudio as jest.MockedFunction<typeof useAudio>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when there is no current track', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      progress: 0,
      duration: 0,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    const { container } = render(<AudioPlayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should render player when there is a current track', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: false,
      progress: 30,
      duration: 120,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    expect(screen.getByText('Test Artwork')).toBeInTheDocument();
    expect(screen.getByText('0:30 / 2:00')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: true,
      progress: 0,
      duration: 0,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    const playButton = screen.getByLabelText('Play');
    expect(playButton).toBeDisabled();
  });

  it('should call pause when clicking pause button', () => {
    const mockPause = jest.fn();

    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: true,
      isLoading: false,
      progress: 30,
      duration: 120,
      error: null,
      pause: mockPause,
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    const pauseButton = screen.getByLabelText('Pause');
    fireEvent.click(pauseButton);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('should call resume when clicking play button', () => {
    const mockResume = jest.fn();

    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: false,
      progress: 30,
      duration: 120,
      error: null,
      pause: jest.fn(),
      resume: mockResume,
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);
    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it('should call stop when clicking close button', () => {
    const mockStop = jest.fn();

    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: false,
      progress: 30,
      duration: 120,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: mockStop,
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    const closeButton = screen.getByLabelText('Close player');
    fireEvent.click(closeButton);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('should display error message when there is an error', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: false,
      progress: 0,
      duration: 0,
      error: 'Failed to load audio',
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    expect(screen.getByText('Failed to load audio')).toBeInTheDocument();
  });

  it('should calculate progress percentage correctly', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: true,
      isLoading: false,
      progress: 60,
      duration: 120,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    const { container } = render(<AudioPlayer />);
    const progressBar = container.querySelector('.bg-amber-500');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('should format time correctly', () => {
    mockUseAudio.mockReturnValue({
      currentTrack: {
        objectId: 123,
        title: 'Test Artwork',
        audioUrl: 'https://example.com/audio.mp3',
      },
      isPlaying: false,
      isLoading: false,
      progress: 65,
      duration: 125,
      error: null,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
    });

    render(<AudioPlayer />);
    expect(screen.getByText('1:05 / 2:05')).toBeInTheDocument();
  });
});
