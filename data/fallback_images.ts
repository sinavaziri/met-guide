/**
 * Fallback images for artworks where the Met API doesn't provide images
 * (usually due to copyright/non-public domain status)
 * 
 * Images are sourced from Wikimedia Commons and other public sources
 */

export interface FallbackImage {
  objectID: number;
  primaryImage: string;
  primaryImageSmall: string;
  source: string;
  license: string;
}

export const FALLBACK_IMAGES: Record<number, FallbackImage> = {
  // Madame X (Madame Pierre Gautreau) - John Singer Sargent
  12127: {
    objectID: 12127,
    primaryImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Madame_X_%28Madame_Pierre_Gautreau%29%2C_John_Singer_Sargent%2C_1884_%28unfree_frame_crop%29.jpg',
    primaryImageSmall: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Madame_X_%28Madame_Pierre_Gautreau%29%2C_John_Singer_Sargent%2C_1884_%28unfree_frame_crop%29.jpg/400px-Madame_X_%28Madame_Pierre_Gautreau%29%2C_John_Singer_Sargent%2C_1884_%28unfree_frame_crop%29.jpg',
    source: 'Wikimedia Commons',
    license: 'Public Domain',
  },
};

/**
 * Get fallback image for an artwork if available
 */
export function getFallbackImage(objectID: number): FallbackImage | null {
  return FALLBACK_IMAGES[objectID] || null;
}

export default FALLBACK_IMAGES;

