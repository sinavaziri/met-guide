/**
 * @jest-environment node
 * 
 * Milestone 1 Test: Object Detail API
 * 
 * Tests for GET /api/object/[id]
 * - Fetches object details from Met Museum API
 * - Returns normalized object data
 * - Handles 404 for non-existent objects
 * - Validates object ID format
 */

import { GET } from '@/app/api/object/[id]/route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

describe('GET /api/object/[id]', () => {
  const mockObject = {
    objectID: 547802,
    title: 'The Temple of Dendur',
    artistDisplayName: 'Unknown',
    artistDisplayBio: 'Egyptian, active 15 B.C.',
    objectDate: 'completed by 10 B.C.',
    medium: 'Aeolian sandstone',
    dimensions: '41 × 252 × 115 in. (104.1 × 640.1 × 292.1 cm)',
    department: 'Egyptian Art',
    culture: 'Egyptian',
    period: 'Late Period',
    classification: 'Architecture',
    primaryImage: 'https://images.metmuseum.org/example.jpg',
    primaryImageSmall: 'https://images.metmuseum.org/example-small.jpg',
    additionalImages: [],
    objectURL: 'https://www.metmuseum.org/art/collection/search/547802',
    isHighlight: true,
    creditLine: 'Given to the United States by Egypt in 1965',
    country: 'Egypt',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return object data for valid ID', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockObject,
    });

    const request = new NextRequest('http://localhost:3000/api/object/547802');
    const response = await GET(request, { params: { id: '547802' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.objectID).toBe(547802);
    expect(data.title).toBe('The Temple of Dendur');
    expect(data.department).toBe('Egyptian Art');
    expect(data.isHighlight).toBe(true);
  });

  it('should return normalized data with null for missing fields', async () => {
    const partialObject = {
      objectID: 123456,
      title: 'Test Object',
      // Many fields missing
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => partialObject,
    });

    const request = new NextRequest('http://localhost:3000/api/object/123456');
    const response = await GET(request, { params: { id: '123456' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.objectID).toBe(123456);
    expect(data.artistDisplayName).toBeNull();
    expect(data.medium).toBeNull();
    expect(data.primaryImage).toBeNull();
    expect(data.additionalImages).toEqual([]);
  });

  it('should return 404 for non-existent object', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const request = new NextRequest('http://localhost:3000/api/object/999999999');
    const response = await GET(request, { params: { id: '999999999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Object not found');
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/object/invalid');
    const response = await GET(request, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid object ID format');
  });

  it('should return 400 for ID with special characters', async () => {
    const request = new NextRequest('http://localhost:3000/api/object/123abc');
    const response = await GET(request, { params: { id: '123abc' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid object ID format');
  });

  it('should return 500 on API error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/object/547802');
    const response = await GET(request, { params: { id: '547802' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch object from Met API');
  });

  it('should call Met API with correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockObject,
    });

    const request = new NextRequest('http://localhost:3000/api/object/547802');
    await GET(request, { params: { id: '547802' } });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://collectionapi.metmuseum.org/public/collection/v1/objects/547802',
      expect.objectContaining({
        next: { revalidate: 3600 },
      })
    );
  });
});
