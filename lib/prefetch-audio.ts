/**
 * Prefetch audio guide for an artwork
 * This runs in the background to warm up the cache so audio is ready when user navigates to detail page
 */

// Track which objects we've already started prefetching to avoid duplicates
const prefetchingSet = new Set<number>();
const prefetchedSet = new Set<number>();

interface PrefetchResult {
  objectId: number;
  narration?: string;
  audioCached?: boolean;
  error?: string;
}

/**
 * Prefetch narration and audio for an artwork
 * Uses low-priority requests to avoid blocking main content
 */
export async function prefetchAudioGuide(objectId: number): Promise<PrefetchResult> {
  // Skip if already prefetching or prefetched
  if (prefetchingSet.has(objectId) || prefetchedSet.has(objectId)) {
    return { objectId, narration: undefined, audioCached: true };
  }

  prefetchingSet.add(objectId);

  try {
    // Step 1: Prefetch narration (this will be cached on server)
    const narrationResponse = await fetch(`/api/narrate?id=${objectId}`, {
      priority: 'low' as RequestPriority,
    });

    if (!narrationResponse.ok) {
      throw new Error(`Narration fetch failed: ${narrationResponse.status}`);
    }

    const { narration } = await narrationResponse.json();

    if (!narration) {
      throw new Error('No narration returned');
    }

    // Step 2: Prefetch TTS audio (this will be cached on server)
    // We use the same endpoint the player uses, so the audio gets cached
    const ttsResponse = await fetch(
      `/api/tts?id=${objectId}&text=${encodeURIComponent(narration)}`,
      {
        priority: 'low' as RequestPriority,
      }
    );

    if (!ttsResponse.ok) {
      // Audio generation failed but narration is still cached
      console.warn(`TTS prefetch failed for object ${objectId}:`, ttsResponse.status);
      prefetchedSet.add(objectId);
      return { objectId, narration, audioCached: false };
    }

    // Successfully prefetched both narration and audio
    prefetchedSet.add(objectId);
    console.log(`✅ Prefetched audio guide for object ${objectId}`);

    return { objectId, narration, audioCached: true };
  } catch (error) {
    console.warn(`Prefetch failed for object ${objectId}:`, error);
    return {
      objectId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    prefetchingSet.delete(objectId);
  }
}

/**
 * Check if an object's audio guide has been prefetched
 */
export function isAudioGuidePrefetched(objectId: number): boolean {
  return prefetchedSet.has(objectId);
}

/**
 * Clear prefetch tracking (useful for testing)
 */
export function clearPrefetchTracking(): void {
  prefetchingSet.clear();
  prefetchedSet.clear();
}

