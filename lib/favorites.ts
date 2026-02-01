const FAVORITES_KEY = 'met-guide-favorites';
const RECENT_KEY = 'met-guide-recent';
const MAX_RECENT = 20;

export interface SavedArtwork {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  primaryImageSmall: string | null;
  savedAt: number;
}

function getStorage(key: string): SavedArtwork[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function setStorage(key: string, items: SavedArtwork[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function getFavorites(): SavedArtwork[] {
  return getStorage(FAVORITES_KEY);
}

export function isFavorite(objectID: number): boolean {
  return getStorage(FAVORITES_KEY).some(f => f.objectID === objectID);
}

export function toggleFavorite(artwork: SavedArtwork): boolean {
  const favorites = getStorage(FAVORITES_KEY);
  const index = favorites.findIndex(f => f.objectID === artwork.objectID);
  if (index >= 0) {
    favorites.splice(index, 1);
    setStorage(FAVORITES_KEY, favorites);
    return false; // removed
  } else {
    favorites.unshift({ ...artwork, savedAt: Date.now() });
    setStorage(FAVORITES_KEY, favorites);
    return true; // added
  }
}

export function getRecentlyViewed(): SavedArtwork[] {
  return getStorage(RECENT_KEY);
}

export function addRecentlyViewed(artwork: SavedArtwork) {
  const recent = getStorage(RECENT_KEY).filter(r => r.objectID !== artwork.objectID);
  recent.unshift({ ...artwork, savedAt: Date.now() });
  setStorage(RECENT_KEY, recent.slice(0, MAX_RECENT));
}
