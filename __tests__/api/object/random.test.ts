/**
 * @jest-environment node
 */

import { GET } from '@/app/api/object/random/route';

// Mock fetch globally
global.fetch = jest.fn();

describe('GET /api/object/random', () => {
  const mockObject = {
    objectID: 547802,
    title: 'The Temple of Dendur',
    artistDisplayName: 'Unknown',
    objectDate: '15 B.C.–A.D. 10',
    primaryImage: 'https://images.metmuseum.org/example.jpg',
    primaryImageSmall: 'https://images.metmuseum.org/example-small.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a highlighted object from the Met API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockObject,
    });

    const response = await GET();
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://collectionapi.metmuseum.org/public/collection/v1/objects/'),
      expect.objectContaining({ next: { revalidate: 3600 } })
    );
    expect(response.status).toBe(200);
    expect(data.objectID).toBe(547802);
    expect(data.title).toBe('The Temple of Dendur');
  });

  it('should return object with required fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockObject,
    });

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('objectID');
    expect(data).toHaveProperty('title');
    expect(data).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Failed to fetch object');
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Failed to fetch object');
  });

  it('should use the correct Met Museum API endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockObject,
    });

    await GET();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('collectionapi.metmuseum.org/public/collection/v1/objects/'),
      expect.objectContaining({ next: { revalidate: 3600 } })
    );
  });
});
